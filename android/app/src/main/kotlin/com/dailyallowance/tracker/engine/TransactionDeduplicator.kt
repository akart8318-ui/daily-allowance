package com.dailyallowance.tracker.engine

import com.dailyallowance.tracker.dictionary.MerchantClassifier
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.regex.Pattern

data class ParsedTransaction(
    val id: String = java.util.UUID.randomUUID().toString(),
    val amount: Double,
    val merchant: String,
    val category: String,
    val utr: String?,
    val source: String, // "UPI_NOTIF" or "BANK_SMS"
    val isRefund: Boolean = false,
    val isCreditCardBill: Boolean = false,
    val isSelfTransfer: Boolean = false,
    val isShielded: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)

object TransactionDeduplicator {
    private const val WINDOW_MS = 120_000L // 120 seconds rolling window

    private data class CachedTx(
        val amount: Double,
        val utr: String?,
        val timestamp: Long,
        val source: String
    )

    private val cache = ConcurrentLinkedQueue<CachedTx>()

    @Synchronized
    fun isDuplicate(newTx: ParsedTransaction): Boolean {
        val now = System.currentTimeMillis()
        cache.removeIf { now - it.timestamp > WINDOW_MS * 2 }

        for (item in cache) {
            // Match 1: Exact UTR
            if (!newTx.utr.isNullOrEmpty() && newTx.utr == item.utr) {
                return true
            }

            // Match 2: Same amount within 120 seconds across different sources (SMS + UPI Notification)
            val timeDiff = Math.abs(now - item.timestamp)
            if (timeDiff <= WINDOW_MS && Math.abs(newTx.amount - item.amount) < 0.01) {
                if (newTx.source != item.source) {
                    return true
                }
            }
        }

        cache.add(CachedTx(newTx.amount, newTx.utr, now, newTx.source))
        return false
    }

    fun parseUpiNotification(text: String, packageName: String): ParsedTransaction? {
        val amountPattern = Pattern.compile("(?:Rs\\.?|INR|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE)
        val matcher = amountPattern.matcher(text)
        if (!matcher.find()) return null

        val amountStr = matcher.group(1)?.replace(",", "") ?: return null
        val amount = amountStr.toDoubleOrNull() ?: return null

        val utrPattern = Pattern.compile("(?:UPI\\s*Ref(?:\\s*No)?|Ref|UTR|Txn\\s*ID)[:\\s]+([0-9A-Za-z]+)", Pattern.CASE_INSENSITIVE)
        val utrMatcher = utrPattern.matcher(text)
        val utr = if (utrMatcher.find()) utrMatcher.group(1) else null

        val classification = MerchantClassifier.classify(text)

        return ParsedTransaction(
            amount = amount,
            merchant = classification.merchant,
            category = classification.category,
            utr = utr,
            source = "UPI_NOTIF",
            isRefund = text.contains("refund", ignoreCase = true),
            isCreditCardBill = classification.isCreditCardBill,
            isSelfTransfer = classification.isSelfTransfer,
            isShielded = classification.isShielded
        )
    }

    fun parseBankSms(text: String, sender: String): ParsedTransaction? {
        val amountPattern = Pattern.compile("(?:Rs\\.?|INR|₹)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE)
        val matcher = amountPattern.matcher(text)
        if (!matcher.find()) return null

        val amount = matcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: return null

        val utrPattern = Pattern.compile("(?:UPI\\s*Ref(?:\\s*No)?|Ref|UTR|Txn)[:\\s]+([0-9A-Za-z]+)", Pattern.CASE_INSENSITIVE)
        val utrMatcher = utrPattern.matcher(text)
        val utr = if (utrMatcher.find()) utrMatcher.group(1) else null

        val classification = MerchantClassifier.classify(text)

        return ParsedTransaction(
            amount = amount,
            merchant = classification.merchant,
            category = classification.category,
            utr = utr,
            source = "BANK_SMS",
            isRefund = text.contains("refund", ignoreCase = true),
            isCreditCardBill = classification.isCreditCardBill,
            isSelfTransfer = classification.isSelfTransfer,
            isShielded = classification.isShielded
        )
    }
}
