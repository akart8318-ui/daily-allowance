import React, { useState } from 'react';
import { Mic, Banknote, Check, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddCash: (amount: number, merchant: string, category: string) => void;
}

export const FastCashModal: React.FC<Props> = ({ isOpen, onClose, onAddCash }) => {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('Local Chai / Cash');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const quickPills = [
    { label: 'Chai ₹20', amount: 20, merchant: 'Chai Tapri' },
    { label: 'Auto ₹50', amount: 50, merchant: 'Auto Fare' },
    { label: 'Cig/Pan ₹20', amount: 20, merchant: 'Paan Shop' },
    { label: 'Veggies ₹150', amount: 150, merchant: 'Sabzi Mandi' },
    { label: 'Cash ₹500', amount: 500, merchant: 'Cash Withdrawal' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onAddCash(val, merchant, 'Cash & Chai Tapri');
    onClose();
  };

  const handleVoiceListen = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the quick cash buttons.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript;
        // Parse "Spent 40 rupees cash on chai"
        const match = transcript.match(/([0-9]+)/);
        if (match) {
          setAmount(match[1]);
        }
        if (/chai|tea/i.test(transcript)) setMerchant('Chai Tapri');
        else if (/auto|cab|rickshaw/i.test(transcript)) setMerchant('Auto Fare');
        else setMerchant(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0F1626] border border-slate-800 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">3-Second Cash & Voice Entry</h3>
              <p className="text-[11px] text-slate-400">Log cash spends before you forget</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick presets */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Quick 1-Tap Cash Presets:</div>
            <div className="flex flex-wrap gap-1.5">
              {quickPills.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setAmount(p.amount.toString());
                    setMerchant(p.merchant);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700/60"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount (₹):
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="40"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-xl font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleVoiceListen}
                title="Speak: e.g. Spent 40 rupees on chai"
                className={`absolute right-2 top-2 p-2 rounded-xl transition ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-400 hover:text-indigo-400'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Spent On:
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Local Chai Tapri"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            Deduct from Today's Allowance
          </button>
        </form>
      </div>
    </div>
  );
};
