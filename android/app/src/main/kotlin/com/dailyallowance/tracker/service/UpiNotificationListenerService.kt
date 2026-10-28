package com.dailyallowance.tracker.service

import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.dailyallowance.tracker.engine.AllowanceCalculationEngine
import com.dailyallowance.tracker.engine.TransactionDeduplicator
import com.dailyallowance.tracker.notification.InstantHeadsUpManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Android NotificationListenerService for intercepting UPI payment app notifications
 * Latency: < 1 second on-device
 * Monitored apps: Google Pay, PhonePe, Paytm, CRED, Amazon Pay, BHIM, Axis/HDFC/ICICI/Kotak
 */
class UpiNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    companion object {
        private const val TAG = "UpiNotifListener"
        private val MONITORED_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user", // Google Pay
            "com.phonepe.app",                       // PhonePe
            "net.one97.paytm",                       // Paytm
            "com.dreamplug.androidapp",              // CRED
            "in.amazon.mShop.android.shopping",      // Amazon Pay
            "in.org.npci.upiapp",                    // BHIM
            "com.freecharge.android",                // Freecharge
            "com.msf.kbank.mobile",                  // Kotak Mobile
            "com.icicibank.imobile",                 // iMobile ICICI
            "com.snapwork.hdfc"                      // HDFC Mobile
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val sbnNotNull = sbn ?: return
        val packageName = sbnNotNull.packageName ?: return

        if (!MONITORED_PACKAGES.contains(packageName)) return

        val extras: Bundle = sbnNotNull.notification.extras ?: return
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        val rawContent = "$title $text $bigText".trim()
        if (rawContent.isBlank()) return

        Log.d(TAG, "Intercepted notification from $packageName: $rawContent")

        serviceScope.launch {
            try {
                // Step 1: Parse UPI notification details on-device
                val parsedTx = TransactionDeduplicator.parseUpiNotification(rawContent, packageName)
                    ?: return@launch

                // Step 2: Check 120s Deduplication against recent Bank SMS
                val isDuplicate = TransactionDeduplicator.isDuplicate(parsedTx)
                if (isDuplicate) {
                    Log.i(TAG, "Duplicate spend detected and neutralized for UTR: ${parsedTx.utr}")
                    return@launch
                }

                // Step 3: Compute updated daily ledger
                val updatedLedger = AllowanceCalculationEngine.recordSpend(parsedTx)

                // Step 4: Fire instant Heads-Up Notification Pop-Up
                InstantHeadsUpManager.showInstantPopUp(
                    context = applicationContext,
                    transaction = parsedTx,
                    updatedLedger = updatedLedger
                )
            } catch (e: Exception) {
                Log.e(TAG, "Error handling UPI notification", e)
            }
        }
    }
}
