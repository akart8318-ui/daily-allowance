import React, { useState } from 'react';
import { PlusCircle, X, DollarSign, Tag, Calendar, CreditCard, Share2, ShieldBan, Sparkles } from 'lucide-react';
import { TransactionSource } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (payload: {
    amount: number;
    merchantName: string;
    category: string;
    source: TransactionSource;
    splitRatio: number;
    isExcluded: boolean;
    notes?: string;
  }) => void;
}

const CATEGORIES = [
  'Quick Commerce & Groceries',
  'Food & Dining',
  'Food & Coffee',
  'Commute & Travel',
  'Shopping & Retail',
  'Subscriptions & OTT',
  'Medical & Emergency',
  'Chai & Snacks',
  'Local Merchant & UPI'
];

export const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onAddTransaction }) => {
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [source, setSource] = useState<TransactionSource>('UPI_NOTIF');
  const [splitRatio, setSplitRatio] = useState(1);
  const [isExcluded, setIsExcluded] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!merchantName.trim()) {
      alert('Please enter a merchant name.');
      return;
    }

    onAddTransaction({
      amount: parsedAmount,
      merchantName: merchantName.trim(),
      category,
      source,
      splitRatio,
      isExcluded,
      notes: notes.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F1626] border border-slate-800 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Log Dynamic Expense</h3>
              <p className="text-[11px] text-slate-400">Instantly recalculates today's allowance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 font-mono font-bold">₹</span>
              <input
                type="number"
                placeholder="250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full rounded-2xl bg-slate-900 border border-slate-700 pl-8 pr-4 py-2.5 text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Merchant / Payee Name
            </label>
            <input
              type="text"
              placeholder="e.g. Blinkit, Swiggy, Third Wave Coffee"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Rail
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as TransactionSource)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="UPI_NOTIF">UPI App (GPay / PhonePe)</option>
                <option value="BANK_SMS">Bank Debit SMS</option>
                <option value="MANUAL">Cash / Manual</option>
                <option value="AA_SYNC">Account Aggregator Sync</option>
              </select>
            </div>
          </div>

          {/* Split Expense */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Split Expense</span>
              </span>
              <span className="font-mono text-indigo-300">
                You pay: {Math.round(splitRatio * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Full 100%', ratio: 1 },
                { label: '50% Split', ratio: 0.5 },
                { label: '3-Way (33%)', ratio: 0.333 },
                { label: '4-Way (25%)', ratio: 0.25 }
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSplitRatio(s.ratio)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-medium border text-center transition ${
                    splitRatio === s.ratio
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exclude from Daily */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Shield from Daily Allowance</div>
                <div className="text-[10px] text-slate-400">Mark as fixed bill, medical emergency, or travel</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isExcluded}
              onChange={(e) => setIsExcluded(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
          </div>

          {/* Notes */}
          <div>
            <input
              type="text"
              placeholder="Notes (optional): e.g. Oat milk, dinner with Rahul"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            Add Transaction & Update Allowance
          </button>
        </form>
      </div>
    </div>
  );
};
