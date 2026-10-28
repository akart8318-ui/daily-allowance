import React from 'react';
import { BudgetConfig, DailyLedger } from '../types';
import { generateCadenceNotifications } from '../services/notificationCadence';
import { soundSynth, speakRoast, getPersonalityRoast } from '../services/audioHaptics';
import { Volume2, Mic, Flame, Heart, Bell, X, Sparkles, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onUpdateConfig: (newConfig: BudgetConfig) => void;
  todayLedger: DailyLedger;
}

export const RoastCoachSettings: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  todayLedger
}) => {
  if (!isOpen) return null;

  const cadenceNotifs = generateCadenceNotifications(todayLedger, config, 5, 4200);

  const testAudioTone = (type: 'SAFE' | 'CAUTION' | 'BREACH' | 'COIN') => {
    if (type === 'SAFE') soundSynth.playSafeChime();
    if (type === 'CAUTION') soundSynth.playWarningChime();
    if (type === 'BREACH') soundSynth.playBreachAlert();
    if (type === 'COIN') soundSynth.playCashSweep();
  };

  const testVoiceSpeech = () => {
    const text = getPersonalityRoast(config.persona, 'BREACHED', 'Blinkit', 600, -867, 126);
    speakRoast(text, true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0F1626] border border-slate-800 rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Personality & Notification Cadence</h3>
              <p className="text-xs text-slate-400">Gentle Coach vs Savage Roast Mode and daily schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Personality Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Notification Personality Mode:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, persona: 'ROAST' })}
                className={`p-4 rounded-2xl border text-left transition ${
                  config.persona === 'ROAST'
                    ? 'bg-rose-950/40 border-rose-500/60 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300">
                    <Flame className="w-4 h-4 text-rose-400 fill-current" />
                    <span>Savage Roast Mode</span>
                  </div>
                  {config.persona === 'ROAST' && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] text-slate-300 mt-2 italic leading-relaxed">
                  "Another Zepto order after Blinkit? Bro, you're working to fund your own bad decisions."
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, persona: 'GENTLE' })}
                className={`p-4 rounded-2xl border text-left transition ${
                  config.persona === 'GENTLE'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                    <Heart className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>Gentle Coach</span>
                  </div>
                  {config.persona === 'GENTLE' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-300 mt-2 italic leading-relaxed">
                  "Great pacing today! You have ₹2,000 left for the evening. Keep up the green streak!"
                </p>
              </button>
            </div>
          </div>

          {/* Sound & Audio Synth Testing */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Instant Audio Feedback & Haptics</span>
              <button
                type="button"
                onClick={testVoiceSpeech}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Test TTS Voice</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => testAudioTone('SAFE')}
                className="py-2 px-1 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono"
              >
                Safe Chime
              </button>
              <button
                onClick={() => testAudioTone('CAUTION')}
                className="py-2 px-1 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[10px] text-amber-300 font-mono"
              >
                Caution Pulse
              </button>
              <button
                onClick={() => testAudioTone('BREACH')}
                className="py-2 px-1 rounded-xl bg-red-950/40 border border-red-500/40 text-[10px] text-red-300 font-mono"
              >
                Breach Siren
              </button>
              <button
                onClick={() => testAudioTone('COIN')}
                className="py-2 px-1 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-[10px] text-indigo-300 font-mono"
              >
                Coin Sweep
              </button>
            </div>
          </div>

          {/* Scheduled Daily Cadence Preview */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-300">
              Scheduled Daily Cadence Notifications (From the Reel):
            </div>

            {cadenceNotifs.map((n, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-400">{n.timeLabel}</span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${n.accentColor}20`, color: n.accentColor }}
                  >
                    {n.badge}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-200">{n.title}</div>
                <p className="text-[11px] text-slate-400">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
