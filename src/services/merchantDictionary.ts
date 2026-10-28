export interface ParsedMerchant {
  normalizedMerchant: string;
  category: string;
  isQuickCommerce: boolean;
  isSubscription: boolean;
  isSelfTransfer: boolean;
  isCreditCardBill: boolean;
  isFixedCommitment: boolean;
  icon: string;
}

const MERCHANT_RULES: Array<{
  pattern: RegExp;
  merchant: string;
  category: string;
  isQuickCommerce?: boolean;
  isSubscription?: boolean;
  isSelfTransfer?: boolean;
  isCreditCardBill?: boolean;
  isFixedCommitment?: boolean;
  icon: string;
}> = [
  // Quick Commerce
  { pattern: /blinkit|grofers/i, merchant: 'Blinkit', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '⚡' },
  { pattern: /zepto/i, merchant: 'Zepto', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '⚡' },
  { pattern: /swiggy\s*instamart|instamart/i, merchant: 'Swiggy Instamart', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '⚡' },
  { pattern: /bigbasket|bbdaily|bb\s*now/i, merchant: 'BigBasket', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '🥦' },
  { pattern: /dunzo/i, merchant: 'Dunzo', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '⚡' },
  { pattern: /milkbasket/i, merchant: 'Milkbasket', category: 'Quick Commerce & Groceries', isQuickCommerce: true, icon: '🥛' },

  // Food & Dining / Coffee
  { pattern: /zomato/i, merchant: 'Zomato', category: 'Food & Dining', icon: '🍔' },
  { pattern: /swiggy/i, merchant: 'Swiggy Food', category: 'Food & Dining', icon: '🍜' },
  { pattern: /third\s*wave|thirdwave/i, merchant: 'Third Wave Coffee', category: 'Food & Coffee', icon: '☕' },
  { pattern: /blue\s*tokai/i, merchant: 'Blue Tokai Coffee', category: 'Food & Coffee', icon: '☕' },
  { pattern: /starbucks|tata\s*starbucks/i, merchant: 'Starbucks', category: 'Food & Coffee', icon: '☕' },
  { pattern: /chaayos|chai\s*point/i, merchant: 'Chaayos / Chai Point', category: 'Food & Coffee', icon: '🍵' },
  { pattern: /mcdonalds|hardcastle/i, merchant: "McDonald's", category: 'Food & Dining', icon: '🍟' },
  { pattern: /dominos|jubilant/i, merchant: "Domino's Pizza", category: 'Food & Dining', icon: '🍕' },
  { pattern: /subway/i, merchant: 'Subway', category: 'Food & Dining', icon: '🥪' },
  { pattern: /eatclub|box8|mojo/i, merchant: 'EatClub / Box8', category: 'Food & Dining', icon: '🍱' },

  // Commute & Rides
  { pattern: /uber/i, merchant: 'Uber', category: 'Commute & Travel', icon: '🚗' },
  { pattern: /ola|ani\s*technologies/i, merchant: 'Ola Cabs', category: 'Commute & Travel', icon: '🚕' },
  { pattern: /rapido/i, merchant: 'Rapido', category: 'Commute & Travel', icon: '🛵' },
  { pattern: /namma\s*yatri/i, merchant: 'Namma Yatri', category: 'Commute & Travel', icon: '🛺' },
  { pattern: /fastag|nhai|toll/i, merchant: 'Fastag Toll', category: 'Commute & Travel', icon: '🛣️' },
  { pattern: /irctc/i, merchant: 'IRCTC Railways', category: 'Commute & Travel', icon: '🚆' },
  { pattern: /shell|hpcl|bpcl|iocl|petrol/i, merchant: 'Fuel / Petrol Pump', category: 'Commute & Travel', icon: '⛽' },

  // Subscriptions & Entertainment
  { pattern: /netflix/i, merchant: 'Netflix India', category: 'Subscriptions & OTT', isSubscription: true, icon: '🍿' },
  { pattern: /spotify/i, merchant: 'Spotify Premium', category: 'Subscriptions & OTT', isSubscription: true, icon: '🎵' },
  { pattern: /apple\.com|itunes/i, merchant: 'Apple Services', category: 'Subscriptions & OTT', isSubscription: true, icon: '🍏' },
  { pattern: /google\s*play|google\s*one/i, merchant: 'Google One / Play', category: 'Subscriptions & OTT', isSubscription: true, icon: '🌐' },
  { pattern: /amazon\s*prime/i, merchant: 'Amazon Prime', category: 'Subscriptions & OTT', isSubscription: true, icon: '📦' },
  { pattern: /hotstar|disney\+/i, merchant: 'JioHotstar', category: 'Subscriptions & OTT', isSubscription: true, icon: '📺' },
  { pattern: /cult\.fit|cultfit|gym/i, merchant: 'Cult.fit Gym', category: 'Subscriptions & OTT', isSubscription: true, icon: '🏋️' },

  // Shopping & E-Commerce
  { pattern: /amazon|amzn/i, merchant: 'Amazon India', category: 'Shopping & Retail', icon: '📦' },
  { pattern: /flipkart/i, merchant: 'Flipkart', category: 'Shopping & Retail', icon: '🛍️' },
  { pattern: /myntra/i, merchant: 'Myntra Fashion', category: 'Shopping & Retail', icon: '👗' },
  { pattern: /nykaa/i, merchant: 'Nykaa', category: 'Shopping & Retail', icon: '💄' },
  { pattern: /ajio/i, merchant: 'Ajio', category: 'Shopping & Retail', icon: '👟' },
  { pattern: /meesho/i, merchant: 'Meesho', category: 'Shopping & Retail', icon: '🛒' },

  // Fixed Commitments / Bills / Shielded
  { pattern: /rent|nestaway|nobroker|landlord/i, merchant: 'House Rent', category: 'Fixed Shield (Rent)', isFixedCommitment: true, icon: '🏠' },
  { pattern: /credit\s*card\s*bill|cc\s*payment|cred\s*club/i, merchant: 'Credit Card Bill', category: 'Credit Card Bill', isCreditCardBill: true, isFixedCommitment: true, icon: '💳' },
  { pattern: /zerodha|groww|indmoney|kuvera|sip|amc|mutual\s*fund/i, merchant: 'SIP / Investment', category: 'Investment & SIP', isFixedCommitment: true, icon: '📈' },
  { pattern: /emi|loan|bajaj\s*finance|hdb\s*financial/i, merchant: 'Loan EMI', category: 'Loan EMI', isFixedCommitment: true, icon: '🏦' },
  { pattern: /lic|hdfc\s*life|icici\s*pru|max\s*life|insurance/i, merchant: 'Life/Health Insurance', category: 'Insurance', isFixedCommitment: true, icon: '🛡️' },

  // Self Transfers
  { pattern: /self\s*transfer|transfer\s*to\s*own|myself|linked\s*acc/i, merchant: 'Self Transfer', category: 'Self Account Transfer', isSelfTransfer: true, icon: '🔄' },

  // UPI Lite Topup
  { pattern: /upi\s*lite/i, merchant: 'UPI Lite Top-Up', category: 'Wallet & UPI Lite', icon: '🪙' },

  // Local Kirana / Auto / Chai
  { pattern: /chai|tapri|tea/i, merchant: 'Local Chai Tapri', category: 'Chai & Snacks', icon: '☕' },
  { pattern: /pan\s*shop|paan/i, merchant: 'Paan / General Store', category: 'Snacks & Smoke', icon: '🏪' },
  { pattern: /kirana|supermarket|provision/i, merchant: 'Local Kirana Shop', category: 'Quick Commerce & Groceries', icon: '🏬' },
  { pattern: /auto|rickshaw/i, merchant: 'Auto Fare', category: 'Commute & Travel', icon: '🛺' }
];

