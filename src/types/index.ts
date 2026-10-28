export type RolloverMode = 'DYNAMIC' | 'STRICT' | 'WEEKEND_BOOST';
export type CalculationMode = 'SAFE_TO_SPEND' | 'GROSS';
export type PopUpState = 'SAFE' | 'CAUTION' | 'BREACHED';
export type NotificationPersona = 'GENTLE' | 'ROAST';
export type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND';
export type TransactionSource = 'UPI_NOTIF' | 'BANK_SMS' | 'AA_SYNC' | 'MANUAL';
export type AccountType = 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'SALARY';

export interface BankAccount {
  id: string;
  bankCode: string; // e.g. HDFC, ICICI, SBI, AXIS, KOTAK
  bankName: string;
  accountType: AccountType;
  accountNumberLast4: string;
  balance: number;
  isSalaryAccount?: boolean;
  lastSyncedAt: number;
  syncStatus: 'CONNECTED' | 'SYNCING' | 'ERROR';
  aaConsentId?: string;
  logo: string;
  accentColor: string;
}

export interface FixedCommitment {
  id: string;
  name: string;
  category: 'Rent' | 'EMI' | 'Mutual Fund SIP' | 'Insurance' | 'Credit Card Bill' | 'Utilities';
  amount: number;
  dueDate: number; // day of month 1-31
  isAutoDetected?: boolean;
  linkedBankId?: string;
}

export interface BudgetConfig {
  monthlyIncome: number;
  calculationMode: CalculationMode;
  fixedCommitments: FixedCommitment[];
  savingsTarget: number;
  salaryCreditDate: number; // e.g., 1, 7, 28
  rolloverMode: RolloverMode;
  persona: NotificationPersona;
  soundEnabled: boolean;
  voiceRoastEnabled: boolean;
  floatingOverlayEnabled: boolean;
}

export interface Transaction {
  id: string;
  timestamp: number; // epoch ms
  amount: number;
  type: TransactionType;
  source: TransactionSource;
  merchantName: string;
  upiVpa?: string;
  category: string;
  utrReference?: string;
  accountLast4?: string;
  bankName?: string;
  availableBalanceAfterTx?: number;
  isExcludedFromDaily: boolean;
  splitRatio: number;
  effectiveDailyDeduction: number;
  rawMessage?: string;
  notes?: string;
  isQuickCommerce?: boolean;
  isSubscription?: boolean;
  isSelfTransfer?: boolean;
  isCreditCardBill?: boolean;
}

export interface DailyLedger {
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 30
  startingAllowance: number;
  totalSpent: number;
  remainingAllowance: number;
  status: PopUpState;
  transactions: Transaction[];
  wishlistSweptAmount: number;
  deficitCarriedForward: number;
  isWeekend: boolean;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  state: PopUpState;
  spentAmount: number;
  remainingAllowance: number;
  dailyLimit: number;
  percentUsed: number;
  merchantName: string;
  category: string;
  timestamp: number;
  roastMessage?: string;
  transactionId: string;
  bankName?: string;
  accountLast4?: string;
  availableBalance?: number;
}

export interface QuickCommerceStat {
  merchantName: string;
  count: number;
  totalSpent: number;
  avgOrderValue: number;
  icon: string;
}
