import {
  Account,
  AccountingBasis,
  BalanceSheetData,
  CashBurnMetrics,
  Category,
  Expense,
  ForecastProjection,
  JournalEntry,
  JournalLine,
  RecurringItem,
  TrialBalanceRow,
} from './types';
import { convertToBDT } from './currency';

// Initial Chart of Accounts
export const INITIAL_ACCOUNTS: Account[] = [
  // 1. Assets
  {
    id: 'acc-asset-cash',
    code: '1010',
    name: 'Cash / Bank Operating Account',
    type: 'asset',
    is_active: true,
    description: 'Primary operational bank account and digital wallets.',
    created_at: '2026-08-01T00:00:00Z',
  },
  // 2. Liabilities
  {
    id: 'acc-liab-ap',
    code: '2010',
    name: 'Accounts Payable',
    type: 'liability',
    is_active: true,
    description: 'Approved unpaid contractor invoices, vendor bills, and operational payables.',
    created_at: '2026-08-01T00:00:00Z',
  },
  // 3. Equity
  {
    id: 'acc-eq-founder-parent',
    code: '3000',
    name: 'Founder Capital',
    type: 'equity',
    is_active: true,
    description: 'Total invested capital contributed by founders.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-eq-founder-1',
    code: '3010',
    name: 'Founder Capital — Founder 1',
    type: 'equity',
    parent_id: 'acc-eq-founder-parent',
    is_active: true,
    description: 'Capital contributions from Founder 1.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-eq-founder-2',
    code: '3020',
    name: 'Founder Capital — Founder 2',
    type: 'equity',
    parent_id: 'acc-eq-founder-parent',
    is_active: true,
    description: 'Capital contributions from Founder 2.',
    created_at: '2026-08-01T00:00:00Z',
  },
  // 4. Income (Founder Contributions)
  {
    id: 'acc-inc-contributions',
    code: '4010',
    name: 'Founder Contributions',
    type: 'income',
    is_active: true,
    description: 'Inward funding infusions for remote company runway.',
    created_at: '2026-08-01T00:00:00Z',
  },
  // 5. Expense Accounts (One per category)
  {
    id: 'acc-exp-salary',
    code: '5010',
    name: 'Salary & Compensation Expense',
    type: 'expense',
    is_active: true,
    description: 'Employee wages and contractor compensation.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-marketing',
    code: '5020',
    name: 'Marketing & Advertising Expense',
    type: 'expense',
    is_active: true,
    description: 'Paid campaigns, ads, influencer promotions, and sponsorships.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-launch',
    code: '5030',
    name: 'Product Launch Expense',
    type: 'expense',
    is_active: true,
    description: 'Launch events, press releases, Product Hunt promotions.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-demo',
    code: '5040',
    name: 'Demo Video Production Expense',
    type: 'expense',
    is_active: true,
    description: 'Video editing, 3D motion graphics, voiceovers.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-branding',
    code: '5050',
    name: 'Branding & Logo Design Expense',
    type: 'expense',
    is_active: true,
    description: 'Brand identity assets, typography, design assets.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-domain',
    code: '5060',
    name: 'Domain & Web Hosting Expense',
    type: 'expense',
    is_active: true,
    description: 'Vercel, Supabase, Cloudflare, domains.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-ai',
    code: '5070',
    name: 'AI Tools & API Subscriptions',
    type: 'expense',
    is_active: true,
    description: 'OpenAI, Anthropic Claude, Cursor, Midjourney, v0.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-testing',
    code: '5080',
    name: 'QA & Testing Services Expense',
    type: 'expense',
    is_active: true,
    description: 'Automated test infrastructure, device labs, QA.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-cloud',
    code: '5090',
    name: 'Cloud & Infrastructure Compute',
    type: 'expense',
    is_active: true,
    description: 'AWS, GCP compute, Docker containers, CDN.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'acc-exp-other',
    code: '5100',
    name: 'Miscellaneous Operations Expense',
    type: 'expense',
    is_active: true,
    description: 'General administrative and remote office expenses.',
    created_at: '2026-08-01T00:00:00Z',
  },
];

/**
 * Maps an expense category name/ID to its corresponding GL Expense Account
 */
