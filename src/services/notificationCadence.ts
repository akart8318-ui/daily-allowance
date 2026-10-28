import { BudgetConfig, DailyLedger } from '../types';

export interface CadenceNotification {
  type: 'MORNING_KICKOFF' | 'PACE_CHECK_6PM' | 'NIGHTLY_SCORECARD';
  timeLabel: string;
  title: string;
  message: string;
  badge: string;
  accentColor: string;
}

export function generateCadenceNotifications(
  todayLedger: DailyLedger,
  config: BudgetConfig,
  currentStreak: number,
  wishlistPotTotal: number
): CadenceNotification[] {
  const { startingAllowance, totalSpent, remainingAllowance, status } = todayLedger;
  const percentUsed = Math.round((totalSpent / Math.max(1, startingAllowance)) * 100);

  // 1. Morning Kickoff (8:00 AM)
  const morningNotif: CadenceNotification = {
    type: 'MORNING_KICKOFF',
    timeLabel: '8:00 AM Kickoff',
    title: '☀️ Good morning! Today’s Allowance Ready',
    message: config.persona === 'ROAST'
      ? `Your fresh budget is ₹${startingAllowance.toLocaleString('en-IN')}. Don't blow it all before noon on cold brew.`
      : `Your daily income budget today is ₹${startingAllowance.toLocaleString('en-IN')}. Spend wisely and keep your ${currentStreak}-day streak alive!`,
    badge: `₹${startingAllowance}/day`,
    accentColor: '#10B981'
  };

  // 2. 6:00 PM Pace Check
  let paceCheckNotif: CadenceNotification;
  if (percentUsed >= 75) {
    paceCheckNotif = {
      type: 'PACE_CHECK_6PM',
      timeLabel: '6:00 PM Pace Check (Triggered: High Spend)',
      title: '⏳ 6:00 PM Pace Alert — Slow Down!',
      message: config.persona === 'ROAST'
        ? `It's not even 6 PM and you've already drained ${percentUsed}% of your daily cash (₹${totalSpent.toLocaleString('en-IN')}). Close the food apps immediately.`
        : `It's not even 6 PM and you've already spent ₹${totalSpent.toLocaleString('en-IN')} (${percentUsed}%). Hold off on evening impulse orders to stay in the green!`,
      badge: `${percentUsed}% Spent`,
      accentColor: '#F59E0B'
    };
  } else {
    paceCheckNotif = {
      type: 'PACE_CHECK_6PM',
      timeLabel: '6:00 PM Pace Check',
      title: '✨ 6:00 PM Pace Check — Solid Pacing!',
      message: `You've spent ₹${totalSpent.toLocaleString('en-IN')} (${percentUsed}% of allowance). ₹${remainingAllowance.toLocaleString('en-IN')} safe for your evening dinner and tea.`,
      badge: 'On Track',
      accentColor: '#10B981'
    };
  }

  // 3. Nightly Scorecard (10:30 PM)
  let scorecardNotif: CadenceNotification;
  if (remainingAllowance >= 0) {
    const sweepNote = config.rolloverMode === 'STRICT'
      ? ` ₹${remainingAllowance.toLocaleString('en-IN')} swept to your Guilt-Free Wishlist Pot (Total: ₹${(wishlistPotTotal + remainingAllowance).toLocaleString('en-IN')})!`
      : ` Unspent ₹${remainingAllowance.toLocaleString('en-IN')} safely rolls forward.`;

    scorecardNotif = {
      type: 'NIGHTLY_SCORECARD',
      timeLabel: '10:30 PM Nightly Scorecard',
      title: `🎉 Day Complete! +${currentStreak + 1}-Day Green Streak 🔥`,
      message: `Budget: ₹${startingAllowance.toLocaleString('en-IN')} | Spent: ₹${totalSpent.toLocaleString('en-IN')}. Saved ₹${remainingAllowance.toLocaleString('en-IN')} today.${sweepNote}`,
      badge: `Saved ₹${remainingAllowance}`,
      accentColor: '#10B981'
    };
  } else {
    const deficit = Math.abs(remainingAllowance);
    const rolloverDesc = config.rolloverMode === 'STRICT'
      ? `Tomorrow's allowance drops to ₹${Math.max(0, startingAllowance - deficit).toLocaleString('en-IN')}.`
      : `₹${deficit.toLocaleString('en-IN')} deficit rebalanced across remaining 15 days (-₹${Math.round(deficit / 15)}/day).`;

    scorecardNotif = {
      type: 'NIGHTLY_SCORECARD',
      timeLabel: '10:30 PM Nightly Scorecard',
      title: '📉 Day Complete — Overspend Recorded',
      message: `Your daily budget was ₹${startingAllowance.toLocaleString('en-IN')} and you spent ₹${totalSpent.toLocaleString('en-IN')} (-₹${deficit.toLocaleString('en-IN')}). ${rolloverDesc} Let's bounce back tomorrow!`,
      badge: `-₹${deficit} Deficit`,
      accentColor: '#EF4444'
    };
  }

  return [morningNotif, paceCheckNotif, scorecardNotif];
}
