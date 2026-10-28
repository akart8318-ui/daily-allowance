import React, { useState } from 'react';
import { Transaction } from '../types';
import {
  CreditCard,
  QrCode,
  Share2,
  ShieldCheck,
  ShieldBan,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Tag,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onToggleExclude: (txId: string) => void;
  onSplit: (txId: string, ratio: number) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const TransactionFeed: React.FC<Props> = ({
  transactions,
  onToggleExclude,
  onSplit,
  onDeleteTransaction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'DEBIT' | 'REFUND' | 'SHIELDED'>('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'REFUND') return tx.type === 'REFUND';
    if (selectedFilter === 'SHIELDED') return tx.isExcludedFromDaily || tx.isSelfTransfer || tx.isCreditCardBill;
    if (selectedFilter === 'DEBIT') return tx.type === 'DEBIT' && !tx.isExcludedFromDaily;

    return true;
  });

  return (
    <div className="rounded-3xl bg-[#0F1626]/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Today’s Live Transactions</h3>
            <p className="text-[11px] text-slate-400">Deduplicated & classified in real-time</p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {transactions.length} total events
        </span>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search merchant, category, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          {(['ALL', 'DEBIT', 'REFUND', 'SHIELDED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter === 'DEBIT' ? 'Active Debits' : filter === 'REFUND' ? 'Refunds' : 'Shielded'}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-lg">
            🍃
          </div>
          <h4 className="mt-2 font-semibold text-slate-200 text-xs">No Matching Transactions</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {transactions.length === 0 ? 'Simulate or log a spend to see it reflect live.' : 'Try adjusting your search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-0.5">
          {filteredTransactions.map((tx) => {
            const isRefund = tx.type === 'REFUND';
            const isCredit = tx.type === 'CREDIT';
            const isNeutralized = tx.isExcludedFromDaily || tx.isSelfTransfer || tx.isCreditCardBill;
            const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={tx.id}
                className={`p-3 rounded-2xl border transition ${
                  isNeutralized
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isRefund ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-200'
                    }`}>
                      {tx.category.includes('Coffee') ? '☕' : tx.isQuickCommerce ? '⚡' : tx.category.includes('Food') ? '🍔' : tx.category.includes('Commute') ? '🚗' : '💸'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-xs text-slate-100 truncate">
                          {tx.merchantName}
                        </h4>
                        {tx.source === 'UPI_NOTIF' && (
                          <span className="text-[9px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                            UPI
                          </span>
                        )}
                        {tx.source === 'BANK_SMS' && (
                          <span className="text-[9px] bg-cyan-500/15 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                            SMS
                          </span>
                        )}
                        {tx.source === 'MANUAL' && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            CASH
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>{timeStr}</span>
                        <span>•</span>
                        <span className="truncate">{tx.category}</span>
                        {tx.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-400 truncate max-w-[120px]">{tx.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-mono font-bold text-sm ${
                      isRefund || isCredit
                        ? 'text-emerald-400'
                        : isNeutralized
                        ? 'text-slate-500 line-through'
                        : 'text-slate-100'
                    }`}>
                      {isRefund ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${tx.amount.toLocaleString('en-IN')}`}
                    </div>

                    {tx.splitRatio < 1 && !isNeutralized && (
                      <div className="text-[10px] font-mono text-indigo-400">
                        Paid: ₹{tx.effectiveDailyDeduction} ({Math.round(tx.splitRatio * 100)}%)
                      </div>
                    )}

                    {isNeutralized && (
                      <div className="text-[10px] font-medium text-amber-400/90 flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Shielded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Ribbon */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleExclude(tx.id)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] transition ${
                        isNeutralized
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
                      }`}
                    >
                      {isNeutralized ? 'Excluded' : 'Mark Excluded'}
                    </button>

                    {!isNeutralized && (
                      <button
                        onClick={() => onSplit(tx.id, tx.splitRatio === 1 ? 0.5 : 1)}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[10px] flex items-center gap-1"
                      >
                        <Share2 className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{tx.splitRatio === 1 ? 'Split 50%' : 'Reset Split'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tx.utrReference && (
                      <span className="font-mono text-[9px] text-slate-500 hidden sm:inline">
                        Ref: {tx.utrReference.substring(0, 8)}...
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Delete this transaction and restore allowance"
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