export function getExpenseAccountForCategory(
  categoryIdOrName: string,
  categories: Category[],
  accounts: Account[]
): Account {
  const cat = categories.find(
    (c) => c.id === categoryIdOrName || c.name.toLowerCase() === categoryIdOrName.toLowerCase()
  );
  const catName = (cat?.name || categoryIdOrName).toLowerCase();

  // Match keyword to account
  if (catName.includes('salary') || catName.includes('compensation')) {
    return accounts.find((a) => a.code === '5010') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('marketing') || catName.includes('ad')) {
    return accounts.find((a) => a.code === '5020') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('launch')) {
    return accounts.find((a) => a.code === '5030') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('demo') || catName.includes('video')) {
    return accounts.find((a) => a.code === '5040') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('brand') || catName.includes('logo')) {
    return accounts.find((a) => a.code === '5050') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('domain') || catName.includes('hosting')) {
    return accounts.find((a) => a.code === '5060') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('ai') || catName.includes('tool')) {
    return accounts.find((a) => a.code === '5070') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('test') || catName.includes('qa')) {
    return accounts.find((a) => a.code === '5080') || accounts.find((a) => a.type === 'expense')!;
  }
  if (catName.includes('cloud') || catName.includes('deploy')) {
    return accounts.find((a) => a.code === '5090') || accounts.find((a) => a.type === 'expense')!;
  }

  return (
    accounts.find((a) => a.code === '5100') ||
    accounts.find((a) => a.type === 'expense') ||
    INITIAL_ACCOUNTS.find((a) => a.code === '5100')!
  );
}

/**
 * Validates that journal lines balance (Debits BDT === Credits BDT)
 */
export function verifyJournalBalance(
  lines: { debit_bdt: number; credit_bdt: number }[]
): { isBalanced: boolean; totalDebits: number; totalCredits: number; diff: number } {
  const totalDebits = lines.reduce((sum, l) => sum + (Number(l.debit_bdt) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (Number(l.credit_bdt) || 0), 0);
  const diff = Math.abs(totalDebits - totalCredits);

  // Allow floating point rounding under 0.01 BDT
  return {
    isBalanced: diff < 0.01,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    diff: Math.round(diff * 100) / 100,
  };
}

/**
 * Generates balanced double-entry journal entry for an Approved Expense
 */
export function generateExpenseApprovalJournalEntry(
  expense: Expense,
  categories: Category[],
  accounts: Account[],
  userId: string
): { entry: Omit<JournalEntry, 'id' | 'created_at'>; lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] } {
  const amountBDT = convertToBDT(expense.amount, expense.currency, expense.exchange_rate);
  const expenseAccount = getExpenseAccountForCategory(expense.category_id, categories, accounts);
  const cashAccount = accounts.find((a) => a.code === '1010') || INITIAL_ACCOUNTS[0];
  const apAccount = accounts.find((a) => a.code === '2010') || INITIAL_ACCOUNTS[1];

  const isPaid = expense.payment_status === 'paid';
  const creditAccount = isPaid ? cashAccount : apAccount;

  const lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] = [
    // 1. Debit Expense Account (Increases Expense)
    {
      account_id: expenseAccount.id,
      debit_amount: expense.amount,
      credit_amount: 0,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate,
      debit_bdt: amountBDT,
      credit_bdt: 0,
    },
    // 2. Credit Cash/AP Account (Decreases Asset or Increases Liability)
    {
      account_id: creditAccount.id,
      debit_amount: 0,
      credit_amount: expense.amount,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate,
      debit_bdt: 0,
      credit_bdt: amountBDT,
    },
  ];

  const entry: Omit<JournalEntry, 'id' | 'created_at'> = {
    entry_date: expense.expense_date,
    settled_date: isPaid ? (expense.paid_date || expense.expense_date) : null,
    description: `Expense: ${expense.description} (${isPaid ? 'Settled / Paid' : 'Accrued to Accounts Payable'})`,
    created_by: userId,
    source_type: 'expense',
    source_id: expense.id,
    lines: lines as any,
  };

  return { entry, lines };
}

/**
 * Generates balanced double-entry journal entry for Settling an Unpaid Expense
 */
export function generateExpenseSettlementJournalEntry(
  expense: Expense,
  accounts: Account[],
  userId: string,
  settledDate: string
): { entry: Omit<JournalEntry, 'id' | 'created_at'>; lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] } {
  const amountBDT = convertToBDT(expense.amount, expense.currency, expense.exchange_rate);
  const cashAccount = accounts.find((a) => a.code === '1010') || INITIAL_ACCOUNTS[0];
  const apAccount = accounts.find((a) => a.code === '2010') || INITIAL_ACCOUNTS[1];

  const lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] = [
    // 1. Debit Accounts Payable (Decreases Liability)
    {
      account_id: apAccount.id,
      debit_amount: expense.amount,
      credit_amount: 0,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate,
      debit_bdt: amountBDT,
      credit_bdt: 0,
    },
    // 2. Credit Cash / Bank (Decreases Asset)
    {
      account_id: cashAccount.id,
      debit_amount: 0,
      credit_amount: expense.amount,
      currency: expense.currency,
      exchange_rate: expense.exchange_rate,
      debit_bdt: 0,
      credit_bdt: amountBDT,
    },
  ];

  const entry: Omit<JournalEntry, 'id' | 'created_at'> = {
    entry_date: settledDate,
    settled_date: settledDate,
    description: `AP Settlement: Paid invoice for ${expense.description}`,
    created_by: userId,
    source_type: 'adjustment',
    source_id: expense.id,
    lines: lines as any,
  };

  return { entry, lines };
}

