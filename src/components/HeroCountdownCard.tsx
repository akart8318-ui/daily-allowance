import React from 'react';
import { DailyLedger, BudgetConfig } from '../types';
import {
  Flame,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Calendar,
  Gift,
  PlusCircle,
  Clock,
  FastForward,
  RotateCcw
} from 'lucide-react';

interface Props {
  todayLedger: DailyLedger;
  config: BudgetConfig;
  streakCount: number;
  wishlistPotTotal: number;
  todayIndex: number;
  onOpenSettings: () => void;
  onQuickSimulate: () => void;
  onOpenAddExpense: () => void;
  onAdvanceDay: () => void;
  onResetData: () => void;
}

export const HeroCountdownCard: React.FC<Props> = ({
  todayLedger,
  config,
  streakCount,
  wishlistPotTotal,
  todayIndex,
  onOpenSettings,
  onQuickSimulate,
  onOpenAddExpense,
  onAdvanceDay,
  onResetData
}) => {
  const { startingAllowance, totalSpent, remainingAllowance, status, isWeekend, dayNumber } = todayLedger;

  const percentUsed = Math.min(100, Math.round((totalSpent / Math.max(1, startingAllowance)) * 100));
  const isOverspent = remainingAllowance < 0;
  const absRemaining = Math.abs(remainingAllowance);

  // Status visual themes
  const statusTheme = {
    SAFE: {
      textGradient: 'from-emerald-400 via-teal-300 to-green-500',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      barColor: 'bg-emerald-500 shadow-emerald-500/50',
      statusText: 'Safe to Spend',
      subText: "You're on track for today! No stress."
    },
    CAUTION: {
      textGradient: 'from-amber-400 via-yellow-300 to-orange-400',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      barColor: 'bg-amber-500 shadow-amber-500/50',
      statusText: 'Caution Zone',
      subText: '70%+ spent. Slow down on evening impulse orders.'
    },
    BREACHED: {
      textGradient: 'from-red-400 via-rose-300 to-red-600',
      badgeBg: 'bg-red-500/15 text-red-400 border-red-500/30',
      barColor: 'bg-red-500 shadow-red-500/50',
      statusText: 'Overspent Today',
      subText: 'Deficit automatically rebalancing tomorrow.'
    }
  }[status];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#131B2E] via-[#0E1524] to-[#0A0F1D] border border-slate-800 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Background radial accent glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
        status === 'SAFE' ? 'bg-emerald-500' : status === 'CAUTION' ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusTheme.badgeBg} flex items-center gap-1.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            {statusTheme.statusText}
          </span>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
            Day {dayNumber}/30
          </span>

          {isWeekend && config.rolloverMode === 'WEEKEND_BOOST' && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              ⚡ Weekend +20%
            </span>
          )}
        </div>

        {/* Streak & Wishlist pot counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold" title="Continuous days in green">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streakCount}d streak</span>
          </div>

          {config.rolloverMode === 'STRICT' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium" title="Guilt-Free Wishlist Pot swept from unspent days">
              <Gift className="w-3.5 h-3.5" />
              <span>₹{wishlistPotTotal.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Allowance Display */}
      <div className="mt-6 text-center">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Remaining Allowance Today
        </span>

        <div className="mt-1 flex items-center justify-center gap-1">
          <span className={`text-5xl sm:text-6xl font-extrabold tracking-tight font-mono bg-gradient-to-r ${statusTheme.textGradient} bg-clip-text text-transparent`}>
            {isOverspent ? `-₹${absRemaining.toLocaleString('en-IN')}` : `₹${absRemaining.toLocaleString('en-IN')}`}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          {statusTheme.subText}
        </p>
      </div>

      {/* Progress Bar & Split Indicator */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Spent: <strong className="text-slate-100 font-bold">₹{totalSpent.toLocaleString('en-IN')}</strong>
          </span>
          <span className="text-slate-400">
            Limit: <strong className="text-slate-200 font-bold">₹{startingAllowance.toLocaleString('en-IN')}</strong>
          </span>
        </div>

        {/* Dynamic Progress Meter */}
        <div className="h-3 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${statusTheme.barColor}`}
            style={{ width: `${Math.min(100, Math.max(3, percentUsed))}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
          <span>{percentUsed}% spent today</span>
          <span className="text-slate-400 font-mono">{config.rolloverMode.replace('_', ' ')} Rollover</span>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80">
        {/* Simulate UPI */}
        <button
          onClick={onQuickSimulate}
          className="py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/25"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate UPI</span>
        </button>

        {/* Manual Add Expense */}
        <button
          onClick={onOpenAddExpense}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700/60 transition active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Log Expense</span>
        </button>

        {/* Advance Day (Simulate Midnight Rollover) */}
        <button
          onClick={onAdvanceDay}
          title="Simulate 12:00 AM Midnight Rollover & sweep unspent funds or carry deficit"
          className="py-2.5 px-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-purple-500/30 transition active:scale-95"
        >
          <FastForward className="w-3.5 h-3.5 text-purple-400" />
          <span>Simulate Midnight</span>
        </button>

        {/* Shield & Config */}
        <button
          onClick={onOpenSettings}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700/60 transition active:scale-95"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Config ({config.calculationMode === 'SAFE_TO_SPEND' ? 'Safe' : 'Gross'})</span>
        </button>
      </div>
    </div>
  );
};
