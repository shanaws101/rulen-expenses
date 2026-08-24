import { Currency, Expense } from './types';

/**
 * Standard default exchange rate (1 USD to BDT)
 */
export const DEFAULT_EXCHANGE_RATE = 122.5;

/**
 * Converts any expense amount to BDT base currency using the entry's exchange rate.
 */
export function convertToBDT(
  amount: number,
  currency: Currency,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (currency === 'BDT') {
    return Number(amount) || 0;
  }
  const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : DEFAULT_EXCHANGE_RATE;
  return (Number(amount) || 0) * rate;
}

/**
 * Format a number to Bangladeshi Taka (BDT) display string.
 */
export function formatBDT(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `৳${formatted}`;
}

/**
 * Format a number to US Dollars (USD) display string.
 */
export function formatUSD(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `$${formatted}`;
}

/**
 * Format any currency based on its currency code.
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    return formatUSD(amount);
  }
  return formatBDT(amount);
}

/**
 * Calculate total BDT equivalent for a list of expenses.
 */
export function calculateTotalBDT(expenses: Expense[]): number {
  return expenses.reduce((sum, exp) => {
    return sum + convertToBDT(exp.amount, exp.currency, exp.exchange_rate);
  }, 0);
}

/**
 * Breakdown totals by original currency.
 */
export function calculateCurrencyBreakdown(expenses: Expense[]): {
  usdTotal: number;
  bdtTotal: number;
  convertedGrandTotalBDT: number;
} {
  let usdTotal = 0;
  let bdtTotal = 0;

  expenses.forEach((exp) => {
    if (exp.currency === 'USD') {
      usdTotal += Number(exp.amount) || 0;
    } else {
      bdtTotal += Number(exp.amount) || 0;
    }
  });

  const convertedGrandTotalBDT = calculateTotalBDT(expenses);

  return {
    usdTotal,
    bdtTotal,
    convertedGrandTotalBDT,
  };
}
