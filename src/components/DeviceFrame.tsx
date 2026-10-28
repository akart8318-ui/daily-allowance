import React from 'react';
import { Smartphone, Monitor, Wifi, Battery, Sparkles } from 'lucide-react';

interface Props {
  viewMode: 'RESPONSIVE' | 'MOBILE_PHONE';
  onToggleViewMode: (mode: 'RESPONSIVE' | 'MOBILE_PHONE') => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<Props> = ({ viewMode, onToggleViewMode, children }) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (viewMode === 'RESPONSIVE') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
        {/* Floating View Switcher at top right */}
        <div className="fixed bottom-4 right-4 z-40 hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => onToggleViewMode('RESPONSIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'RESPONSIVE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Full Dashboard</span>
          </button>
          <button
            onClick={() => onToggleViewMode('MOBILE_PHONE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'MOBILE_PHONE'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Phone Frame View</span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Realistic iPhone 16 Pro Titanium Chassis Frame Mode
  return (
    <div className="min-h-screen bg-[#04060B] text-slate-100 flex flex-col items-center justify-center p-2 sm:p-6 font-sans">
      {/* Top Controller Bar */}
      <div className="mb-4 flex items-center justify-between w-full max-w-sm px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">Live Device Simulation</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => onToggleViewMode('MOBILE_PHONE')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => onToggleViewMode('RESPONSIVE')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* Phone Hardware Chassis */}
      <div className="relative w-full max-w-[420px] h-[870px] max-h-[92vh] bg-slate-950 rounded-[48px] p-3 shadow-[0_0_60px_-15px_rgba(99,102,241,0.25)] border-[8px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        {/* Dynamic Island Pill */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-between px-2.5 border border-slate-800/80 shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-[#111827] ring-1 ring-slate-700/40" />
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-emerald-400">UPI</span>
          </div>
        </div>

        {/* Phone Status Bar */}
        <div className="w-full pt-1.5 pb-1 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-40 bg-[#070B14]">
          <span className="font-semibold text-slate-200">{currentTime}</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-bold">5G</span>
            <Battery className="w-4 h-4 text-emerald-400 fill-current" />
          </div>
        </div>

        {/* Screen Viewport with smooth scroll */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden rounded-[36px] bg-[#070B14] relative">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full pt-2 pb-1 flex justify-center bg-[#070B14] z-40">
          <div className="w-32 h-1 bg-slate-600/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