/**
 * Generates balanced double-entry journal entry for a Capital Contribution
 */
export function generateCapitalContributionJournalEntry(
  contribution: {
    id: string;
    amount: number;
    currency: 'USD' | 'BDT';
    exchange_rate: number;
    contribution_date: string;
    settled_date?: string | null;
    note?: string | null;
    contributed_by: string;
    founder_account_id?: string | null;
  },
  accounts: Account[],
  founderName: string,
  userId: string
): { entry: Omit<JournalEntry, 'id' | 'created_at'>; lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] } {
  const amountBDT = convertToBDT(contribution.amount, contribution.currency, contribution.exchange_rate);
  const cashAccount = accounts.find((a) => a.code === '1010') || INITIAL_ACCOUNTS[0];

  // Specific founder sub-account or fallback
  let equityAccount = accounts.find((a) => a.id === contribution.founder_account_id);
  if (!equityAccount) {
    equityAccount =
      accounts.find((a) => a.type === 'equity' && a.name.toLowerCase().includes(founderName.toLowerCase())) ||
      accounts.find((a) => a.code === '3010') ||
      accounts.find((a) => a.type === 'equity') ||
      INITIAL_ACCOUNTS[3];
  }

  const lines: Omit<JournalLine, 'id' | 'journal_entry_id'>[] = [
    // 1. Debit Cash / Bank (Increases Asset)
    {
      account_id: cashAccount.id,
      debit_amount: contribution.amount,
      credit_amount: 0,
      currency: contribution.currency,
      exchange_rate: contribution.exchange_rate,
      debit_bdt: amountBDT,
      credit_bdt: 0,
    },
    // 2. Credit Founder Capital (Increases Equity)
    {
      account_id: equityAccount.id,
      debit_amount: 0,
      credit_amount: contribution.amount,
      currency: contribution.currency,
      exchange_rate: contribution.exchange_rate,
      debit_bdt: 0,
      credit_bdt: amountBDT,
    },
  ];

  const settledDate = contribution.settled_date || contribution.contribution_date;

  const entry: Omit<JournalEntry, 'id' | 'created_at'> = {
    entry_date: contribution.contribution_date,
    settled_date: settledDate,
    description: `Capital Contribution from ${founderName}${contribution.note ? `: ${contribution.note}` : ''}`,
    created_by: userId,
    source_type: 'contribution',
    source_id: contribution.id,
    lines: lines as any,
  };

  return { entry, lines };
}

/**
 * Computes Trial Balance from Journal Entries (as of date & basis)
 */
export function calculateTrialBalance(
  journalEntries: JournalEntry[],
  accounts: Account[],
  asOfDate: string,
  basis: AccountingBasis = 'accrual'
): TrialBalanceRow[] {
  const accountTotals = new Map<string, { debit: number; credit: number }>();

  // Filter entries
  const activeEntries = journalEntries.filter((entry) => {
    if (basis === 'cash') {
      if (!entry.settled_date) return false;
      return entry.settled_date <= asOfDate;
    }
    return entry.entry_date <= asOfDate;
  });

  // Aggregate line totals
  activeEntries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const current = accountTotals.get(line.account_id) || { debit: 0, credit: 0 };
      accountTotals.set(line.account_id, {
        debit: current.debit + (Number(line.debit_bdt) || 0),
        credit: current.credit + (Number(line.credit_bdt) || 0),
      });
    });
  });

  return accounts.map((account) => {
    const totals = accountTotals.get(account.id) || { debit: 0, credit: 0 };
    const net = totals.debit - totals.credit;

    return {
      account,
      debitTotal: totals.debit,
      creditTotal: totals.credit,
      netDebit: net > 0 ? net : 0,
      netCredit: net < 0 ? Math.abs(net) : 0,
    };
  });
}

/**
 * Computes Balance Sheet (Assets = Liabilities + Equity)
 */
