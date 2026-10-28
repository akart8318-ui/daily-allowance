import React from 'react';
import { Transaction } from '../types';
import { Zap, AlertTriangle, TrendingUp, ShoppingBag, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const QuickCommerceRadar: React.FC<Props> = ({ transactions }) => {
  // Aggregate quick-commerce impulse apps
  const qCommerceOrders = transactions.filter(
    (tx) => tx.isQuickCommerce || /blinkit|zepto|instamart|bigbasket|dunzo/i.test(tx.merchantName)
  );

  const totalSpent = qCommerceOrders.reduce((sum, tx) => sum + (tx.effectiveDailyDeduction || tx.amount), 0);
  const count = qCommerceOrders.length;
  const avgOrderValue = count > 0 ? Math.round(totalSpent / count) : 0;

  // Breakdown by brand
  const brands = [
    { name: 'Blinkit', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { name: 'Zepto', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
    { name: 'Instamart', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    { name: 'BigBasket', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  ].map((b) => {
    const brandTxs = qCommerceOrders.filter((t) =>
      t.merchantName.toLowerCase().includes(b.name.toLowerCase().split(' ')[0])
    );
    const brandTotal = brandTxs.reduce((sum, t) => sum + t.amount, 0);
    return {
      ...b,
      count: brandTxs.length,
      total: brandTotal
    };
  });

  // Late-night leak detection (Spends between 11 PM and 3 AM)
  const lateNightOrders = transactions.filter((tx) => {
    const hour = new Date(tx.timestamp).getHours();
    return hour >= 23 || hour <= 3;
  });

  const lateNightTotal = lateNightOrders.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="rounded-3xl bg-[#0F1626]/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Quick-Commerce & Leak Radar</h3>
            <p className="text-xs text-slate-400">Impulse micro-spend tracking (Blinkit, Zepto, Instamart)</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
          ₹{totalSpent.toLocaleString('en-IN')} Leak
        </span>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Orders</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-100 mt-0.5">{count} orders</div>
          <div className="text-[10px] text-slate-500 mt-0.5">10-min deliveries</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Avg Basket</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-100 mt-0.5">₹{avgOrderValue}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">₹30-50 surcharges</div>
        </div>

        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-mono">30d Projection</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-0.5">
            ₹{Math.round(totalSpent * 2.2).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Estimated leak</div>
        </div>
      </div>

      {/* Brand Breakdown */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-slate-300">Quick-Commerce Distribution</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {brands.map((b) => (
            <div key={b.name} className={`p-2 rounded-xl border ${b.color} flex flex-col justify-between`}>
              <span className="font-semibold text-xs truncate">{b.name}</span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[10px] opacity-80">{b.count} orders</span>
                <span className="font-bold text-xs">₹{b.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Late-Night Munchies Leak Warning */}
      {lateNightOrders.length > 0 && (
        <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-red-300">Late-Night Leak Alert (11 PM – 3 AM): </span>
            <span className="text-slate-300">
              {lateNightOrders.length} late-night impulse orders detected totaling ₹{lateNightTotal.toLocaleString('en-IN')}. Ordering when tired increases impulse basket size by 42%!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
