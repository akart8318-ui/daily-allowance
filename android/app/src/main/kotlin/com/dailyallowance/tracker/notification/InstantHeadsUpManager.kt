package com.dailyallowance.tracker.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.dailyallowance.tracker.engine.LedgerState
import com.dailyallowance.tracker.engine.ParsedTransaction

object InstantHeadsUpManager {
    private const val CHANNEL_ID = "instant_allowance_heads_up"
    private const val CHANNEL_NAME = "Instant UPI Spend Tracker"

    fun showInstantPopUp(context: Context, transaction: ParsedTransaction, updatedLedger: LedgerState) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create High-Priority Notification Channel (Heads-Up Banner)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High priority instant heads-up alert triggered after UPI spend"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val remaining = updatedLedger.remainingAllowance.toInt()
        val limit = updatedLedger.startingAllowance.toInt()
        val spent = updatedLedger.totalSpent.toInt()

        val (title, body) = when {
            updatedLedger.percentUsed < 70 -> {
                "💸 ₹${transaction.amount.toInt()} spent at ${transaction.merchant}" to
                "₹$remaining left for today (Daily Limit: ₹$limit). You're on track!"
            }
            updatedLedger.percentUsed in 70..99 -> {
                "⚠️ ₹${transaction.amount.toInt()} spent on ${transaction.merchant} — Slow Down!" to
                "Only ₹$remaining left for today (${updatedLedger.percentUsed}% of ₹$limit allowance used)."
            }
            else -> {
                "🚨 Daily Allowance Exceeded by ₹${Math.abs(remaining)}!" to
                "₹${transaction.amount.toInt()} on ${transaction.merchant}. Total: ₹$spent / ₹$limit. Tomorrow adjusted."
            }
        }

        // Action Intent: Split Expense
        val splitIntent = Intent().apply {
            action = "com.dailyallowance.tracker.ACTION_SPLIT"
            putExtra("TX_ID", transaction.id)
        }
        val splitPending = PendingIntent.getBroadcast(
            context,
            transaction.id.hashCode() + 1,
            splitIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action Intent: Exclude from Daily Spend
        val excludeIntent = Intent().apply {
            action = "com.dailyallowance.tracker.ACTION_EXCLUDE"
            putExtra("TX_ID", transaction.id)
        }
        val excludePending = PendingIntent.getBroadcast(
            context,
            transaction.id.hashCode() + 2,
            excludeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_share, "Split 50%", splitPending)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Not Daily Spend", excludePending)

        notificationManager.notify(transaction.id.hashCode(), builder.build())
    }
}
