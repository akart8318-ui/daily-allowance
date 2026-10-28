import React, { useState } from 'react';
import { BankAccount } from '../types';
import {
  Building2,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRightLeft,
  Lock,
  Wallet
} from 'lucide-react';

interface Props {
  accounts: BankAccount[];
  onOpenLinkBankModal: () => void;
  onSyncAccount: (bankId: string) => void;
  onUnlinkAccount: (bankId: string) => void;
  onSyncAll: () => void;
}

export const LinkedAccountsHub: React.FC<Props> = ({
  accounts,
  onOpenLinkBankModal,
  onSyncAccount,
  onUnlinkAccount,
  onSyncAll
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const totalLiquidBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleSyncSingle = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onSyncAccount(id);
      setSyncingId(null);
    }, 700);
  };

  const handleSyncAllClick = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      onSyncAll();
      setIsSyncingAll(false);
    }, 900);
  };

  return (
    <div className="rounded-3xl bg-[#0F1626]/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">Linked Bank Accounts</h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                RBI AA SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated statement & balance synchronization</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAllClick}
            disabled={isSyncingAll}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'Syncing...' : 'Sync All'}</span>
          </button>

          <button
            onClick={onOpenLinkBankModal}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Link Bank</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance Callout */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider">
            Total Liquid Balance Across Linked Banks
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
            ₹{totalLiquidBalance.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{accounts.length} Accounts</span>
          <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Auto-Sync</span>
          </div>
        </div>
      </div>

      {/* Accounts Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc) => {
          const isSyncing = syncingId === acc.id;
          const syncTime = new Date(acc.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 group relative"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xl shrink-0">
                    {acc.logo}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-100">{acc.bankName}</span>
                      {acc.isSalaryAccount && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded font-mono">
                          SALARY
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {acc.accountType} • a/c **{acc.accountNumberLast4}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSyncSingle(acc.id)}
                    title="Sync this bank account"
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => onUnlinkAccount(acc.id)}
                    title="Unlink account"
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balance & Synced info */}
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-500 font-mono">
                  Synced: {syncTime}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Available: </span>
                  <span className="font-mono font-bold text-sm text-slate-100">
                    ₹{acc.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Internal Self-Transfer Shield Note */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
        <ArrowRightLeft className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-200">Automated Multi-Bank Protection: </strong>
          Transfers between any of your linked accounts (e.g. HDFC **4821 $\rightarrow$ ICICI **9012) are automatically flagged as internal self-transfers and shielded from daily spend calculations.
        </span>
      </div>
    </div>
  );
};
