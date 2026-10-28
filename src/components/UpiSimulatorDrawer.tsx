import React, { useState } from 'react';
import { parseAnyBankMessage } from '../services/multiBankSmsParser';
import { Zap, Play, Send, ShieldAlert, Sparkles, Copy, X, Building2, ArrowRightLeft } from 'lucide-react';
import { TransactionSource } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (payload: {
    amount: number;
    merchantName: string;
    source: TransactionSource;
    utrReference?: string;
    type?: 'DEBIT' | 'CREDIT' | 'REFUND';
    notes?: string;
    accountLast4?: string;
    bankName?: string;
    availableBalance?: number;
  }) => void;
  lastSimulatedUtr?: string;
  lastSimulatedAmount?: number;
}

export const UpiSimulatorDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onSimulate,
  lastSimulatedUtr,
  lastSimulatedAmount
}) => {
  const [customSms, setCustomSms] = useState('');
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'BANKS' | 'CUSTOM'>('BANKS');

  if (!isOpen) return null;

  // Multi-Bank automated test presets
  const bankPresets = [
    {
      bank: 'HDFC Bank',
      title: 'HDFC Bank UPI Debit (₹450 Blinkit)',
      amount: 450,
      merchant: 'Blinkit',
      source: 'BANK_SMS' as const,
      accountLast4: '4821',
      availableBalance: 33750,
      utr: '630114892011',
      badge: 'HDFC **4821',
      description: 'Debits ₹450 & automatically syncs HDFC balance from ₹34,200 to ₹33,750'
    },
    {
      bank: 'ICICI Bank',
      title: 'ICICI Bank Debit (₹320 Swiggy)',
      amount: 320,
      merchant: 'Swiggy',
      source: 'BANK_SMS' as const,
      accountLast4: '9012',
      availableBalance: 18130,
      utr: '492019481902',
      badge: 'ICICI **9012',
      description: 'Debits ₹320 & updates ICICI available balance from ₹18,450 to ₹18,130'
    },
    {
      bank: 'Self-Transfer',
      title: 'HDFC to ICICI Transfer (₹5,000)',
      amount: 5000,
      merchant: 'Transfer to ICICI a/c **9012',
      source: 'BANK_SMS' as const,
      accountLast4: '4821',
      availableBalance: 28750,
      utr: '920194810294',
      badge: 'Multi-Bank Shield',
      description: 'Detected as internal transfer between your 2 linked accounts — 100% neutralized!'
    },
    {
      bank: 'State Bank of India',
      title: 'SBI UPI Alert (₹150 Local Chai)',
      amount: 150,
      merchant: 'Local Chai Tapri',
      source: 'BANK_SMS' as const,
      accountLast4: '1928',
      availableBalance: 8170,
      utr: '849201849102',
      badge: 'SBI **1928',
      description: 'Debits ₹150 for chai via SBI UPI with real-time balance extraction'
    },
    {
      bank: 'Axis Bank',
      title: 'Axis Bank Alert (₹1,200 Uber)',
      amount: 1200,
      merchant: 'Uber Rides',
      source: 'BANK_SMS' as const,
      accountLast4: '3941',
      availableBalance: 21600,
      utr: '392018491029',
      badge: 'Axis **3941',
      description: 'Axis bank debit alert with automatic category tagging to Commute & Travel'
    },
    {
      bank: 'Kotak Mahindra',
      title: 'Kotak Bank Alert (₹280 Third Wave Coffee)',
      amount: 280,
      merchant: 'Third Wave Coffee',
      source: 'BANK_SMS' as const,
      accountLast4: '5510',
      availableBalance: 13820,
      utr: '592018491024',
      badge: 'Kotak **5510',
      description: 'Kotak debit alert with safe-zone green heads-up feedback'
    }
  ];

  const genericPresets = [
    {
      title: 'Blinkit Instant Delivery (₹600)',
      amount: 600,
      merchant: 'Blinkit',
      source: 'UPI_NOTIF' as const,
      category: 'Quick Commerce',
      utr: '630114892011',
      badge: 'GPay UPI',
      description: 'Triggers instant Heads-Up notification + Quick Commerce leak count'
    },
    {
      title: 'Deduplication Test (Bank SMS ₹600)',
      amount: lastSimulatedAmount || 600,
      merchant: 'Blinkit',
      source: 'BANK_SMS' as const,
      category: 'Bank SMS',
      utr: lastSimulatedUtr || '630114892011',
      badge: 'SMS Deduplication',
      description: 'Tests 120s Deduplication Engine — ensures ₹600 is NOT deducted twice!'
    },
    {
      title: 'Swiggy Dinner Feast (₹2,500)',
      amount: 2500,
      merchant: 'Swiggy Food',
      source: 'UPI_NOTIF' as const,
      category: 'Food Delivery',
      utr: '492018471902',
      badge: 'Overspend Trigger',
      description: 'Breaches daily allowance — activates Crimson Red alert + Tomorrow rebalance'
    },
    {
      title: 'Cancelled Swiggy Order (+₹400 Refund)',
      amount: 400,
      merchant: 'Swiggy',
      source: 'BANK_SMS' as const,
      type: 'REFUND' as const,
      category: 'Refund',
      utr: '592018491024',
      badge: 'Refund Reconcile',
      description: 'Adds +₹400 back into today’s allowance immediately'
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSms.trim()) return;

    const parsed = parseAnyBankMessage(customSms);
    if (parsed) {
      onSimulate({
        amount: parsed.amount,
        merchantName: parsed.merchantRaw,
        source: 'BANK_SMS',
        utrReference: parsed.utr,
        type: parsed.type,
        accountLast4: parsed.accountLast4,
        bankName: parsed.bankName,
        availableBalance: parsed.availableBalance,
        notes: customSms
      });
      setCustomSms('');
      onClose();
    } else {
      alert('Could not parse transaction from text. Ensure text includes an amount like "Rs. 450" or "INR 500".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-xl bg-[#0D1322] border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">UPI & Multi-Bank Ingestion Simulator</h3>
              <p className="text-xs text-slate-400">Test real-time Bank SMS, UPI debits & live balance updates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 sm:p-3 bg-slate-900/60 border-b border-slate-800 flex gap-1.5">
          <button
            onClick={() => setActiveTab('BANKS')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeTab === 'BANKS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Bank Alerts (HDFC / ICICI / SBI)
          </button>
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeTab === 'PRESETS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            UPI & App Presets
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeTab === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw SMS Parser
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'BANKS' && (
            <div className="space-y-2.5">
              {bankPresets.map((p, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100">{p.title}</span>
                      <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSimulate({
                        amount: p.amount,
                        merchantName: p.merchant,
                        source: p.source,
                        utrReference: p.utr,
                        type: 'DEBIT',
                        accountLast4: p.accountLast4,
                        bankName: p.bank,
                        availableBalance: p.availableBalance
                      });
                      onClose();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Fire</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PRESETS' && (
            <div className="space-y-2.5">
              {genericPresets.map((p, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100">{p.title}</span>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSimulate({
                        amount: p.amount,
                        merchantName: p.merchant,
                        source: p.source,
                        utrReference: p.utr,
                        type: p.type || 'DEBIT'
                      });
                      onClose();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Fire</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'CUSTOM' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Paste Any Indian Bank SMS or UPI Notification:
                </label>
                <textarea
                  value={customSms}
                  onChange={(e) => setCustomSms(e.target.value)}
                  placeholder="e.g. HDFC Bank: Rs 450.00 debited from a/c **4821 to VPA blinkit@icici (UPI Ref 630114892011). Bal: Rs 33,750.00."
                  rows={4}
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Sample Quick Pastes */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Click to Load Indian Bank SMS Templates:</span>
                <div className="space-y-1">
                  {[
                    'HDFC Bank: Rs 450.00 debited from a/c **4821 to VPA blinkit@icici on 28-OCT-26 (UPI Ref 630114892011). Bal: Rs 33,750.00.',
                    'Dear Customer, Acct XX9012 debited with INR 320.00 on 28-Oct-26. Info: UPI/392018491029/Swiggy. Available Bal: INR 18,130.25.',
                    'Dear SBI User, your A/c ending 1928 debited by Rs 150.00 on 28Oct26 transfer to UPI/CR/491028491028/Chai. Avail Bal: Rs 8,170.50.',
                    'Axis Bank: INR 1,200.00 debited from A/c no. XX3941 on 28-10-2026 towards UPI/Uber. Available Balance is INR 21,600.00.'
                  ].map((sample, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setCustomSms(sample)}
                      className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-[11px] font-mono text-slate-300 truncate"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Parse SMS & Update Linked Balance in &lt;1s</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
