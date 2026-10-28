import { Transaction, PopUpState, BudgetConfig } from '../types';
import { classifyMerchant } from './merchantDictionary';

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateOf?: Transaction;
  reason?: string;
}

/**
 * Smart Deduplication Engine
 * India UPI spends trigger both a Bank SMS and a UPI notification within 120 seconds.
 * Matches:
 * 1. Exact UTR/Reference ID if present
 * 2. Same Amount within 120 seconds
 */
export function checkDeduplication(
  newTx: Partial<Transaction>,
  existingTransactions: Transaction[],
  windowSeconds: number = 120
): DeduplicationResult {
  const newTimestamp = newTx.timestamp || Date.now();
  const windowMs = windowSeconds * 1000;

  for (const tx of existingTransactions) {
    // Check 1: Exact UTR Reference match
    if (newTx.utrReference && tx.utrReference && newTx.utrReference.trim() === tx.utrReference.trim()) {
      return {
        isDuplicate: true,
        duplicateOf: tx,
        reason: `Matched exact UPI Reference / UTR (${tx.utrReference})`
      };
    }

    // Check 2: Same Amount + within 120-second window
    const timeDiff = Math.abs(newTimestamp - tx.timestamp);
    if (timeDiff <= windowMs && Math.abs(newTx.amount! - tx.amount) < 0.01) {
      // If one is UPI_NOTIF and the other is BANK_SMS, it's 100% duplicate
      if (
        (newTx.source === 'UPI_NOTIF' && tx.source === 'BANK_SMS') ||
        (newTx.source === 'BANK_SMS' && tx.source === 'UPI_NOTIF') ||
        tx.merchantName.toLowerCase() === (newTx.merchantName || '').toLowerCase()
      ) {
        return {
          isDuplicate: true,
          duplicateOf: tx,
          reason: `Duplicate detected: ₹${tx.amount} received from both App Notification and Bank SMS within ${Math.round(timeDiff / 1000)}s`
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Handles Module 5 Edge Cases:
 * - Self-transfer neutralizer (transferring to own account)
 * - Credit Card bill neutralizer (avoids double counting CC repayments)
 * - UPI Lite top-up handling
 * - Instant refunds & cashbacks
 */
export function processTransactionEdgeCases(
  tx: Partial<Transaction>,
  config: BudgetConfig
): {
  processedTx: Transaction;
  shouldDeductFromDaily: boolean;
  alertNote?: string;
} {
  const id = tx.id || 'tx-' + Math.random().toString(36).substring(2, 9);
  const timestamp = tx.timestamp || Date.now();
  const amount = tx.amount || 0;
  const merchantInfo = classifyMerchant(tx.merchantName || 'Merchant', tx.upiVpa, tx.notes);

  let isExcluded = tx.isExcludedFromDaily || false;
  let splitRatio = tx.splitRatio ?? 1.0;
  let alertNote: string | undefined;

  // Edge Case 1: Self Transfer
  if (merchantInfo.isSelfTransfer || /self|own\s*account/i.test(tx.merchantName || '')) {
    isExcluded = true;
    alertNote = '🛡️ Self-Transfer Neutralized: Internal account transfer ignored from daily allowance.';
  }

  // Edge Case 2: Credit Card Bill Payment
  if (merchantInfo.isCreditCardBill || /credit\s*card\s*bill|cred\s*club/i.test(tx.merchantName || '')) {
    isExcluded = true;
    alertNote = '💳 Credit Card Bill Neutralized: Already tracked as individual daily spends.';
  }

  // Edge Case 3: Fixed shield commitment auto-match (e.g. Rent, EMI, SIP)
  const isFixedMatched = config.fixedCommitments.some(
    f => f.amount === amount || tx.merchantName?.toLowerCase().includes(f.name.toLowerCase())
  );
  if (isFixedMatched || merchantInfo.isFixedCommitment) {
    isExcluded = true;
    alertNote = `🛡️ Fixed Commitment Shield: ₹${amount.toLocaleString('en-IN')} marked as untouchable commitment.`;
  }

  // Calculate effective daily deduction
  let effectiveDeduction = 0;
  if (!isExcluded) {
    if (tx.type === 'REFUND' || tx.type === 'CREDIT') {
      effectiveDeduction = -amount;
    } else {
      effectiveDeduction = Math.round(amount * splitRatio);
    }
  }

  const processedTx: Transaction = {
    id,
    timestamp,
    amount,
    type: tx.type || 'DEBIT',
    source: tx.source || 'UPI_NOTIF',
    merchantName: merchantInfo.normalizedMerchant,
    upiVpa: tx.upiVpa,
    category: merchantInfo.category,
    utrReference: tx.utrReference,
    accountLast4: tx.accountLast4,
    isExcludedFromDaily: isExcluded,
    splitRatio,
    effectiveDailyDeduction: effectiveDeduction,
    rawMessage: tx.rawMessage,
    notes: tx.notes,
    isQuickCommerce: merchantInfo.isQuickCommerce,
    isSubscription: merchantInfo.isSubscription,
    isSelfTransfer: merchantInfo.isSelfTransfer,
    isCreditCardBill: merchantInfo.isCreditCardBill
  };

  return {
    processedTx,
    shouldDeductFromDaily: !isExcluded,
    alertNote
  };
}
