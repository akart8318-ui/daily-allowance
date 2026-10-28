import React, { useState, useEffect } from 'react';
import { NotificationPayload } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  X,
  Share2,
  ShieldBan,
  Tag,
  Volume2,
  ExternalLink
} from 'lucide-react';
import { speakRoast } from '../services/audioHaptics';

interface Props {
  payload: NotificationPayload | null;
  onDismiss: () => void;
  onSplit: (txId: string, ratio: number) => void;
  onExclude: (txId: string) => void;
  onRecategorize: (txId: string, newCategory: string) => void;
  voiceEnabled: boolean;
}

export const InstantPopUpOverlay: React.FC<Props> = ({
  payload,
  onDismiss,
  onSplit,
  onExclude,
  onRecategorize,
  voiceEnabled
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [autoDismissTimer, setAutoDismissTimer] = useState(10);

  useEffect(() => {
    if (!payload) return;

    // Reset menus
    setShowCategoryMenu(false);
    setShowSplitMenu(false);
    setAutoDismissTimer(10);

    const interval = setInterval(() => {
      setAutoDismissTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [payload]);

  if (!payload) return null;

  const { state, spentAmount, remainingAllowance, dailyLimit, percentUsed, merchantName, roastMessage, transactionId } = payload;

  const stateStyles = {
    SAFE: {
      border: 'border-emerald-500/50 shadow-emerald-500/20',
      bg: 'bg-slate-900/95',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      progressBg: 'bg-emerald-500',
      glow: 'from-emerald-500/20 to-transparent',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
    },
    CAUTION: {
      border: 'border-amber-500/60 shadow-amber-500/20',
      bg: 'bg-slate-900/95',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      progressBg: 'bg-amber-500',
      glow: 'from-amber-500/20 to-transparent',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
    },
    BREACHED: {
      border: 'border-red-500/70 shadow-red-500/30',
      bg: 'bg-slate-950/95',
      badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
      progressBg: 'bg-red-500',
      glow: 'from-red-600/30 to-transparent',
      icon: <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
    }
  }[state];

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-50 transition-all duration-300 ease-out animate-in slide-in-from-top-6">
      {/* Android Heads-Up Notification Frame */}
      <div className={`relative overflow-hidden rounded-2xl border ${stateStyles.border} ${stateStyles.bg} backdrop-blur-xl shadow-2xl p-4 text-white`}>
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stateStyles.glow}`} />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-slate-400">
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                INSTANT ON-DEVICE HEADS-UP
              </span>
              <span>•</span>
              <span className="font-mono text-slate-400">{autoDismissTimer}s</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {roastMessage && (
              <button
                onClick={() => speakRoast(roastMessage, true)}
                title="Play voice audio"
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-3 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 mt-0.5">
            {stateStyles.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <h3 className="font-bold text-sm tracking-tight text-slate-100 truncate">
                {payload.title}
              </h3>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${stateStyles.badgeBg}`}>
                -₹{spentAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {payload.body}
            </p>

            {/* Personality Roast Callout */}
            {roastMessage && (
              <div className="mt-2 text-xs font-medium italic text-indigo-300/90 bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-2 flex items-start gap-1.5">
                <span className="shrink-0 text-sm">🎙️</span>
                <span>"{roastMessage}"</span>
              </div>
            )}

            {/* Live Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{percentUsed}% of daily allowance</span>
                <span className="font-semibold text-slate-200">
                  {remainingAllowance >= 0 ? `₹${remainingAllowance} left` : `Exceeded by ₹${Math.abs(remainingAllowance)}`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stateStyles.progressBg} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(5, percentUsed))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* One-Tap Action Buttons (Core Differentiator: Instant triage without opening app) */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
          {/* Split / Shared button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSplitMenu(!showSplitMenu);
                setShowCategoryMenu(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700/50 transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Split</span>
            </button>

            {showSplitMenu && (
              <div className="absolute bottom-full left-0 mb-1.5 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    onSplit(transactionId, 0.5);
                    setShowSplitMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Split 50% (You pay ₹{Math.round(spentAmount * 0.5)})
                </button>
                <button
                  onClick={() => {
                    onSplit(transactionId, 0.333);
                    setShowSplitMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Split 3-way (You pay ₹{Math.round(spentAmount * 0.333)})
                </button>
                <button
                  onClick={() => {
                    onSplit(transactionId, 0.25);
                    setShowSplitMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Split 4-way (You pay ₹{Math.round(spentAmount * 0.25)})
                </button>
              </div>
            )}
          </div>

          {/* Not Daily Spend button */}
          <button
            onClick={() => onExclude(transactionId)}
            title="Mark as emergency, medical, travel, or fixed bill"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700/50 transition active:scale-95"
          >
            <ShieldBan className="w-3.5 h-3.5 text-amber-400" />
            <span>Not Daily Spend</span>
          </button>

          {/* Tag Category button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCategoryMenu(!showCategoryMenu);
                setShowSplitMenu(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 border border-slate-700/50 transition active:scale-95"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tag</span>
            </button>

            {showCategoryMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                {[
                  'Quick Commerce & Groceries',
                  'Food & Dining',
                  'Food & Coffee',
                  'Commute & Travel',
                  'Shopping & Retail',
                  'Local Merchant & UPI'
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onRecategorize(transactionId, cat);
                      setShowCategoryMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 truncate"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
