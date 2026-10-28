# Daily Allowance & Instant UPI Tracker
### Live Daily Allowances, Instant On-Device Heads-Up Feedback & Automated Multi-Bank Account Linking

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🏦 Automated Multi-Bank Ingestion & Linking System

### 1. Link Bank Accounts via RBI Account Aggregator (AA)
- **100% Secure & Regulated:** No netbanking passwords or MPINs required. Built on India's RBI-regulated Account Aggregator TSP standard (Setu / Finvu).
- **Interactive In-App Flow (`Link Bank` button):**
  1. **Select Bank:** Choose from 13+ major Indian banks (HDFC, ICICI, SBI, Axis, Kotak, IDFC FIRST, IndusInd, PNB, BOB, Yes Bank, Canara, Federal, Union Bank).
  2. **OTP Verification:** Simulates registered mobile verification.
  3. **Account Discovery:** Discovers all linked accounts (Salary Savings, Savings, Credit Cards) with real-time balances.
  4. **Encrypted Consent:** Grants revocable, read-only consent for balance synchronization.

### 2. Automated Multi-Bank SMS Parser (`multiBankSmsParser.ts`)
Parses official debit & credit SMS alerts across all Indian banks with automatic extraction of:
- **Debit/Credit Amount**
- **Bank Identity & Logo**
- **Account Number Last 4 Digits**
- **Live Available Balance:** Whenever an SMS states `Avail Bal: Rs 33,750`, the linked account's balance updates in real time!
- **Merchant / Payee Name & Category**
- **UTR / UPI Reference Number**

### 3. Multi-Bank Self-Transfer Shield
Transfers between any of your linked accounts (e.g. from HDFC **4821 $\rightarrow$ ICICI **9012) are automatically detected as internal transfers and shielded from your daily allowance.

---

## 🚀 How to Deploy on Every Device

- **Vercel / Netlify / Render:** Run `npm run build` and deploy the `dist/` directory. (A pre-configured `vercel.json` SPA rewrite file is included).
- **Install as PWA:**
  - **Android (Chrome):** Tap three dots `⋮` $\rightarrow$ **"Install App"**.
  - **iPhone (Safari):** Tap Share $\rightarrow$ **"Add to Home Screen"**. Runs full-screen with native gesture support.
