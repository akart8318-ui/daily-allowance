import { BudgetConfig, DailyLedger, BankAccount } from '../types';
import { generateInitialMonthData } from './allowanceEngine';
import { INITIAL_LINKED_ACCOUNTS } from './bankRegistry';

const STORAGE_KEYS = {
  CONFIG: 'daily_allowance_config_v2',
  LEDGERS: 'daily_allowance_ledgers_v2',
  DAY_INDEX: 'daily_allowance_today_idx_v2',
  WISHLIST_POT: 'daily_allowance_wishlist_pot_v2',
  DEVICE_VIEW_MODE: 'daily_allowance_view_mode_v2',
  LINKED_BANKS: 'daily_allowance_linked_banks_v2'
};

export const DEFAULT_CONFIG: BudgetConfig = {
  monthlyIncome: 100000,
  calculationMode: 'SAFE_TO_SPEND',
  fixedCommitments: [
    { id: 'fix-1', name: 'House Rent', category: 'Rent', amount: 20000, dueDate: 5 },
    { id: 'fix-2', name: 'Car Loan EMI', category: 'EMI', amount: 10000, dueDate: 10 },
    { id: 'fix-3', name: 'Nifty Index SIP', category: 'Mutual Fund SIP', amount: 15000, dueDate: 1 },
    { id: 'fix-4', name: 'Broadband & Utilities', category: 'Utilities', amount: 3000, dueDate: 15 }
  ],
  savingsTarget: 10000,
  salaryCreditDate: 1,
  rolloverMode: 'DYNAMIC',
  persona: 'ROAST',
  soundEnabled: true,
  voiceRoastEnabled: true,
  floatingOverlayEnabled: true
};

export function loadStoredConfig(): BudgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load stored config', e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: BudgetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function loadStoredLedgers(config: BudgetConfig): { ledgers: DailyLedger[]; todayIndex: number; wishlistPot: number } {
  try {
    const rawLedgers = localStorage.getItem(STORAGE_KEYS.LEDGERS);
    const rawIndex = localStorage.getItem(STORAGE_KEYS.DAY_INDEX);
    const rawPot = localStorage.getItem(STORAGE_KEYS.WISHLIST_POT);

    if (rawLedgers) {
      const parsedLedgers = JSON.parse(rawLedgers);
      const todayIndex = rawIndex !== null ? parseInt(rawIndex, 10) : 14;
      const wishlistPot = rawPot !== null ? parseFloat(rawPot) : 4200;
      if (Array.isArray(parsedLedgers) && parsedLedgers.length === 30) {
        return { ledgers: parsedLedgers, todayIndex, wishlistPot };
      }
    }
  } catch (e) {
    console.error('Failed to load stored ledgers', e);
  }

  const initial = generateInitialMonthData(config);
  return {
    ledgers: initial,
    todayIndex: 14,
    wishlistPot: 4200
  };
}

export function saveStoredLedgers(ledgers: DailyLedger[], todayIndex: number, wishlistPot: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEDGERS, JSON.stringify(ledgers));
    localStorage.setItem(STORAGE_KEYS.DAY_INDEX, todayIndex.toString());
    localStorage.setItem(STORAGE_KEYS.WISHLIST_POT, wishlistPot.toString());
  } catch (e) {
    console.error('Failed to save ledgers', e);
  }
}

export function loadStoredBankAccounts(): BankAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKED_BANKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load linked banks', e);
  }
  return INITIAL_LINKED_ACCOUNTS;
}

export function saveStoredBankAccounts(accounts: BankAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LINKED_BANKS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save linked banks', e);
  }
}

export function resetAllData(config: BudgetConfig = DEFAULT_CONFIG): {
  ledgers: DailyLedger[];
  todayIndex: number;
  wishlistPot: number;
  bankAccounts: BankAccount[];
} {
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  localStorage.removeItem(STORAGE_KEYS.LEDGERS);
  localStorage.removeItem(STORAGE_KEYS.DAY_INDEX);
  localStorage.removeItem(STORAGE_KEYS.WISHLIST_POT);
  localStorage.removeItem(STORAGE_KEYS.LINKED_BANKS);

  const initial = generateInitialMonthData(config);
  saveStoredConfig(config);
  saveStoredLedgers(initial, 14, 4200);
  saveStoredBankAccounts(INITIAL_LINKED_ACCOUNTS);

  return {
    ledgers: initial,
    todayIndex: 14,
    wishlistPot: 4200,
    bankAccounts: INITIAL_LINKED_ACCOUNTS
  };
}

export function loadViewMode(): 'RESPONSIVE' | 'MOBILE_PHONE' {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.DEVICE_VIEW_MODE);
    if (mode === 'MOBILE_PHONE' || mode === 'RESPONSIVE') return mode;
  } catch {}
  return 'RESPONSIVE';
}

export function saveViewMode(mode: 'RESPONSIVE' | 'MOBILE_PHONE'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEVICE_VIEW_MODE, mode);
  } catch {}
}
