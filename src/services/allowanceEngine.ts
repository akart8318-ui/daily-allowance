import { BudgetConfig, DailyLedger, PopUpState, Transaction } from '../types';

export function calculateBaseDailyAllowance(config: BudgetConfig, daysInMonth: number = 30): number {
  if (config.calculationMode === 'GROSS') {
    return Math.round(config.monthlyIncome / daysInMonth);
  }

  // Safe-to-Spend Mode: Deducts Fixed Commitments and Savings Target first!
  const fixedTotal = config.fixedCommitments.reduce((sum, item) => sum + item.amount, 0);
  const spendablePool = Math.max(0, config.monthlyIncome - (fixedTotal + config.savingsTarget));
  return Math.round(spendablePool / daysInMonth);
}

/**
 * Calculates today's starting allowance based on the Rollover Mode and previous days
 */
export function computeDayStartingAllowance(
  dayIndex: number, // 0 to 29
  daysInMonth: number = 30,
  config: BudgetConfig,
  previousDeficit: number = 0,
  date: Date = new Date()
): { allowance: number; isWeekend: boolean } {
  const baseDaily = calculateBaseDailyAllowance(config, daysInMonth);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday, 5 is Friday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Fri, Sat, Sun

  let allowance = baseDaily;

  if (config.rolloverMode === 'WEEKEND_BOOST') {
    // Weekdays (Mon-Thu) get 85% of baseline; Fri-Sun get higher (120%)
    if (isWeekend) {
      allowance = Math.round(baseDaily * 1.20);
    } else {
      allowance = Math.round(baseDaily * 0.85);
    }
  }

  // Apply rollover overspend penalty
  if (config.rolloverMode === 'STRICT') {
    // Deduct deficit directly from tomorrow
    allowance = Math.max(0, allowance - previousDeficit);
  } else if (config.rolloverMode === 'DYNAMIC') {
    // Spread deficit across remaining days
    const remainingDays = Math.max(1, daysInMonth - dayIndex);
    const deficitShare = Math.round(previousDeficit / remainingDays);
    allowance = Math.max(0, allowance - deficitShare);
  }

  return { allowance, isWeekend };
}

/**
 * Evaluates current spending state
 */
export function evaluatePopUpState(totalSpent: number, dailyLimit: number): PopUpState {
  if (dailyLimit <= 0) return 'BREACHED';
  const ratio = totalSpent / dailyLimit;
  if (ratio < 0.70) return 'SAFE';
  if (ratio <= 1.0) return 'CAUTION';
  return 'BREACHED';
}

/**
 * Recalculates daily ledger given a new or updated transaction list
 */
export function recalculateLedger(
  ledger: DailyLedger,
  transactions: Transaction[],
  config: BudgetConfig,
  daysInMonth: number = 30
): DailyLedger {
  // Sum only transactions that count towards daily spend
  const totalSpent = transactions.reduce((sum, tx) => {
    if (tx.isExcludedFromDaily || tx.isSelfTransfer || tx.isCreditCardBill) {
      return sum;
    }
    if (tx.type === 'REFUND' || tx.type === 'CREDIT') {
      return sum - tx.amount;
    }
    return sum + (tx.effectiveDailyDeduction || tx.amount);
  }, 0);

  const remaining = ledger.startingAllowance - totalSpent;
  const status = evaluatePopUpState(totalSpent, ledger.startingAllowance);

  let wishlistSwept = 0;
  let deficit = 0;

  if (remaining > 0) {
    if (config.rolloverMode === 'STRICT') {
      wishlistSwept = remaining;
    }
  } else {
    deficit = Math.abs(remaining);
  }

  return {
    ...ledger,
    totalSpent: Math.max(0, totalSpent),
    remainingAllowance: remaining,
    status,
    transactions,
    wishlistSweptAmount: wishlistSwept,
    deficitCarriedForward: deficit
  };
}

/**
 * Generates sample 30-day mock history for initial state demonstration
 */
