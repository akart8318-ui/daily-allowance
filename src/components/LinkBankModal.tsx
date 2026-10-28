import React, { useState } from 'react';
import { BankAccount } from '../types';
import { SUPPORTED_INDIAN_BANKS, SupportedBank } from '../services/bankRegistry';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  Search,
  Smartphone,
  KeyRound,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBankLinked: (newAccounts: BankAccount[]) => void;
  existingAccounts: BankAccount[];
}

export const LinkBankModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onBankLinked,
  existingAccounts
}) => {
  const [step, setStep] = useState<'SELECT_BANK' | 'MOBILE_OTP' | 'SELECT_ACCOUNTS' | 'CONSENT'>('SELECT_BANK');
  const [selectedBank, setSelectedBank] = useState<SupportedBank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otp, setOtp] = useState('638192');
  const [isVerifying, setIsVerifying] = useState(false);

  // Discovered accounts for selected bank
  const [discoveredAccounts, setDiscoveredAccounts] = useState<Array<{
    type: 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD';
    last4: string;
    balance: number;
    selected: boolean;
  }>>([]);

  if (!isOpen) return null;

  const filteredBanks = SUPPORTED_INDIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bank: SupportedBank) => {
    setSelectedBank(bank);
    setStep('MOBILE_OTP');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      // Generate simulated discovered accounts based on bank
      const randomLast4_1 = Math.floor(1000 + Math.random() * 9000).toString();
      const randomLast4_2 = Math.floor(1000 + Math.random() * 9000).toString();
      const randomBal_1 = Math.round(15000 + Math.random() * 65000);
      const randomBal_2 = Math.round(5000 + Math.random() * 25000);

      setDiscoveredAccounts([
        { type: 'SAVINGS', last4: randomLast4_1, balance: randomBal_1, selected: true },
        { type: 'CREDIT_CARD', last4: randomLast4_2, balance: randomBal_2, selected: false }
      ]);
      setStep('SELECT_ACCOUNTS');
    }, 900);
  };

  const handleToggleAccount = (index: number) => {
    setDiscoveredAccounts(prev =>
      prev.map((acc, i) => (i === index ? { ...acc, selected: !acc.selected } : acc))
    );
  };

  const handleGrantConsent = () => {
    if (!selectedBank) return;

    const selectedToLink = discoveredAccounts.filter(a => a.selected);
    if (selectedToLink.length === 0) {
      alert('Please select at least one account to link.');
      return;
    }

    const newBankAccounts: BankAccount[] = selectedToLink.map((acc, idx) => ({
      id: `bank-${selectedBank.code.toLowerCase()}-${acc.last4}`,
      bankCode: selectedBank.code,
      bankName: selectedBank.name,
      accountType: acc.type,
      accountNumberLast4: acc.last4,
      balance: acc.balance,
      isSalaryAccount: acc.type === 'SAVINGS' && idx === 0,
      lastSyncedAt: Date.now(),
      syncStatus: 'CONNECTED',
      aaConsentId: `AA-SETU-${selectedBank.code}-${Math.floor(100000 + Math.random() * 900000)}`,
      logo: selectedBank.icon,
      accentColor: selectedBank.accentColor
    }));

    onBankLinked(newBankAccounts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg bg-[#0D1322] border border-slate-800 rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">Link Bank Account</h3>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                  RBI Regulated AA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Read-only balance and statement synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Step Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: SELECT BANK */}
          {step === 'SELECT_BANK' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search HDFC, ICICI, SBI, Axis, Kotak..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Select Your Bank (13+ Supported)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredBanks.map((bank) => {
                  const isAlreadyLinked = existingAccounts.some(a => a.bankCode === bank.code);

                  return (
                    <button
                      key={bank.code}
                      onClick={() => handleBankSelect(bank)}
                      className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col items-center text-center gap-1.5 group relative"
                    >
                      {isAlreadyLinked && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">
                          Linked
                        </span>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition">
                        {bank.icon}
                      </div>
                      <div className="font-semibold text-xs text-slate-200 truncate w-full">
                        {bank.name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Instant AA Sync
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: MOBILE & OTP VERIFICATION */}
          {step === 'MOBILE_OTP' && selectedBank && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-3">
                <span className="text-2xl">{selectedBank.icon}</span>
                <div>
                  <div className="font-bold text-xs text-slate-100">{selectedBank.name}</div>
                  <div className="text-[11px] text-indigo-300">RBI Account Aggregator Connection</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank-Registered Mobile Number:
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Consent Verification OTP:
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono font-bold text-emerald-400 tracking-widest text-center focus:outline-none focus:border-indigo-500"
                />
                <div className="text-[10px] text-slate-500 mt-1 text-center font-mono">
                  Test OTP pre-filled: 638192
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Secure & Encrypted:</strong> We never see or store your netbanking password or MPIN. The Account Aggregator TSP (Setu/Finvu) only fetches encrypted statement balances under RBI guidelines.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_BANK')}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-xs font-medium text-slate-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Discovering Accounts...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP & Discover Accounts</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: DISCOVERED ACCOUNTS & CONSENT */}
          {step === 'SELECT_ACCOUNTS' && selectedBank && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300">
                Found {discoveredAccounts.length} Accounts at {selectedBank.name}:
              </div>

              <div className="space-y-2">
                {discoveredAccounts.map((acc, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleAccount(index)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      acc.selected
                        ? 'bg-indigo-950/40 border-indigo-500/60 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        acc.selected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                      }`}>
                        {acc.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                          <span>{selectedBank.name} {acc.type === 'SAVINGS' ? 'Savings Account' : 'Credit Card'}</span>
                          <span className="font-mono text-slate-400 text-[11px]">(**{acc.last4})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Synced Live Balance: ₹{acc.balance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ₹{acc.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* RBI Consent Agreement Banner */}
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>RBI Account Aggregator Consent Mandate</span>
                </div>
                <div className="text-[10px] text-slate-300 space-y-0.5 leading-relaxed">
                  <div>• <strong>Purpose:</strong> Daily allowance calculation & spend tracking</div>
                  <div>• <strong>Access:</strong> Read-only transaction amounts & balances</div>
                  <div>• <strong>Frequency:</strong> Real-time on SMS/UPI trigger + Daily 8 AM Sync</div>
                  <div>• <strong>Consent Period:</strong> Valid for 12 months (Revoke anytime in Settings)</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('MOBILE_OTP')}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 text-xs font-medium text-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleGrantConsent}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Link Accounts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