export function classifyMerchant(merchantRaw: string, vpaRaw?: string, notes?: string): ParsedMerchant {
  const combined = `${merchantRaw} ${vpaRaw || ''} ${notes || ''}`.trim();

  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(combined)) {
      return {
        normalizedMerchant: rule.merchant,
        category: rule.category,
        isQuickCommerce: !!rule.isQuickCommerce,
        isSubscription: !!rule.isSubscription,
        isSelfTransfer: !!rule.isSelfTransfer,
        isCreditCardBill: !!rule.isCreditCardBill,
        isFixedCommitment: !!rule.isFixedCommitment,
        icon: rule.icon
      };
    }
  }

  // Fallback for generic Indian UPI payment
  const cleanedName = merchantRaw.replace(/[0-9_\-\.\@]/g, ' ').trim() || 'Local Merchant';
  return {
    normalizedMerchant: cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1),
    category: 'Local Merchant & UPI',
    isQuickCommerce: false,
    isSubscription: false,
    isSelfTransfer: false,
    isCreditCardBill: false,
    isFixedCommitment: false,
    icon: '💸'
  };
}

/**
 * Parses raw Indian Bank SMS or UPI Notification text
 * Examples:
 * - "HDFC Bank: Rs 600.00 debited from a/c **4821 to VPA blinkit@icici (UPI Ref 630114892011). Bal: Rs 14,230."
 * - "Paid Rs. 250 to Third Wave Coffee via Google Pay UPI Ref: 329188471203"
 * - "Rs. 400.00 refunded by SWIGGY to your A/c **4821 via UPI ref 492019482711"
 */
export function parseRawBankSmsOrNotif(text: string): {
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'REFUND';
  merchantRaw: string;
  utr?: string;
  accountLast4?: string;
} | null {
  const isRefund = /refund|credited\s*back|reversal/i.test(text);
  const isCredit = /credited|received/i.test(text) && !isRefund;
  const isDebit = /debited|paid|spent|sent|withdrawn/i.test(text) || (!isCredit && !isRefund);

  // Extract amount: Rs. 600.00 or Rs 600 or INR 600 or ₹600
  const amountMatch = text.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Extract UTR/Ref
  const utrMatch = text.match(/(?:UPI\s*Ref(?:\s*No)?|Ref\s*No|UTR|Txn\s*ID)[:\s]+([0-9A-Za-z]+)/i);
  const utr = utrMatch ? utrMatch[1] : undefined;

  // Extract Account Last 4
  const accMatch = text.match(/(?:a\/c|acct|card|ending)\s*(?:no\.?)?\s*[\*Xx]*([0-9]{4})/i);
  const accountLast4 = accMatch ? accMatch[1] : undefined;

  // Extract Merchant Name
  let merchantRaw = 'Merchant';
  const vpaMatch = text.match(/(?:to\s*VPA|to|at)\s+([A-Za-z0-9\.\_\@\s\-]+?)(?:\s+on|\s+via|\s+\(UPI|\s+Ref|\.|\,|$)/i);
  if (vpaMatch && vpaMatch[1].trim()) {
    merchantRaw = vpaMatch[1].trim().replace(/\s+(via|using|on).*/i, '');
  }

  return {
    amount,
    type: isRefund ? 'REFUND' : (isCredit ? 'CREDIT' : 'DEBIT'),
    merchantRaw: merchantRaw.length > 30 ? merchantRaw.substring(0, 30) : merchantRaw,
    utr,
    accountLast4
  };
}