export function generateInitialMonthData(config: BudgetConfig): DailyLedger[] {
  const daysInMonth = 30;
  const baseAllowance = calculateBaseDailyAllowance(config, daysInMonth);
  const ledgers: DailyLedger[] = [];

  // Previous days (days 1 to 14) with realistic variations
  const todayIndex = 14; // Day 15 is today (0-indexed 14)
  const today = new Date();

  let carriedDeficit = 0;

  for (let i = 0; i < daysInMonth; i++) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - (todayIndex - i));
    const dateStr = dayDate.toISOString().split('T')[0];
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 5 || dayDate.getDay() === 6;

    let dayStartingAllowance = baseAllowance;
    if (config.rolloverMode === 'WEEKEND_BOOST') {
      dayStartingAllowance = isWeekend ? Math.round(baseAllowance * 1.2) : Math.round(baseAllowance * 0.85);
    }

    if (i < todayIndex) {
      // Historical past days
      // Realistic spend: mostly safe with a couple of yellow/red days
      let spent = Math.round(dayStartingAllowance * (0.4 + (i % 5) * 0.16));
      if (i === 4 || i === 11) {
        // Red days (overspend on weekend / party)
        spent = Math.round(dayStartingAllowance * 1.28);
      }

      const remaining = dayStartingAllowance - spent;
      const status: PopUpState = evaluatePopUpState(spent, dayStartingAllowance);

      ledgers.push({
        date: dateStr,
        dayNumber: i + 1,
        startingAllowance: dayStartingAllowance,
        totalSpent: spent,
        remainingAllowance: remaining,
        status,
        transactions: [],
        wishlistSweptAmount: remaining > 0 ? remaining : 0,
        deficitCarriedForward: remaining < 0 ? Math.abs(remaining) : 0,
        isWeekend
      });
    } else if (i === todayIndex) {
      // Today! Initialized with some morning spends
      const todaySpent = 850;
      const remaining = dayStartingAllowance - todaySpent;
      ledgers.push({
        date: dateStr,
        dayNumber: i + 1,
        startingAllowance: dayStartingAllowance,
        totalSpent: todaySpent,
        remainingAllowance: remaining,
        status: evaluatePopUpState(todaySpent, dayStartingAllowance),
        transactions: [
          {
            id: 'init-tx-1',
            timestamp: Date.now() - 5 * 3600 * 1000,
            amount: 250,
            type: 'DEBIT',
            source: 'UPI_NOTIF',
            merchantName: 'Third Wave Coffee',
            category: 'Food & Coffee',
            upiVpa: 'thirdwave@icici',
            utrReference: '429188471203',
            isExcludedFromDaily: false,
            splitRatio: 1,
            effectiveDailyDeduction: 250,
            notes: 'Morning Flat White'
          },
          {
            id: 'init-tx-2',
            timestamp: Date.now() - 2 * 3600 * 1000,
            amount: 600,
            type: 'DEBIT',
            source: 'BANK_SMS',
            merchantName: 'Blinkit',
            category: 'Quick Commerce & Groceries',
            upiVpa: 'blinkit@axisbank',
            utrReference: '630114892011',
            accountLast4: '4821',
            isExcludedFromDaily: false,
            splitRatio: 1,
            effectiveDailyDeduction: 600,
            isQuickCommerce: true,
            notes: 'Sourdough, Milk, Berries'
          }
        ],
        wishlistSweptAmount: 0,
        deficitCarriedForward: 0,
        isWeekend
      });
    } else {
      // Future days in current cycle
      ledgers.push({
        date: dateStr,
        dayNumber: i + 1,
        startingAllowance: dayStartingAllowance,
        totalSpent: 0,
        remainingAllowance: dayStartingAllowance,
        status: 'SAFE',
        transactions: [],
        wishlistSweptAmount: 0,
        deficitCarriedForward: 0,
        isWeekend
      });
    }
  }

  return ledgers;
}