export function calculateBalanceSheet(
  journalEntries: JournalEntry[],
  accounts: Account[],
  asOfDate: string,
  basis: AccountingBasis = 'accrual'
): BalanceSheetData {
  const trialBalance = calculateTrialBalance(journalEntries, accounts, asOfDate, basis);

  const assetRows: { account: Account; balance: number }[] = [];
  const liabilityRows: { account: Account; balance: number }[] = [];
  const equityRows: { account: Account; balance: number }[] = [];
  let totalIncomeBDT = 0;
  let totalExpenseBDT = 0;

  trialBalance.forEach((row) => {
    const { account, debitTotal, creditTotal } = row;
    if (account.type === 'asset') {
      const balance = debitTotal - creditTotal;
      if (Math.abs(balance) > 0.001) {
        assetRows.push({ account, balance });
      }
    } else if (account.type === 'liability') {
      const balance = creditTotal - debitTotal;
      if (Math.abs(balance) > 0.001) {
        liabilityRows.push({ account, balance });
      }
    } else if (account.type === 'equity') {
      const balance = creditTotal - debitTotal;
      if (Math.abs(balance) > 0.001) {
        equityRows.push({ account, balance });
      }
    } else if (account.type === 'income') {
      totalIncomeBDT += creditTotal - debitTotal;
    } else if (account.type === 'expense') {
      totalExpenseBDT += debitTotal - creditTotal;
    }
  });

  // Net Income / (Loss) closes into Retained Earnings
  const retainedEarnings = totalIncomeBDT - totalExpenseBDT;

  const totalAssets = assetRows.reduce((sum, r) => sum + r.balance, 0);
  const totalLiabilities = liabilityRows.reduce((sum, r) => sum + r.balance, 0);
  const totalEquity = equityRows.reduce((sum, r) => sum + r.balance, 0) + retainedEarnings;

  const netDiff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const isBalanced = netDiff < 0.01;

  return {
    asOfDate,
    basis,
    assets: {
      accounts: assetRows,
      total: Math.round(totalAssets * 100) / 100,
    },
    liabilities: {
      accounts: liabilityRows,
      total: Math.round(totalLiabilities * 100) / 100,
    },
    equity: {
      accounts: equityRows,
      retainedEarnings: Math.round(retainedEarnings * 100) / 100,
      total: Math.round(totalEquity * 100) / 100,
    },
    isBalanced,
    netDifference: Math.round(netDiff * 100) / 100,
  };
}

/**
 * Computes Cash Position, Unpaid Payables, Trailing Burn, and Runway
 */
export function calculateCashBurnMetrics(
  journalEntries: JournalEntry[],
  expenses: Expense[],
  accounts: Account[]
): CashBurnMetrics {
  const cashAccount = accounts.find((a) => a.code === '1010') || INITIAL_ACCOUNTS[0];

  // Settled cash balance
  let cashDebits = 0;
  let cashCredits = 0;

  journalEntries.forEach((entry) => {
    if (entry.settled_date) {
      entry.lines.forEach((line) => {
        if (line.account_id === cashAccount.id) {
          cashDebits += Number(line.debit_bdt) || 0;
          cashCredits += Number(line.credit_bdt) || 0;
        }
      });
    }
  });

  const currentCashBalanceBDT = Math.max(0, cashDebits - cashCredits);

  // Unpaid approved expenses
  const unpaidExpenses = expenses.filter(
    (e) => e.status === 'approved' && e.payment_status === 'unpaid'
  );
  const unpaidPayablesBDT = unpaidExpenses.reduce((sum, e) => {
    return sum + convertToBDT(e.amount, e.currency, e.exchange_rate);
  }, 0);

  const netLiquidCashBDT = currentCashBalanceBDT - unpaidPayablesBDT;

  // Monthly burn calculation for last 3 completed months
  const now = new Date();
  const monthlyHistory: CashBurnMetrics['monthlyHistory'] = [];

  let trailing3MonthsSpend = 0;
  let validMonthsCount = 0;

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().substring(0, 7);

    // Sum cash expenses settled in this month
    let cashExpensesBDT = 0;
    let contributionsBDT = 0;

    journalEntries.forEach((entry) => {
      if (entry.settled_date && entry.settled_date.startsWith(monthKey)) {
        entry.lines.forEach((line) => {
          const acc = accounts.find((a) => a.id === line.account_id);
          if (acc?.type === 'expense') {
            cashExpensesBDT += Number(line.debit_bdt) || 0;
          }
          if (acc?.type === 'income' || acc?.type === 'equity') {
            contributionsBDT += Number(line.credit_bdt) || 0;
          }
        });
      }
    });

    const netBurnBDT = cashExpensesBDT;
    monthlyHistory.push({
      month: monthKey,
      contributionsBDT,
      cashExpensesBDT,
      netBurnBDT,
    });

    if (i < 3 && cashExpensesBDT > 0) {
      trailing3MonthsSpend += cashExpensesBDT;
      validMonthsCount++;
    }
  }

  const averageMonthlyBurnBDT =
    validMonthsCount > 0 ? Math.round(trailing3MonthsSpend / validMonthsCount) : trailing3MonthsSpend;

  const runwayMonths =
    averageMonthlyBurnBDT > 0
      ? Math.round((currentCashBalanceBDT / averageMonthlyBurnBDT) * 10) / 10
      : 99.9;

  return {
    currentCashBalanceBDT,
    unpaidPayablesBDT,
    netLiquidCashBDT,
    trailing3MonthsBurnBDT: trailing3MonthsSpend,
    averageMonthlyBurnBDT,
    runwayMonths,
    monthlyHistory,
  };
}

