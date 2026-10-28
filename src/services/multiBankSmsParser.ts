import { SUPPORTED_INDIAN_BANKS } from './bankRegistry';

export interface ParsedBankMessage {
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'REFUND';
  merchantRaw: string;
  bankName: string;
  bankCode?: string;
  accountLast4?: string;
  availableBalance?: number;
  utr?: string;
  rawMessage: string;
}

/**
 * Parses raw SMS / App Notification text from any Indian Bank
 */
export function parseAnyBankMessage(text: string, senderHeader?: string): ParsedBankMessage | null {
  const clean = text.trim();
  if (!clean) return null;

  // 1. Detect Transaction Type
  const isRefund = /refund|credited\s*back|reversal|chargeback/i.test(clean);
  const isCredit = /credited|received|deposited/i.test(clean) && !isRefund;
  const type: 'DEBIT' | 'CREDIT' | 'REFUND' = isRefund ? 'REFUND' : isCredit ? 'CREDIT' : 'DEBIT';

  // 2. Extract Amount
  // Matches "Rs. 600.00", "Rs 600", "INR 600.50", "₹600", "debited by 600"
  const amountMatch = clean.match(/(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                      clean.match(/(?:debited\s*(?:with|by)?|spent)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // 3. Extract Bank Identity
  let bankName = 'Bank Account';
  let bankCode: string | undefined;

  const headerUpper = (senderHeader || '').toUpperCase();
  for (const b of SUPPORTED_INDIAN_BANKS) {
    const isHeaderMatch = b.smsHeaders.some(h => headerUpper.includes(h.toUpperCase()));
    const isBodyMatch = clean.toLowerCase().includes(b.name.toLowerCase()) ||
                        clean.toLowerCase().includes(b.code.toLowerCase() + ' bank');

    if (isHeaderMatch || isBodyMatch) {
      bankName = b.name;
      bankCode = b.code;
      break;
    }
  }

  // 4. Extract Account Last 4 Digits
  // Examples: "a/c **4821", "Acct XX9012", "A/c ending 1928", "A/C ...8821", "card ending 3301"
  let accountLast4: string | undefined;
  const accMatch = clean.match(/(?:a\/c|acct|account|card|ending)\s*(?:no\.?)?\s*[\*Xx\.]*\s*([0-9]{4})\b/i) ||
                   clean.match(/(?:ending\s*in\s*|ending\s*)([0-9]{4})\b/i);
  if (accMatch) {
    accountLast4 = accMatch[1];
  }

  // 5. Extract Available Balance
  // Examples:
  // - "Bal: Rs 34,200.00"
  // - "Available Bal: INR 18,450.25"
  // - "Avail Bal: Rs 8,320.50"
  // - "Total Bal: Rs. 9,450.00"
  // - "Available Balance is INR 22,800.00"
  let availableBalance: number | undefined;
  const balMatch = clean.match(/(?:avail(?:able)?\s*bal(?:ance)?|total\s*bal(?:ance)?|bal|clear\s*bal)(?:\s*(?:is|:|\-))?\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (balMatch) {
    const rawBal = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(rawBal) && rawBal >= 0) {
      availableBalance = rawBal;
    }
  }

  // 6. Extract UTR / UPI Ref ID
  let utr: string | undefined;
  const utrMatch = clean.match(/(?:UPI\s*Ref(?:\s*No)?|Ref\s*No|UTR|Txn\s*ID|Info:\s*UPI\/)[:\s/]*([0-9A-Za-z]+)/i);
  if (utrMatch) {
    utr = utrMatch[1];
  }

  // 7. Extract Merchant / Payee
  let merchantRaw = 'Merchant';

  // Specific Indian patterns:
  // "to VPA blinkit@icici"
  // "to Third Wave Coffee"
  // "transfer to UPI/CR/491028491028/Chai"
  // "towards UPI/492019481902/Uber"
  // "via UPI to Zomato"
  // "Info: UPI/392018491029/Swiggy"
  const vpaMatch = clean.match(/(?:to\s*VPA|to|at|towards)\s+([A-Za-z0-9\.\_\@\s\-]+?)(?:\s+on|\s+via|\s+\(UPI|\s+Ref|\.|\,|$)/i);
  const infoMatch = clean.match(/(?:Info|towards)[:\s]*UPI\/[0-9A-Za-z]+\/([A-Za-z0-9\s\-]+)/i);

  if (infoMatch && infoMatch[1].trim()) {
    merchantRaw = infoMatch[1].trim();
  } else if (vpaMatch && vpaMatch[1].trim()) {
    merchantRaw = vpaMatch[1].trim().replace(/\s+(via|using|on).*/i, '');
  }

  if (merchantRaw.length > 28) {
    merchantRaw = merchantRaw.substring(0, 28);
  }

  return {
    amount,
    type,
    merchantRaw: merchantRaw.trim() || 'Merchant',
    bankName,
    bankCode,
    accountLast4,
    availableBalance,
    utr,
    rawMessage: clean
  };
}
