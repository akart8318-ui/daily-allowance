package com.dailyallowance.tracker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.dailyallowance.tracker.engine.AllowanceCalculationEngine
import com.dailyallowance.tracker.engine.TransactionDeduplicator
import com.dailyallowance.tracker.notification.InstantHeadsUpManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Android BroadcastReceiver for SMS_RECEIVED
 * Automated parser for EVERY Indian Bank (HDFC, ICICI, SBI, Axis, Kotak, IDFC, PNB, BOB, Yes, Canara, etc.)
 * Captures: Amount, Merchant, Account Last 4, Available Balance, and UTR.
 * Latency: 1 - 2 seconds on-device
 */
class BankSmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "MultiBankSmsReceiver"

        // TRAI approved sender headers across Indian Banks
        private val INDIAN_BANK_HEADERS = listOf(
            "HDFCBK", "HDFC", "ICICIB", "ICICI", "SBIINB", "SBISMS", "AXISBK", "AXIS",
            "KOTAKB", "KOTAK", "IDFCFB", "IDFC", "INDUSB", "INDUS", "PNBSMS", "PNB",
            "BOBSMS", "BOB", "YESBNK", "YESBK", "CANBNK", "CANARA", "FEDRLB", "UNIONB",
            "PAYTM", "CENTBK", "IOBCHN", "UCOBNK", "BOMBNK"
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return

        for (sms in messages) {
            val body = sms.displayMessageBody ?: continue
            val sender = sms.displayOriginatingAddress ?: ""

            if (!isIndianBankSender(sender)) continue

            Log.d(TAG, "Intercepted Indian Bank SMS from $sender: $body")

            CoroutineScope(Dispatchers.Default).launch {
                // Parse transaction details including available balance
                val parsed = TransactionDeduplicator.parseBankSms(body, sender) ?: return@launch

                // Smart Deduplication: Avoid double counting if GPay notification already fired in last 120s
                if (!TransactionDeduplicator.isDuplicate(parsed)) {
                    val updatedLedger = AllowanceCalculationEngine.recordSpend(parsed)

                    // Fire instant heads-up alert with balance update
                    InstantHeadsUpManager.showInstantPopUp(context, parsed, updatedLedger)
                } else {
                    Log.i(TAG, "Bank SMS deduplicated for UTR: ${parsed.utr}")
                }
            }
        }
    }

    private fun isIndianBankSender(sender: String): Boolean {
        val s = sender.uppercase()
        return INDIAN_BANK_HEADERS.any { s.contains(it) }
    }
}