/**
 * Computes forward forecasting for 3, 6, or 12 months based on recurring items + variable burn
 */
export function calculateForecast(
  recurringItems: RecurringItem[],
  expenses: Expense[],
  currentCashBDT: number,
  periodMonths: 3 | 6 | 12 = 6,
  exchangeRate: number = 122.5
): ForecastProjection {
  // Monthly recurring items total in BDT
  const activeRecurring = recurringItems.filter((item) => item.is_active);
  const recurringMonthlyBDT = activeRecurring.reduce((sum, item) => {
    const rate = item.exchange_rate || exchangeRate;
    const amountBDT = convertToBDT(item.amount, item.currency, rate);
    if (item.frequency === 'monthly') return sum + amountBDT;
    if (item.frequency === 'quarterly') return sum + amountBDT / 3;
    if (item.frequency === 'annual') return sum + amountBDT / 12;
    return sum + amountBDT;
  }, 0);

  // Historical variable (non-recurring) average monthly spend
  const approvedExpenses = expenses.filter((e) => e.status === 'approved');
  const totalHistoricalSpend = approvedExpenses.reduce((sum, e) => {
    return sum + convertToBDT(e.amount, e.currency, e.exchange_rate);
  }, 0);

  // Approximate historical months count
  const distinctMonths = new Set(approvedExpenses.map((e) => e.expense_date.substring(0, 7)));
  const monthsCount = Math.max(distinctMonths.size, 1);
  const historicalAvgTotalMonthly = totalHistoricalSpend / monthsCount;

  // Variable spend = total historical minus recurring portion
  const historicalNonRecurringMonthlyBDT = Math.max(
    0,
    historicalAvgTotalMonthly - recurringMonthlyBDT
  );

  const projectedMonthlySpendBDT = recurringMonthlyBDT + historicalNonRecurringMonthlyBDT;
  const projectedTotalSpendBDT = projectedMonthlySpendBDT * periodMonths;
  const projectedEndingCashBDT = currentCashBDT - projectedTotalSpendBDT;

  const projectedRunwayMonths =
    projectedMonthlySpendBDT > 0
      ? Math.round((currentCashBDT / projectedMonthlySpendBDT) * 10) / 10
      : 99.9;

  const monthsList: ForecastProjection['monthsList'] = [];
  let runningCash = currentCashBDT;
  const now = new Date();

  for (let i = 1; i <= periodMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    const startingCash = runningCash;
    const recurringSpend = recurringMonthlyBDT;
    const variableSpend = historicalNonRecurringMonthlyBDT;
    const totalSpend = recurringSpend + variableSpend;
    const endingCash = startingCash - totalSpend;
    runningCash = endingCash;

    monthsList.push({
      month: monthName,
      startingCashBDT: Math.round(startingCash),
      recurringSpendBDT: Math.round(recurringSpend),
      variableSpendBDT: Math.round(variableSpend),
      totalSpendBDT: Math.round(totalSpend),
      endingCashBDT: Math.round(endingCash),
    });
  }

  return {
    periodMonths,
    currentCashBDT,
    recurringMonthlyBDT: Math.round(recurringMonthlyBDT),
    historicalNonRecurringMonthlyBDT: Math.round(historicalNonRecurringMonthlyBDT),
    projectedMonthlySpendBDT: Math.round(projectedMonthlySpendBDT),
    projectedTotalSpendBDT: Math.round(projectedTotalSpendBDT),
    projectedEndingCashBDT: Math.round(projectedEndingCashBDT),
    projectedRunwayMonths,
    monthsList,
  };
}
