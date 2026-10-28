package com.dailyallowance.tracker.data

import androidx.room.*

@Entity(tableName = "linked_bank_accounts")
data class BankAccountEntity(
    @PrimaryKey val id: String,
    val bankCode: String,
    val bankName: String,
    val accountType: String, // SAVINGS | CURRENT | CREDIT_CARD
    val accountNumberLast4: String,
    val balance: Double,
    val isSalaryAccount: Boolean,
    val lastSyncedAt: Long,
    val syncStatus: String,
    val aaConsentId: String?
)

@Dao
interface BankAccountDao {
    @Query("SELECT * FROM linked_bank_accounts")
    suspend fun getAllAccounts(): List<BankAccountEntity>

    @Query("SELECT * FROM linked_bank_accounts WHERE accountNumberLast4 = :last4 LIMIT 1")
    suspend fun getAccountByLast4(last4: String): BankAccountEntity?

    @Query("UPDATE linked_bank_accounts SET balance = :newBalance, lastSyncedAt = :timestamp WHERE accountNumberLast4 = :last4")
    suspend fun updateBalanceByLast4(last4: String, newBalance: Double, timestamp: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAccount(account: BankAccountEntity)

    @Delete
    suspend fun deleteAccount(account: BankAccountEntity)
}

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
    val status: String, // SAFE | CAUTION | BREACHED
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
    val accountLast4: String?,
    val bankName: String?,
    val availableBalanceAfterTx: Double?,
    val isExcludedFromDaily: Boolean,
    val splitRatio: Double,
    val effectiveDailyDeduction: Double
)

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions WHERE timestamp >= :startOfDay ORDER BY timestamp DESC")
    suspend fun getTodayTransactions(startOfDay: Long): List<TransactionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(tx: TransactionEntity)

    @Update
    suspend fun updateTransaction(tx: TransactionEntity)
}
