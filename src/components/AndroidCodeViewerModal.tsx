import React, { useState } from 'react';
import { Code, Copy, Check, X, Smartphone, Layers, Database, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeViewerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'LISTENER' | 'SMS' | 'DEDUP' | 'CALC' | 'NOTIF' | 'DB'>('LISTENER');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets = {
    LISTENER: {
      title: 'NotificationListener.kt',
      tech: 'Android NotificationListenerService',
      desc: 'Intercepts Google Pay, PhonePe, Paytm, CRED & Indian Bank apps in < 1 second on-device',
      code: `package com.dailyallowance.tracker.service

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.os.Bundle
import com.dailyallowance.tracker.engine.TransactionDeduplicator
import com.dailyallowance.tracker.engine.AllowanceCalculationEngine
import com.dailyallowance.tracker.notification.InstantHeadsUpManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class UpiNotificationListenerService : NotificationListenerService() {

    private val monitoredPackages = setOf(
        "com.google.android.apps.nbu.paisa.user", // Google Pay India
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                       // Paytm
        "com.dreamplug.androidapp",              // CRED
        "in.amazon.mShop.android.shopping",      // Amazon Pay
        "com.freecharge.android",                // Freecharge
        "com.msf.kbank.mobile",                  // Kotak Bank
        "com.icicibank.imobile"                  // iMobile
    )

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val sbnNotNull = sbn ?: return
        val packageName = sbnNotNull.packageName

        if (!monitoredPackages.contains(packageName)) return

        val extras: Bundle = sbnNotNull.notification.extras ?: return
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        val rawCombined = "$title $text"

        CoroutineScope(Dispatchers.Default).launch {
            // 1. Local fast regex extraction
            val parsedTx = TransactionDeduplicator.parseUpiNotification(rawCombined, packageName)
            if (parsedTx != null) {
                // 2. Check 120s sliding window deduplication against recent Bank SMS
                val isDuplicate = TransactionDeduplicator.isDuplicate(parsedTx)
                if (!isDuplicate) {
                    // 3. Compute new real-time daily ledger
                    val ledgerUpdate = AllowanceCalculationEngine.recordSpend(parsedTx)

                    // 4. Fire High-Priority Instant Heads-Up Pop-Up Banner (< 1s latency)
                    InstantHeadsUpManager.showInstantPopUp(
                        context = applicationContext,
                        transaction = parsedTx,
                        updatedLedger = ledgerUpdate
                    )
                }
            }
        }
    }
}`
    },
    SMS: {
      title: 'SmsBroadcastReceiver.kt',
      tech: 'Android BroadcastReceiver (SMS_RECEIVED)',
      desc: 'Parses official Indian Bank debit alerts (HDFC, ICICI, SBI, Axis, Kotak)',
      code: `package com.dailyallowance.tracker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.dailyallowance.tracker.engine.TransactionDeduplicator
import com.dailyallowance.tracker.engine.AllowanceCalculationEngine
import com.dailyallowance.tracker.notification.InstantHeadsUpManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BankSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return

        for (sms in messages) {
            val body = sms.displayMessageBody ?: continue
            val sender = sms.displayOriginatingAddress ?: ""

            // Validate Indian Bank sender code (e.g., VM-HDFCBK, AX-ICICIB, BZ-SBIINB)
            if (!isBankSenderHeader(sender)) continue

            CoroutineScope(Dispatchers.Default).launch {
                val parsed = TransactionDeduplicator.parseBankSms(body, sender) ?: return@launch
                
                // Smart Deduplication: Avoid double counting with GPay notification
                if (!TransactionDeduplicator.isDuplicate(parsed)) {
                    val updatedLedger = AllowanceCalculationEngine.recordSpend(parsed)
                    InstantHeadsUpManager.showInstantPopUp(context, parsed, updatedLedger)
                }
            }
        }
    }

    private fun isBankSenderHeader(sender: String): Boolean {
        val s = sender.uppercase()
        return s.contains("HDFC") || s.contains("ICICI") || s.contains("SBI") ||
               s.contains("AXIS") || s.contains("KOTAK") || s.contains("IDFC")
    }
}`
    },
    DEDUP: {
      title: 'TransactionDeduplicator.kt',
      tech: '120-Second Sliding Window Deduplicator',
      desc: 'Deduplicates dual triggers (Bank SMS + UPI App Notification for the same ₹250 spend)',
      code: `package com.dailyallowance.tracker.engine

import java.util.concurrent.ConcurrentLinkedQueue

object TransactionDeduplicator {
    private const val WINDOW_MS = 120_000L // 120 seconds rolling window

    data class CachedTx(
        val amount: Double,
        val utr: String?,
        val timestamp: Long,
        val source: String
    )

    private val recentTransactions = ConcurrentLinkedQueue<CachedTx>()

    @Synchronized
    fun isDuplicate(newTx: ParsedTransaction): Boolean {
        val now = System.currentTimeMillis()
        pruneOldRecords(now)

        for (cached in recentTransactions) {
            // Check 1: Exact UTR/UPI Ref match
            if (!newTx.utr.isNullOrEmpty() && newTx.utr == cached.utr) {
                return true
            }

            // Check 2: Same amount within 120 seconds across different sources
            val timeDiff = Math.abs(now - cached.timestamp)
            if (timeDiff <= WINDOW_MS && Math.abs(newTx.amount - cached.amount) < 0.01) {
                if (newTx.source != cached.source) {
                    return true
                }
            }
        }

        recentTransactions.add(CachedTx(newTx.amount, newTx.utr, now, newTx.source))
        return false
    }

    private fun pruneOldRecords(now: Long) {
        recentTransactions.removeIf { now - it.timestamp > WINDOW_MS * 2 }
    }
}`
    },
    CALC: {
      title: 'AllowanceEngine.kt',
      tech: 'Core Financial Math Engine',
      desc: 'Safe-to-Spend formula, Dynamic Rollover, Strict Wishlist Sweep, Weekend Booster',
      code: `package com.dailyallowance.tracker.engine

enum class RolloverMode { DYNAMIC, STRICT, WEEKEND_BOOST }
enum class CalcMode { SAFE_TO_SPEND, GROSS }

object AllowanceEngine {

    fun computeBaseDailyAllowance(
        monthlyIncome: Double,
        fixedShieldTotal: Double,
        savingsTarget: Double,
        daysInMonth: Int = 30,
        mode: CalcMode
    ): Double {
        return if (mode == CalcMode.GROSS) {
            monthlyIncome / daysInMonth
        } else {
            val spendablePool = Math.max(0.0, monthlyIncome - (fixedShieldTotal + savingsTarget))
            spendablePool / daysInMonth
        }
    }

    fun applyRollover(
        baseAllowance: Double,
        previousDeficit: Double,
        remainingDays: Int,
        isWeekend: Boolean,
        mode: RolloverMode
    ): Double {
        return when (mode) {
            RolloverMode.DYNAMIC -> {
                val dailyPenalty = previousDeficit / Math.max(1, remainingDays)
                Math.max(0.0, baseAllowance - dailyPenalty)
            }
            RolloverMode.STRICT -> {
                Math.max(0.0, baseAllowance - previousDeficit)
            }
            RolloverMode.WEEKEND_BOOST -> {
                val adjusted = if (isWeekend) baseAllowance * 1.20 else baseAllowance * 0.85
                Math.max(0.0, adjusted - (previousDeficit / Math.max(1, remainingDays)))
            }
        }
    }
}`
    },
    NOTIF: {
      title: 'InstantHeadsUpManager.kt',
      tech: 'NotificationCompat + Action Intents',
      desc: 'Fires high-priority heads-up pop-up with custom remote view & 3 action buttons',
      code: `package com.dailyallowance.tracker.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.dailyallowance.tracker.R

object InstantHeadsUpManager {
    private const val CHANNEL_ID = "instant_allowance_heads_up"

    fun showInstantPopUp(context: Context, tx: ParsedTransaction, ledger: DailyLedger) {
        val remaining = ledger.startingAllowance - ledger.totalSpent
        val percent = (ledger.totalSpent / ledger.startingAllowance * 100).toInt()

        val title = when {
            percent < 70 -> "💸 ₹\${tx.amount.toInt()} spent at \${tx.merchant}"
            percent in 70..99 -> "⚠️ ₹\${tx.amount.toInt()} spent on \${tx.merchant} — Slow Down!"
            else -> "🚨 Daily Allowance Exceeded by ₹\${Math.abs(remaining).toInt()}!"
        }

        // Action 1: Split Expense
        val splitIntent = Intent(context, ActionReceiver::class.java).apply {
            action = "ACTION_SPLIT"
            putExtra("TX_ID", tx.id)
        }
        val splitPending = PendingIntent.getBroadcast(context, 101, splitIntent, PendingIntent.FLAG_IMMUTABLE)

        // Action 2: Exclude from Daily Spend (Shielded)
        val excludeIntent = Intent(context, ActionReceiver::class.java).apply {
            action = "ACTION_EXCLUDE"
            putExtra("TX_ID", tx.id)
        }
        val excludePending = PendingIntent.getBroadcast(context, 102, excludeIntent, PendingIntent.FLAG_IMMUTABLE)

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_rupee_shield)
            .setContentTitle(title)
            .setContentText("₹\${remaining.toInt()} left for today (₹\${ledger.totalSpent.toInt()} of ₹\${ledger.startingAllowance.toInt()} used)")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setAutoCancel(true)
            .addAction(R.drawable.ic_split, "Split 50%", splitPending)
            .addAction(R.drawable.ic_shield, "Not Daily Spend", excludePending)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(tx.id.hashCode(), builder.build())
    }
}`
    },
    DB: {
      title: 'DatabaseSchema.kt',
      tech: 'Room SQLite + SQLCipher Encryption',
      desc: 'Stores transactions, budget cycles, and daily ledgers offline-first on device',
      code: `package com.dailyallowance.tracker.data

import androidx.room.*

@Entity(tableName = "budget_cycles")
data class BudgetCycleEntity(
    @PrimaryKey val id: String,
    val startDate: String,
    val endDate: String,
    val monthlyIncome: Double,
    val fixedCommitmentsTotal: Double,
    val savingsTarget: Double,
    val spendablePool: Double,
    val baseDailyAllowance: Double,
    val rolloverMode: String // DYNAMIC | STRICT | WEEKEND_BOOST
)

@Entity(tableName = "daily_ledgers")
data class DailyLedgerEntity(
    @PrimaryKey val date: String, // YYYY-MM-DD
    val cycleId: String,
    val startingAllowance: Double,
    val totalSpent: Double,
    val remainingAllowance: Double,
    val status: String, // SAFE | CAUTION | OVERSPENT
    val streakCounted: Boolean
)

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val amount: Double,
    val type: String, // DEBIT | CREDIT | REFUND
    val source: String, // UPI_NOTIF | BANK_SMS | AA_SYNC | MANUAL
    val merchantName: String,
    val upiVpa: String?,
    val categoryId: String,
    val utrReference: String?,
    val isExcludedFromDaily: Boolean,
    val splitRatio: Double,
    val effectiveDailyDeduction: Double
)`
    }
  };

  const current = codeSnippets[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl bg-[#0B0F19] border border-slate-800 rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Android Production Kotlin Architecture</h3>
              <p className="text-xs text-slate-400">Native Android Services for &lt;1s Instant Heads-Up & Deduplication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex overflow-x-auto gap-2">
          {(Object.keys(codeSnippets) as Array<keyof typeof codeSnippets>).map((key) => (
            <button
              key={key}
              onClick={() => setActiveFile(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition ${
                activeFile === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {codeSnippets[key].title}
            </button>
          ))}
        </div>

        {/* Code Description Bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-purple-300 font-mono">{current.tech}: </span>
            <span className="text-slate-400">{current.desc}</span>
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Block */}
        <div className="p-5 overflow-auto flex-1 font-mono text-xs text-slate-200 bg-[#080C14]">
          <pre className="leading-relaxed">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
