package com.dailyallowance.tracker.engine

data class LedgerState(
    val startingAllowance: Double,
    val totalSpent: Double,
    val remainingAllowance: Double,
    val isOverspent: Boolean,
    val percentUsed: Int
)

object AllowanceCalculationEngine {
    // Current in-memory state for fast on-device evaluations
    private var baseDailyAllowance: Double = 3333.0
    private var totalSpentToday: Double = 850.0

    @Synchronized
    fun recordSpend(tx: ParsedTransaction): LedgerState {
        if (!tx.isShielded && !tx.isSelfTransfer && !tx.isCreditCardBill) {
            if (tx.isRefund) {
                totalSpentToday = Math.max(0.0, totalSpentToday - tx.amount)
            } else {
                totalSpentToday += tx.amount
            }
        }

        val remaining = baseDailyAllowance - totalSpentToday
        val percent = ((totalSpentToday / Math.max(1.0, baseDailyAllowance)) * 100).toInt()

        return LedgerState(
            startingAllowance = baseDailyAllowance,
            totalSpent = totalSpentToday,
            remainingAllowance = remaining,
            isOverspent = remaining < 0,
            percentUsed = percent
        )
    }

    fun configureCycle(monthlyIncome: Double, fixedShield: Double, savingsTarget: Double, daysInMonth: Int = 30) {
        val spendablePool = Math.max(0.0, monthlyIncome - (fixedShield + savingsTarget))
        baseDailyAllowance = spendablePool / daysInMonth
    }
}
