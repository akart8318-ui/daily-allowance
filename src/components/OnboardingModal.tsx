import React, { useState } from 'react';
import { BudgetConfig, FixedCommitment, RolloverMode, CalculationMode } from '../types';
import { calculateBaseDailyAllowance } from '../services/allowanceEngine';
import { ShieldCheck, Sparkles, Check, Plus, Trash2, X, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onSave: (newConfig: BudgetConfig) => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [income, setIncome] = useState(config.monthlyIncome);
  const [calcMode, setCalcMode] = useState<CalculationMode>(config.calculationMode);
  const [savingsTarget, setSavingsTarget] = useState(config.savingsTarget);
  const [salaryDate, setSalaryDate] = useState(config.salaryCreditDate);
  const [rollover, setRollover] = useState<RolloverMode>(config.rolloverMode);
  const [commitments, setCommitments] = useState<FixedCommitment[]>(config.fixedCommitments);

  // New commitment input
  const [newCommitmentName, setNewCommitmentName] = useState('');
  const [newCommitmentAmount, setNewCommitmentAmount] = useState('');

  if (!isOpen) return null;

  const tempConfig: BudgetConfig = {
    ...config,
    monthlyIncome: income,
    calculationMode: calcMode,
    savingsTarget,
    salaryCreditDate: salaryDate,
    rolloverMode: rollover,
    fixedCommitments: commitments
  };

  const previewDailyAllowance = calculateBaseDailyAllowance(tempConfig, 30);
  const totalFixed = commitments.reduce((sum, c) => sum + c.amount, 0);
  const spendablePool = Math.max(0, income - (totalFixed + savingsTarget));

  const handleAddCommitment = () => {
    if (!newCommitmentName || !newCommitmentAmount) return;
    const amount = parseFloat(newCommitmentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setCommitments([
      ...commitments,
      {
        id: 'fix-' + Date.now(),
        name: newCommitmentName,
        category: 'Utilities',
        amount,
        dueDate: 5
      }
    ]);
    setNewCommitmentName('');
    setNewCommitmentAmount('');
  };

  const handleRemoveCommitment = (id: string) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0F1626] border border-slate-800 rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Allowance & Fixed Shield Configuration</h3>
              <p className="text-xs text-slate-400">Tailor your daily allowance and protect untouchable money</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider">
                Real Calculated Daily Allowance
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
                ₹{previewDailyAllowance.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-sans">/day</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {calcMode === 'SAFE_TO_SPEND'
                  ? `₹${income.toLocaleString('en-IN')} income - (₹${totalFixed.toLocaleString('en-IN')} bills + ₹${savingsTarget.toLocaleString('en-IN')} SIP) = ₹${spendablePool.toLocaleString('en-IN')} pool ÷ 30 days`
                  : `Gross: ₹${income.toLocaleString('en-IN')} ÷ 30 days`}
              </p>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Untouchable Shield</div>
              <div className="text-sm font-mono font-bold text-slate-200">
                ₹{(totalFixed + savingsTarget).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Allowance Calculation Formula:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCalcMode('SAFE_TO_SPEND')}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  calcMode === 'SAFE_TO_SPEND'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Smart Safe-to-Spend</span>
                  {calcMode === 'SAFE_TO_SPEND' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recommended. Deducts rent, EMIs, and SIP goals first so daily UPI never drains survival money.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode('GROSS')}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  calcMode === 'GROSS'
                    ? 'bg-indigo-950/30 border-indigo-500/50 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Simple Gross Mode (Reel)</span>
                  {calcMode === 'GROSS' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Divides full monthly income directly: ₹1,00,000 ÷ 30 days = ₹3,333/day.
                </p>
              </button>
            </div>
          </div>

          {/* Monthly Income & Savings Target Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Monthly Income</span>
                <span className="font-mono text-emerald-400">₹{income.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="20000"
                max="300000"
                step="5000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Monthly Savings / SIP Target</span>
                <span className="font-mono text-indigo-400">₹{savingsTarget.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="2500"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Rollover & Overspend Rules */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              End-of-Day Rollover & Overspend Rule:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'DYNAMIC' as RolloverMode,
                  name: 'Dynamic Rebalance',
                  desc: 'Unspent funds roll into buffer; deficits rebalance evenly across remaining days.'
                },
                {
                  id: 'STRICT' as RolloverMode,
                  name: 'Strict Reset + Wishlist',
                  desc: 'Unspent sweeps into Guilt-Free Wishlist pot. Deficits deducted from tomorrow.'
                },
                {
                  id: 'WEEKEND_BOOST' as RolloverMode,
                  name: 'Weekend Booster',
                  desc: 'Mon-Thu gets 85% baseline so Fri-Sun automatically get +20% higher budget.'
                }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRollover(r.id)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    rollover === r.id
                      ? 'bg-slate-800 border-indigo-500/70 text-white'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-200">{r.name}</div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fixed Commitments Shield Checklist ("Untouchable Money") */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Fixed Commitment Shield (Rent, EMI, SIP, CC):
              </label>
              <span className="text-xs font-mono text-slate-400">
                Total Shielded: ₹{totalFixed.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-2">
              {commitments.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {c.category}
                    </span>
                    <span className="font-medium text-slate-200">{c.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-200">
                      ₹{c.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommitment(c.id)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Custom Commitment */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. WiFi Bill or Gym"
                  value={newCommitmentName}
                  onChange={(e) => setNewCommitmentName(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newCommitmentAmount}
                  onChange={(e) => setNewCommitmentAmount(e.target.value)}
                  className="w-24 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCommitment}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            Apply & Recalculate Allowance
          </button>
        </div>
      </div>
    </div>
  );
};
