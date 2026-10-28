import React, { useState, useEffect } from 'react';
import {
  BudgetConfig,
  DailyLedger,
  NotificationPayload,
  Transaction,
  PopUpState,
  TransactionSource,
  BankAccount
} from './types';
import {
  calculateBaseDailyAllowance,
  recalculateLedger,
  evaluatePopUpState
} from './services/allowanceEngine';
import {
  checkDeduplication,
  processTransactionEdgeCases
} from './services/deduplicationEngine';
import { soundSynth, getPersonalityRoast, speakRoast } from './services/audioHaptics';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredLedgers,
  saveStoredLedgers,
  loadStoredBankAccounts,
  saveStoredBankAccounts,
  resetAllData,
  loadViewMode,
  saveViewMode
} from './services/storage';
import { simulateMidnightRollover } from './services/dayRollover';
import { isInternalSelfTransfer, updateAccountBalanceFromEvent } from './services/bankRegistry';

import { DeviceFrame } from './components/DeviceFrame';
import { HeroCountdownCard } from './components/HeroCountdownCard';
import { InstantPopUpOverlay } from './components/InstantPopUpOverlay';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import { QuickCommerceRadar } from './components/QuickCommerceRadar';
import { TransactionFeed } from './components/TransactionFeed';
import { UpiSimulatorDrawer } from './components/UpiSimulatorDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { RoastCoachSettings } from './components/RoastCoachSettings';
import { FastCashModal } from './components/FastCashModal';
import { AndroidCodeViewerModal } from './components/AndroidCodeViewerModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { LinkedAccountsHub } from './components/LinkedAccountsHub';
import { LinkBankModal } from './components/LinkBankModal';

import {
  Zap,
  Volume2,
  VolumeX,
  Code,
  Flame,
  ShieldCheck,
  PlusCircle,
  Bell,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FastForward,
  Building2
} from 'lucide-react';

