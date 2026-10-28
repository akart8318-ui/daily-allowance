import { BudgetConfig, DailyLedger } from '../types';
import { computeDayStartingAllowance, evaluatePopUpState } from './allowanceEngine';

export interface RolloverResult {
  updatedLedgers: DailyLedger[];
  newTodayIndex: number;
  newWishlistPot: number;
  summaryMessage: string;
  isStreakMaintained: boolean;
  sweptAmount: number;
  deficitCarried: number;
}

/**
 * Advances the active day index (simulates 12:00 AM midnight rollover)
 */
export function simulateMidnightRollover(
  currentLedgers: DailyLedger[],
  todayIndex: number,
  config: BudgetConfig,
  currentWishlistPot: number
): RolloverResult {
  if (todayIndex >= currentLedgers.length - 1) {
    return {
      updatedLedgers: currentLedgers,
      newTodayIndex: todayIndex,
      newWishlistPot: currentWishlistPot,
      summaryMessage: 'End of 30-day budget cycle reached! Cycle complete.',
      isStreakMaintained: true,
      sweptAmount: 0,
      deficitCarried: 0
    };
  }

  const yesterday = currentLedgers[todayIndex];
  const newTodayIndex = todayIndex + 1;
  const daysInMonth = currentLedgers.length;

  const yesterdayRemaining = yesterday.remainingAllowance;
  const isYesterdayUnderBudget = yesterdayRemaining >= 0;

  let sweptAmount = 0;
  let deficitCarried = 0;
  let updatedWishlistPot = currentWishlistPot;

  if (isYesterdayUnderBudget) {
    if (config.rolloverMode === 'STRICT') {
      sweptAmount = yesterdayRemaining;
      updatedWishlistPot += sweptAmount;
    }
  } else {
    deficitCarried = Math.abs(yesterdayRemaining);
  }

  // Create new ledgers array
  const updatedLedgers = [...currentLedgers];

  // Finalize yesterday's status
  updatedLedgers[todayIndex] = {
    ...yesterday,
    status: evaluatePopUpState(yesterday.totalSpent, yesterday.startingAllowance),
    wishlistSweptAmount: sweptAmount,
    deficitCarriedForward: deficitCarried
  };

  // Compute new today's starting allowance
  const newTodayDate = new Date(updatedLedgers[newTodayIndex].date);
  const { allowance: newStartingAllowance, isWeekend } = computeDayStartingAllowance(
    newTodayIndex,
    daysInMonth,
    config,
    deficitCarried,
    newTodayDate
  );

  // If dynamic rebalance and had deficit, spread across remaining days
  let finalAllowance = newStartingAllowance;
  if (config.rolloverMode === 'DYNAMIC' && deficitCarried > 0) {
    const remainingDays = Math.max(1, daysInMonth - newTodayIndex);
    const deficitShare = Math.round(deficitCarried / remainingDays);
    finalAllowance = Math.max(0, newStartingAllowance - deficitShare);
  }

  updatedLedgers[newTodayIndex] = {
    ...updatedLedgers[newTodayIndex],
    startingAllowance: finalAllowance,
    remainingAllowance: finalAllowance - updatedLedgers[newTodayIndex].totalSpent,
    status: evaluatePopUpState(updatedLedgers[newTodayIndex].totalSpent, finalAllowance),
    isWeekend
  };

  // Generate human-friendly summary message
  let summaryMessage = '';
  if (isYesterdayUnderBudget) {
    if (config.rolloverMode === 'STRICT') {
      summaryMessage = `🎉 Midnight Sweep: ₹${sweptAmount.toLocaleString('en-IN')} unspent yesterday was swept to your Guilt-Free Wishlist Pot! New Day ${newTodayIndex + 1} starting fresh with ₹${finalAllowance.toLocaleString('en-IN')}.`;
    } else {
      summaryMessage = `✨ Day ${todayIndex + 1} finalized under budget! Saved ₹${yesterdayRemaining.toLocaleString('en-IN')}. Day ${newTodayIndex + 1} allowance set to ₹${finalAllowance.toLocaleString('en-IN')}.`;
    }
  } else {
    if (config.rolloverMode === 'STRICT') {
      summaryMessage = `⚠️ Overspend Rolled: Yesterday was over by ₹${deficitCarried.toLocaleString('en-IN')}. Strict rule deducted this from today's allowance (Now: ₹${finalAllowance.toLocaleString('en-IN')}).`;
    } else {
      summaryMessage = `🔄 Dynamic Rebalance: ₹${deficitCarried.toLocaleString('en-IN')} yesterday deficit was spread across the remaining ${daysInMonth - newTodayIndex} days. Today's allowance: ₹${finalAllowance.toLocaleString('en-IN')}.`;
    }
  }

  return {
    updatedLedgers,
    newTodayIndex,
    newWishlistPot: updatedWishlistPot,
    summaryMessage,
    isStreakMaintained: isYesterdayUnderBudget,
    sweptAmount,
    deficitCarried
  };
}
