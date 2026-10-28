import React, { useState } from 'react';
import { DailyLedger } from '../types';
import { Calendar, CheckCircle2, AlertOctagon, Sparkles, ChevronRight, X, Clock, ArrowRight } from 'lucide-react';

interface Props {
  ledgers: DailyLedger[];
  todayIndex: number;
}

export const CalendarHeatmap: React.FC<Props> = ({ ledgers, todayIndex }) => {
  const [selectedDay, setSelectedDay] = useState<DailyLedger | null>(null);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'PAST_AND_TODAY' | 'OVERSPENT'>('ALL');

  const greenDaysCount = ledgers.filter(l => l.dayNumber <= todayIndex + 1 && l.status === 'SAFE').length;
  const redDaysCount = ledgers.filter(l => l.dayNumber <= todayIndex + 1 && l.status === 'BREACHED').length;
  const cautionDaysCount = ledgers.filter(l => l.dayNumber <= todayIndex + 1 && l.status === 'CAUTION').length;

  const totalSavedSoFar = ledgers
    .slice(0, todayIndex + 1)
    .reduce((sum, d) => sum + (d.remainingAllowance > 0 ? d.remainingAllowance : 0), 0);

  const displayedDays = ledgers.filter(d => {
    if (viewFilter === 'PAST_AND_TODAY') return d.dayNumber <= todayIndex + 1;
    if (viewFilter === 'OVERSPENT') return d.status === 'BREACHED';
    return true;
  });

  return (
    <div className="rounded-3xl bg-[#0F1626]/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">30-Day Allowance Heatmap</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time daily ledger grid. Green = saved, Red = overspent.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {greenDaysCount} Green
          </span>
          <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/25 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {redDaysCount} Red
          </span>
          {cautionDaysCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {cautionDaysCount} Caution
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 mt-3 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 30 Days
          </button>
          <button
            onClick={() => setViewFilter('PAST_AND_TODAY')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewFilter === 'PAST_AND_TODAY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Past & Today ({todayIndex + 1})
          </button>
          <button
            onClick={() => setViewFilter('OVERSPENT')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              viewFilter === 'OVERSPENT'
                ? 'bg-red-600/80 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Red Days ({redDaysCount})
          </button>
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-emerald-400">
          Net Saved: <strong>₹{totalSavedSoFar.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Responsive Grid: 5 columns on mobile, 6 on tablet, 10 on desktop */}
      <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
        {displayedDays.map((day) => {
          const isToday = day.dayNumber === todayIndex + 1;
          const isFuture = day.dayNumber > todayIndex + 1;

          let tileBorder = 'border-slate-800/80';
          let tileBg = 'bg-slate-900/40 text-slate-500';
          let balanceDisplay = `₹${day.startingAllowance}`;
          let statusLabel = 'Future';
          let statusColor = 'text-slate-500';

          if (!isFuture) {
            if (day.status === 'SAFE') {
              tileBorder = 'border-emerald-500/40 hover:border-emerald-400';
              tileBg = 'bg-emerald-950/30 text-emerald-300';
              balanceDisplay = `+₹${Math.max(0, day.remainingAllowance)}`;
              statusLabel = 'Saved';
              statusColor = 'text-emerald-400 font-semibold';
            } else if (day.status === 'CAUTION') {
              tileBorder = 'border-amber-500/40 hover:border-amber-400';
              tileBg = 'bg-amber-950/30 text-amber-300';
              balanceDisplay = `₹${Math.max(0, day.remainingAllowance)}`;
              statusLabel = 'Pacing';
              statusColor = 'text-amber-400 font-semibold';
            } else if (day.status === 'BREACHED') {
              tileBorder = 'border-red-500/50 hover:border-red-400';
              tileBg = 'bg-red-950/30 text-red-300';
              balanceDisplay = `-₹${Math.abs(day.remainingAllowance)}`;
              statusLabel = 'Overspent';
              statusColor = 'text-red-400 font-semibold';
            }
          }

          if (isToday) {
            statusLabel = 'TODAY';
            statusColor = 'text-indigo-400 font-bold';
          }

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(day)}
              className={`relative flex flex-col justify-between p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer active:scale-95 min-h-[64px] ${tileBg} ${tileBorder} ${
                isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0F1626] shadow-lg shadow-indigo-500/20' : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold">D{day.dayNumber}</span>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                )}
                {day.isWeekend && !isToday && (
                  <span className="text-[9px] text-purple-400">W</span>
                )}
              </div>

              {/* Balance Amount */}
              <div className="my-0.5 font-mono font-bold text-xs truncate w-full">
                {balanceDisplay}
              </div>

              {/* Status Footer - NEVER truncates to S... */}
              <div className={`text-[10px] truncate w-full ${statusColor}`}>
                {statusLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Inspector Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  D{selectedDay.dayNumber}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    Day {selectedDay.dayNumber} Breakdown
                  </h4>
                  <p className="text-[11px] text-slate-400">{selectedDay.date}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">Starting Allowance</span>
                <span className="font-bold text-slate-100">₹{selectedDay.startingAllowance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">Total Spent</span>
                <span className="font-bold text-slate-100">₹{selectedDay.totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 font-sans">End-of-Day Balance</span>
                <span className={`font-bold ${selectedDay.remainingAllowance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedDay.remainingAllowance >= 0 ? `+₹${selectedDay.remainingAllowance.toLocaleString('en-IN')}` : `-₹${Math.abs(selectedDay.remainingAllowance).toLocaleString('en-IN')}`}
                </span>
              </div>

              {selectedDay.wishlistSweptAmount > 0 && (
                <div className="flex justify-between p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
                  <span className="font-sans">Swept into Wishlist Pot</span>
                  <span className="font-bold">+₹{selectedDay.wishlistSweptAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedDay.deficitCarriedForward > 0 && (
                <div className="flex justify-between p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300">
                  <span className="font-sans">Carried Forward Deficit</span>
                  <span className="font-bold">-₹{selectedDay.deficitCarriedForward.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Transactions logged for this day */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-300 mb-2">Transactions on Day {selectedDay.dayNumber}:</div>
              {selectedDay.transactions && selectedDay.transactions.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedDay.transactions.map((tx) => (
                    <div key={tx.id} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-200">{tx.merchantName}</span>
                        <div className="text-[10px] text-slate-500">{tx.category}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-200">
                        -₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 rounded-xl bg-slate-900/40">
                  Historical day initialized with baseline variance.
                </p>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={() => setSelectedDay(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition active:scale-95"
              >
                Close Day Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