export function App() {
  // Load persistent state
  const [config, setConfig] = useState<BudgetConfig>(loadStoredConfig);
  const [initialData] = useState(() => loadStoredLedgers(config));
  const [monthLedgers, setMonthLedgers] = useState<DailyLedger[]>(initialData.ledgers);
  const [todayIndex, setTodayIndex] = useState<number>(initialData.todayIndex);
  const [wishlistPotTotal, setWishlistPotTotal] = useState<number>(initialData.wishlistPot);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(loadStoredBankAccounts);
  const [viewMode, setViewMode] = useState<'RESPONSIVE' | 'MOBILE_PHONE'>(loadViewMode);

  // Modals & Drawers
  const [currentNotification, setCurrentNotification] = useState<NotificationPayload | null>(null);
  const [toastAlert, setToastAlert] = useState<{ message: string; type: 'INFO' | 'WARN' | 'SUCCESS' } | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isRoastSettingsOpen, setIsRoastSettingsOpen] = useState(false);
  const [isFastCashOpen, setIsFastCashOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isLinkBankOpen, setIsLinkBankOpen] = useState(false);

  // Last simulated transaction for deduplication testing
  const [lastUtr, setLastUtr] = useState<string>('630114892011');
  const [lastAmount, setLastAmount] = useState<number>(600);

  const todayLedger = monthLedgers[todayIndex] || monthLedgers[0];

  // Dynamic streak computation
  const streakCount = monthLedgers
    .slice(0, todayIndex + 1)
    .filter((d) => d.status === 'SAFE').length;

  // Auto-save whenever state changes
  useEffect(() => {
    saveStoredConfig(config);
  }, [config]);

  useEffect(() => {
    saveStoredLedgers(monthLedgers, todayIndex, wishlistPotTotal);
  }, [monthLedgers, todayIndex, wishlistPotTotal]);

  useEffect(() => {
    saveStoredBankAccounts(bankAccounts);
  }, [bankAccounts]);

  useEffect(() => {
    saveViewMode(viewMode);
  }, [viewMode]);

  // Toast timer
  useEffect(() => {
    if (!toastAlert) return;
    const timer = setTimeout(() => setToastAlert(null), 4500);
    return () => clearTimeout(timer);
  }, [toastAlert]);

  /**
   * TRANSACTION INGESTION & PROCESSING (Multi-Bank Automated)
   */
  const handleSimulateTransaction = (payload: {
    amount: number;
    merchantName: string;
    source: TransactionSource;
    utrReference?: string;
    type?: 'DEBIT' | 'CREDIT' | 'REFUND';
    notes?: string;
    splitRatio?: number;
    isExcluded?: boolean;
    category?: string;
    accountLast4?: string;
    bankName?: string;
    availableBalance?: number;
  }) => {
    const {
      amount,
      merchantName,
      source,
      utrReference,
      type = 'DEBIT',
      notes,
      splitRatio = 1,
      isExcluded = false,
      category,
      accountLast4,
      bankName,
      availableBalance
    } = payload;

    setLastUtr(utrReference || 'UTR-' + Date.now());
    setLastAmount(amount);

    // 1. Deduplication Check (120-second rolling window)
    const dedupCheck = checkDeduplication(
      { amount, utrReference, source, merchantName, timestamp: Date.now() },
      todayLedger.transactions,
      120
    );

    if (dedupCheck.isDuplicate) {
      setToastAlert({
        message: `🛡️ Deduplicated! ${dedupCheck.reason}`,
        type: 'WARN'
      });
      soundSynth.playWarningChime();
      return;
    }

    // 2. Check Multi-Bank Internal Self-Transfer
    const rawContext = `${merchantName} ${notes || ''}`;
    const isSelfTransferDetected = isInternalSelfTransfer(rawContext, bankAccounts, accountLast4);

    // 3. Process Edge Cases (Shields, CC Bill, Self-transfer)
    const { processedTx, shouldDeductFromDaily, alertNote } = processTransactionEdgeCases(
      {
        amount,
        merchantName,
        source,
        utrReference,
        type,
        notes,
        splitRatio,
        isExcludedFromDaily: isExcluded || isSelfTransferDetected,
        accountLast4,
        timestamp: Date.now()
      },
      config
    );

    if (isSelfTransferDetected) {
      processedTx.isExcludedFromDaily = true;
      processedTx.isSelfTransfer = true;
      processedTx.effectiveDailyDeduction = 0;
    }

    if (category) {
      processedTx.category = category;
    }
    if (bankName) {
      processedTx.bankName = bankName;
    }
    if (availableBalance !== undefined) {
      processedTx.availableBalanceAfterTx = availableBalance;
    }

    // 4. Update Linked Bank Account's Live Balance
    const { updatedAccounts, updatedAccount } = updateAccountBalanceFromEvent(
      bankAccounts,
      accountLast4,
      bankName,
      availableBalance,
      amount,
      type
    );
    setBankAccounts(updatedAccounts);

    if (isSelfTransferDetected) {
      setToastAlert({
        message: '🛡️ Multi-Bank Internal Transfer Detected: Ignored from daily allowance calculation.',
        type: 'INFO'
      });
    } else if (alertNote) {
      setToastAlert({
        message: alertNote,
        type: 'INFO'
      });
    } else if (updatedAccount) {
      setToastAlert({
        message: `⚡ ${updatedAccount.bankName} balance updated to ₹${updatedAccount.balance.toLocaleString('en-IN')}`,
        type: 'SUCCESS'
      });
    }

    // 5. Recalculate Ledger
    const updatedTransactions = [processedTx, ...todayLedger.transactions];
    const newTodayLedger = recalculateLedger(todayLedger, updatedTransactions, config);

    setMonthLedgers((prev) => {
      const copy = [...prev];
      copy[todayIndex] = newTodayLedger;
      return copy;
    });

    // 6. Instant Feedback Loop (< 1s Heads-Up Notification)
    if (shouldDeductFromDaily && type === 'DEBIT' && !isSelfTransferDetected) {
      const remaining = newTodayLedger.remainingAllowance;
      const dailyLimit = newTodayLedger.startingAllowance;
      const totalSpent = newTodayLedger.totalSpent;
      const state = evaluatePopUpState(totalSpent, dailyLimit);
      const percentUsed = Math.round((totalSpent / Math.max(1, dailyLimit)) * 100);

      // Audio feedback
      if (config.soundEnabled) {
        if (state === 'SAFE') soundSynth.playSafeChime();
        else if (state === 'CAUTION') soundSynth.playWarningChime();
        else soundSynth.playBreachAlert();
      }

      // Voice Roast / Coach
      const roast = getPersonalityRoast(config.persona, state, merchantName, amount, remaining, percentUsed);
      if (config.voiceRoastEnabled) {
        speakRoast(roast, true);
      }

      let title = `💸 ₹${amount.toLocaleString('en-IN')} spent at ${merchantName}`;
      let body = `₹${remaining.toLocaleString('en-IN')} left for today (Daily Limit: ₹${dailyLimit.toLocaleString('en-IN')}). You're on track!`;

      if (state === 'CAUTION') {
        title = `⚠️ ₹${amount.toLocaleString('en-IN')} spent on ${merchantName} — Slow Down!`;
        body = `Only ₹${remaining.toLocaleString('en-IN')} left for the rest of today (${percentUsed}% of your ₹${dailyLimit.toLocaleString('en-IN')} allowance used).`;
      } else if (state === 'BREACHED') {
        title = `🚨 Daily Allowance Exceeded by ₹${Math.abs(remaining).toLocaleString('en-IN')}!`;
        body = `₹${amount.toLocaleString('en-IN')} spent on ${merchantName}. Total today: ₹${totalSpent.toLocaleString('en-IN')} / ₹${dailyLimit.toLocaleString('en-IN')}. Tomorrow's allowance will adapt.`;
      }

      setCurrentNotification({
        id: 'notif-' + Date.now(),
        title,
        body,
        state,
        spentAmount: amount,
        remainingAllowance: remaining,
        dailyLimit,
        percentUsed,
        merchantName,
        category: processedTx.category,
        timestamp: Date.now(),
        roastMessage: roast,
        transactionId: processedTx.id,
        bankName: processedTx.bankName,
        accountLast4: processedTx.accountLast4,
        availableBalance: processedTx.availableBalanceAfterTx
      });
    } else if (type === 'REFUND') {
      soundSynth.playCashSweep();
      setToastAlert({
        message: `🎉 Instant Refund Reconciled: +₹${amount.toLocaleString('en-IN')} credited back to today's allowance!`,
        type: 'SUCCESS'
      });
    }
  };

  /**
   * DELETE TRANSACTION
   */
  const handleDeleteTransaction = (txId: string) => {
    const updatedTransactions = todayLedger.transactions.filter((tx) => tx.id !== txId);
    const newTodayLedger = recalculateLedger(todayLedger, updatedTransactions, config);

    setMonthLedgers((prev) => {
      const copy = [...prev];
      copy[todayIndex] = newTodayLedger;
      return copy;
    });

    setToastAlert({
      message: 'Transaction deleted. Daily allowance restored!',
      type: 'INFO'
    });
  };

  /**
   * SPLIT EXPENSE
   */
  const handleSplitTransaction = (txId: string, ratio: number) => {
    const updated = todayLedger.transactions.map((tx) => {
      if (tx.id === txId) {
        return {
          ...tx,
          splitRatio: ratio,
          effectiveDailyDeduction: Math.round(tx.amount * ratio)
        };
      }
      return tx;
    });

    const newLedger = recalculateLedger(todayLedger, updated, config);
    setMonthLedgers((prev) => {
      const copy = [...prev];
      copy[todayIndex] = newLedger;
      return copy;
    });

    setToastAlert({
      message: `Split applied: only ${Math.round(ratio * 100)}% counts towards daily spend.`,
      type: 'SUCCESS'
    });
    setCurrentNotification(null);
  };

  /**
   * EXCLUDE TRANSACTION FROM DAILY
   */
  const handleExcludeTransaction = (txId: string) => {
    const updated = todayLedger.transactions.map((tx) => {
      if (tx.id === txId) {
        return {
          ...tx,
          isExcludedFromDaily: !tx.isExcludedFromDaily,
          effectiveDailyDeduction: tx.isExcludedFromDaily ? tx.amount : 0
        };
      }
      return tx;
    });

    const newLedger = recalculateLedger(todayLedger, updated, config);
    setMonthLedgers((prev) => {
      const copy = [...prev];
      copy[todayIndex] = newLedger;
      return copy;
    });

    setToastAlert({
      message: 'Transaction shield status toggled.',
      type: 'INFO'
    });
    setCurrentNotification(null);
  };

  /**
   * RECATEGORIZE
   */
  const handleRecategorize = (txId: string, newCategory: string) => {
    const updated = todayLedger.transactions.map((tx) => {
      if (tx.id === txId) {
        return { ...tx, category: newCategory };
      }
      return tx;
    });

    const newLedger = recalculateLedger(todayLedger, updated, config);
    setMonthLedgers((prev) => {
      const copy = [...prev];
      copy[todayIndex] = newLedger;
      return copy;
    });

    setToastAlert({
      message: `Updated category to "${newCategory}".`,
      type: 'SUCCESS'
    });
  };

  /**
   * SIMULATE MIDNIGHT ROLLOVER
   */
  const handleAdvanceDay = () => {
    const result = simulateMidnightRollover(monthLedgers, todayIndex, config, wishlistPotTotal);

    setMonthLedgers(result.updatedLedgers);
    setTodayIndex(result.newTodayIndex);
    setWishlistPotTotal(result.newWishlistPot);

    if (result.sweptAmount > 0) {
      soundSynth.playCashSweep();
    } else if (result.deficitCarried > 0) {
      soundSynth.playWarningChime();
    }

    setToastAlert({
      message: result.summaryMessage,
      type: result.isStreakMaintained ? 'SUCCESS' : 'WARN'
    });
  };

  /**
   * RESET DATA
   */
  const handleResetData = () => {
    if (window.confirm('Reset all transactions and ledgers back to default starting demo state?')) {
      const fresh = resetAllData(config);
      setMonthLedgers(fresh.ledgers);
      setTodayIndex(fresh.todayIndex);
      setWishlistPotTotal(fresh.wishlistPot);
      setBankAccounts(fresh.bankAccounts);
      setToastAlert({
        message: 'All data reset to fresh starting cycle!',
        type: 'SUCCESS'
      });
    }
  };

  /**
   * BANK ACCOUNT SYNC HANDLERS
   */
  const handleSyncAccount = (bankId: string) => {
    setBankAccounts((prev) =>
      prev.map((acc) =>
        acc.id === bankId
          ? { ...acc, lastSyncedAt: Date.now(), syncStatus: 'CONNECTED' as const }
          : acc
      )
    );
    setToastAlert({
      message: 'Account synced with bank via Account Aggregator.',
      type: 'SUCCESS'
    });
  };

  const handleSyncAllAccounts = () => {
    setBankAccounts((prev) =>
      prev.map((acc) => ({ ...acc, lastSyncedAt: Date.now(), syncStatus: 'CONNECTED' as const }))
    );
    setToastAlert({
      message: `Synced all ${bankAccounts.length} bank accounts via RBI Account Aggregator!`,
      type: 'SUCCESS'
    });
  };

  const handleUnlinkAccount = (bankId: string) => {
    setBankAccounts((prev) => prev.filter((acc) => acc.id !== bankId));
    setToastAlert({
      message: 'Bank account unlinked from app.',
      type: 'INFO'
    });
  };

  const handleBankLinked = (newAccounts: BankAccount[]) => {
    setBankAccounts((prev) => [...prev, ...newAccounts]);
    soundSynth.playSafeChime();
    setToastAlert({
      message: `Successfully linked ${newAccounts.length} account(s) via RBI Account Aggregator!`,
      type: 'SUCCESS'
    });
  };

  return (
    <DeviceFrame viewMode={viewMode} onToggleViewMode={setViewMode}>
      {/* Heads-Up Notification Pop-Up */}
      <InstantPopUpOverlay
        payload={currentNotification}
        onDismiss={() => setCurrentNotification(null)}
        onSplit={handleSplitTransaction}
        onExclude={handleExcludeTransaction}
        onRecategorize={handleRecategorize}
        voiceEnabled={config.voiceRoastEnabled}
      />

      {/* Floating Status Toast */}
      {toastAlert && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-medium text-slate-200 animate-in slide-in-from-bottom-5 max-w-[90vw]">
          {toastAlert.type === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastAlert.type === 'WARN' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastAlert.type === 'INFO' && <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="truncate">{toastAlert.message}</span>
        </div>
      )}

      {/* Navigation Top Header */}
      <header className="sticky top-0 z-30 bg-[#080C16]/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center text-sm shadow-md shrink-0">
              💸
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white truncate">
                  Daily Allowance
                </span>
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded">
                  UPI & BANK SYNC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Automated Multi-Bank Allowance & Spend Tracker
              </p>
            </div>
          </div>

          {/* Quick Actions Header Ribbon */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Link Bank Button */}
            <button
              onClick={() => setIsLinkBankOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Link Bank</span>
            </button>

            {/* Personality Roast Toggle */}
            <button
              onClick={() => setIsRoastSettingsOpen(true)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
                config.persona === 'ROAST'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
              title="Roast vs Coach Personality"
            >
              {config.persona === 'ROAST' ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" />
                  <span className="hidden sm:inline">Roast</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Coach</span>
                </>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
              className={`p-1.5 rounded-xl border transition ${
                config.soundEnabled ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={config.soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
            >
              {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* 3-Second Cash Entry */}
            <button
              onClick={() => setIsFastCashOpen(true)}
              className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Cash</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={handleResetData}
              title="Reset data to initial state"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Kotlin Code Viewer */}
            <button
              onClick={() => setIsCodeViewerOpen(true)}
              className="px-2 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-mono font-medium flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kotlin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Body Container */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-4 space-y-5 flex-1">
        {/* Module 4: Hero Countdown Card */}
        <HeroCountdownCard
          todayLedger={todayLedger}
          config={config}
          streakCount={streakCount}
          wishlistPotTotal={wishlistPotTotal}
          todayIndex={todayIndex}
          onOpenSettings={() => setIsOnboardingOpen(true)}
          onQuickSimulate={() => setIsSimulatorOpen(true)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onAdvanceDay={handleAdvanceDay}
          onResetData={handleResetData}
        />

        {/* Linked Bank Accounts Hub with Live Balances & Multi-Bank Sync */}
        <LinkedAccountsHub
          accounts={bankAccounts}
          onOpenLinkBankModal={() => setIsLinkBankOpen(true)}
          onSyncAccount={handleSyncAccount}
          onUnlinkAccount={handleUnlinkAccount}
          onSyncAll={handleSyncAllAccounts}
        />

        {/* Quick Simulator Floating Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/30 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div className="text-xs truncate">
              <span className="font-bold text-slate-200">Automated Multi-Bank Listener Active: </span>
              <span className="text-slate-400">HDFC, ICICI, SBI, Axis, Kotak SMS & GPay UPI</span>
            </div>
          </div>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            <span>Test Multi-Bank</span>
          </button>
        </div>

        {/* Grid: 30-Day Heatmap & Quick Commerce Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <QuickCommerceRadar transactions={todayLedger.transactions} />
          <CalendarHeatmap ledgers={monthLedgers} todayIndex={todayIndex} />
        </div>

        {/* Module 4: Live Feed with Search, Filter & Delete */}
        <TransactionFeed
          transactions={todayLedger.transactions}
          onToggleExclude={handleExcludeTransaction}
          onSplit={handleSplitTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>

      {/* Footer */}
      <footer className="mt-8 mb-4 text-center text-xs text-slate-500 space-y-1 px-4">
        <p>Daily Allowance & Instant UPI Tracker — Automated Multi-Bank Architecture</p>
        <p className="font-mono text-[10px] text-slate-600">
          RBI Account Aggregator (AA) Integrated • Real-time SMS Parsing for All Indian Banks
        </p>
      </footer>

      {/* Dialog Modals */}
      <UpiSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulateTransaction}
        lastSimulatedUtr={lastUtr}
        lastSimulatedAmount={lastAmount}
      />

      <LinkBankModal
        isOpen={isLinkBankOpen}
        onClose={() => setIsLinkBankOpen(false)}
        onBankLinked={handleBankLinked}
        existingAccounts={bankAccounts}
      />

      <AddTransactionModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddTransaction={(payload) => {
          handleSimulateTransaction({
            amount: payload.amount,
            merchantName: payload.merchantName,
            category: payload.category,
            source: payload.source,
            splitRatio: payload.splitRatio,
            isExcluded: payload.isExcluded,
            notes: payload.notes
          });
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        config={config}
        onSave={(newCfg) => {
          setConfig(newCfg);
          const baseDaily = calculateBaseDailyAllowance(newCfg, 30);
          setMonthLedgers((prev) =>
            prev.map((l, i) => {
              const allowance = i === todayIndex ? l.startingAllowance : baseDaily;
              return {
                ...l,
                startingAllowance: allowance,
                remainingAllowance: allowance - l.totalSpent,
                status: evaluatePopUpState(l.totalSpent, allowance)
              };
            })
          );
          setToastAlert({
            message: 'Allowance recomputed with new income shield settings!',
            type: 'SUCCESS'
          });
        }}
      />

      <RoastCoachSettings
        isOpen={isRoastSettingsOpen}
        onClose={() => setIsRoastSettingsOpen(false)}
        config={config}
        onUpdateConfig={(c) => setConfig(c)}
        todayLedger={todayLedger}
      />

      <FastCashModal
        isOpen={isFastCashOpen}
        onClose={() => setIsFastCashOpen(false)}
        onAddCash={(amount, merchant, cat) => {
          handleSimulateTransaction({
            amount,
            merchantName: merchant,
            source: 'MANUAL',
            category: cat,
            notes: 'Cash Spend'
          });
        }}
      />

      <AndroidCodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
    </DeviceFrame>
  );
}

export default App;
