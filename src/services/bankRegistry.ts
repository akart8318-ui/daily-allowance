import { BankAccount } from '../types';

export interface SupportedBank {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  accentColor: string;
  smsHeaders: string[]; // Official TRAI sender prefixes
  popular: boolean;
}

export const SUPPORTED_INDIAN_BANKS: SupportedBank[] = [
  {
    code: 'HDFC',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    icon: '🏦',
    accentColor: '#004B8D',
    smsHeaders: ['HDFCBK', 'HDFC', 'VM-HDFCBK', 'AD-HDFCBK', 'VK-HDFCBK'],
    popular: true
  },
  {
    code: 'ICICI',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    icon: '🏢',
    accentColor: '#F37021',
    smsHeaders: ['ICICIB', 'ICICI', 'VM-ICICIB', 'AX-ICICIB', 'BZ-ICICIB'],
    popular: true
  },
  {
    code: 'SBI',
    name: 'State Bank of India',
    shortName: 'SBI',
    icon: '🏛️',
    accentColor: '#280071',
    smsHeaders: ['SBIINB', 'SBISMS', 'BZ-SBIINB', 'VM-SBIINB', 'VK-SBIINB'],
    popular: true
  },
  {
    code: 'AXIS',
    name: 'Axis Bank',
    shortName: 'Axis',
    icon: '💳',
    accentColor: '#97144D',
    smsHeaders: ['AXISBK', 'AXIS', 'VK-AXISBK', 'VM-AXISBK', 'AD-AXISBK'],
    popular: true
  },
  {
    code: 'KOTAK',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    icon: '🔴',
    accentColor: '#ED1C24',
    smsHeaders: ['KOTAKB', 'KOTAK', 'AD-KOTAKB', 'VM-KOTAKB'],
    popular: true
  },
  {
    code: 'IDFC',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC First',
    icon: '🔷',
    accentColor: '#9D1D27',
    smsHeaders: ['IDFCFB', 'IDFC', 'BP-IDFCFB', 'VM-IDFCFB'],
    popular: true
  },
  {
    code: 'INDUSIND',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    icon: '🦁',
    accentColor: '#800000',
    smsHeaders: ['INDUSB', 'INDUS', 'VM-INDUSB', 'VK-INDUSB'],
    popular: false
  },
  {
    code: 'PNB',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    icon: '🌾',
    accentColor: '#A21D3C',
    smsHeaders: ['PNBSMS', 'PNB', 'AD-PNBSMS', 'VM-PNBSMS'],
    popular: false
  },
  {
    code: 'BOB',
    name: 'Bank of Baroda',
    shortName: 'Baroda',
    icon: '☀️',
    accentColor: '#F26522',
    smsHeaders: ['BOBSMS', 'BOB', 'MD-BOBSMS', 'VM-BOBSMS'],
    popular: false
  },
  {
    code: 'YES',
    name: 'Yes Bank',
    shortName: 'Yes Bank',
    icon: '🔵',
    accentColor: '#005A9C',
    smsHeaders: ['YESBNK', 'YESBK', 'CP-YESBNK', 'VM-YESBNK'],
    popular: false
  },
  {
    code: 'CANARA',
    name: 'Canara Bank',
    shortName: 'Canara',
    icon: '🔺',
    accentColor: '#0090D0',
    smsHeaders: ['CANBNK', 'CANARA', 'VM-CANBNK'],
    popular: false
  },
  {
    code: 'FEDERAL',
    name: 'Federal Bank',
    shortName: 'Federal',
    icon: '🛡️',
    accentColor: '#003366',
    smsHeaders: ['FEDRLB', 'FEDERAL', 'VM-FEDRLB'],
    popular: false
  },
  {
    code: 'UNION',
    name: 'Union Bank of India',
    shortName: 'Union Bank',
    icon: '🤝',
    accentColor: '#C41230',
    smsHeaders: ['UNIONB', 'UBI', 'VM-UNIONB'],
    popular: false
  }
];

export const INITIAL_LINKED_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-hdfc-4821',
    bankCode: 'HDFC',
    bankName: 'HDFC Bank',
    accountType: 'SALARY',
    accountNumberLast4: '4821',
    balance: 34200,
    isSalaryAccount: true,
    lastSyncedAt: Date.now() - 15 * 60 * 1000, // 15 mins ago
    syncStatus: 'CONNECTED',
    aaConsentId: 'AA-FINVU-HDFC-99182',
    logo: '🏦',
    accentColor: '#004B8D'
  },
  {
    id: 'bank-icici-9012',
    bankCode: 'ICICI',
    bankName: 'ICICI Bank',
    accountType: 'SAVINGS',
    accountNumberLast4: '9012',
    balance: 18450,
    isSalaryAccount: false,
    lastSyncedAt: Date.now() - 45 * 60 * 1000,
    syncStatus: 'CONNECTED',
    aaConsentId: 'AA-FINVU-ICICI-48190',
    logo: '🏢',
    accentColor: '#F37021'
  }
];

/**
 * Checks if a transaction is an internal transfer between the user's own linked bank accounts
 */
export function isInternalSelfTransfer(
  rawText: string,
  linkedAccounts: BankAccount[],
  detectedAccLast4?: string
): boolean {
  if (linkedAccounts.length < 2) return false;

  // Check if text mentions another linked account number
  const otherAccounts = linkedAccounts.filter(a => a.accountNumberLast4 !== detectedAccLast4);
  for (const acc of otherAccounts) {
    if (rawText.includes(acc.accountNumberLast4)) {
      return true;
    }
  }

  // Keywords indicating self transfer
  return /transfer\s*to\s*own|self\s*transfer|linked\s*acc|within\s*own\s*accounts/i.test(rawText);
}

/**
 * Updates a linked bank account's live balance from an ingested bank SMS or notification
 */
export function updateAccountBalanceFromEvent(
  accounts: BankAccount[],
  accLast4: string | undefined,
  bankName: string | undefined,
  newBalance: number | undefined,
  txAmount: number,
  txType: 'DEBIT' | 'CREDIT' | 'REFUND'
): { updatedAccounts: BankAccount[]; updatedAccount?: BankAccount } {
  if (!accLast4 && !bankName) {
    return { updatedAccounts: accounts };
  }

  let foundMatch = false;
  let targetAccount: BankAccount | undefined;

  const updatedAccounts = accounts.map(acc => {
    // Match by last 4 digits (primary) or by bank name (secondary)
    const isLast4Match = accLast4 && acc.accountNumberLast4 === accLast4;
    const isBankMatch = bankName && (
      acc.bankName.toLowerCase().includes(bankName.toLowerCase()) ||
      acc.bankCode.toLowerCase() === bankName.toLowerCase()
    );

    if (isLast4Match || (!accLast4 && isBankMatch)) {
      foundMatch = true;
      let calculatedBalance = acc.balance;

      if (newBalance !== undefined && newBalance > 0) {
        calculatedBalance = newBalance;
      } else {
        if (txType === 'DEBIT') {
          calculatedBalance = Math.max(0, acc.balance - txAmount);
        } else {
          calculatedBalance = acc.balance + txAmount;
        }
      }

      const updated = {
        ...acc,
        balance: calculatedBalance,
        lastSyncedAt: Date.now(),
        syncStatus: 'CONNECTED' as const
      };
      targetAccount = updated;
      return updated;
    }
    return acc;
  });

  return { updatedAccounts, updatedAccount: targetAccount };
}
