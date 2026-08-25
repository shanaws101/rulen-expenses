'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Currency, Expense, PaymentStatus } from '@/lib/types';
import { convertToBDT, formatBDT } from '@/lib/currency';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, CreditCard, Clock } from 'lucide-react';

interface ExpenseFormModalProps {
  onClose: () => void;
  initialExpense?: Expense | null;
}

export function ExpenseFormModal({ onClose, initialExpense }: ExpenseFormModalProps) {
  const { currentUser, categories, settings, addExpense, resubmitExpense, updateExpense } = useExpenses();

  const activeCategories = categories.filter((c) => c.is_active);

  const [amount, setAmount] = useState<string>(initialExpense ? String(initialExpense.amount) : '');
  const [currency, setCurrency] = useState<Currency>(initialExpense ? initialExpense.currency : 'USD');
  const [exchangeRate, setExchangeRate] = useState<string>(
    initialExpense ? String(initialExpense.exchange_rate) : String(settings.default_exchange_rate)
  );
  const [customRateEnabled, setCustomRateEnabled] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(
    initialExpense ? initialExpense.category_id : activeCategories[0]?.id || ''
  );
  const [description, setDescription] = useState<string>(initialExpense ? initialExpense.description : '');
  const [expenseDate, setExpenseDate] = useState<string>(
    initialExpense ? initialExpense.expense_date : new Date().toISOString().split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialExpense ? initialExpense.payment_status : 'paid'
  );
  const [dueDate, setDueDate] = useState<string>(initialExpense?.due_date || '');
  const [paidDate, setPaidDate] = useState<string>(
    initialExpense?.paid_date || (paymentStatus === 'paid' ? expenseDate : '')
  );

  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialExpense?.receipt_url || null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(
    initialExpense?.receipt_url ? 'Existing Receipt Attachment' : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived converted BDT amount
  const numericAmount = parseFloat(amount) || 0;
  const numericRate = parseFloat(exchangeRate) || settings.default_exchange_rate;
  const convertedBDT = convertToBDT(numericAmount, currency, numericRate);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      try {
        const { uploadReceiptToSupabase } = await import('@/lib/supabase/storage');
        const uploadedUrl = await uploadReceiptToSupabase(file);
        if (uploadedUrl) {
          setReceiptUrl(uploadedUrl);
          return;
        }
      } catch (err) {
        console.warn('Supabase storage not available, using local preview');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleReceipts = [
    { label: 'Cloud Invoice', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80' },
    { label: 'SaaS Receipt', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80' },
    { label: 'Contractor Bill', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || numericAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please select an expense category.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description or business purpose for this expense.');
      return;
    }
    if (paymentStatus === 'unpaid' && !dueDate) {
      setError('Please provide a payment due date for unpaid bills.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialExpense) {
        if (initialExpense.status === 'rejected') {
          await resubmitExpense(initialExpense.id, {
            amount: numericAmount,
            currency,
            exchange_rate: currency === 'USD' ? numericRate : 1,
            category_id: categoryId,
            description,
            expense_date: expenseDate,
            receipt_url: receiptUrl,
            payment_status: paymentStatus,
            due_date: paymentStatus === 'unpaid' ? dueDate : null,
          });
        } else {
          await updateExpense(initialExpense.id, {
            amount: numericAmount,
            currency,
            exchange_rate: currency === 'USD' ? numericRate : 1,
            category_id: categoryId,
            description,
            expense_date: expenseDate,
            receipt_url: receiptUrl,
            payment_status: paymentStatus,
            due_date: paymentStatus === 'unpaid' ? dueDate : null,
            paid_date: paymentStatus === 'paid' ? (paidDate || expenseDate) : null,
          });
        }
      } else {
        const created = await addExpense({
          amount: numericAmount,
          currency,
          exchange_rate: currency === 'USD' ? numericRate : 1,
          category_id: categoryId,
          description,
          expense_date: expenseDate,
          receipt_url: receiptUrl,
          payment_status: paymentStatus,
          due_date: paymentStatus === 'unpaid' ? dueDate : null,
          paid_date: paymentStatus === 'paid' ? (paidDate || expenseDate) : null,
        });

        if (!created) {
          throw new Error('Could not register expense in Supabase. Please ensure you are logged in.');
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Expense form submission error:', err);
      setError(err.message || 'Failed to save expense entry. Please check your Supabase connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cohere-hairline bg-white">
          <div>
            <span className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              {initialExpense ? 'Revise Submission' : 'New Expense Submission'}
            </span>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
              {initialExpense ? 'Update Expense Record' : 'Log Company Expense'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submitter info banner */}
        {currentUser && (
          <div className="px-6 py-3 bg-cohere-soft-stone/70 border-b border-cohere-hairline flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + currentUser.name}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-cohere-ink font-medium">
                Submitting as <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            {currentUser.role === 'admin' ? (
              <span className="text-[11px] font-mono text-cohere-deep-green flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Approved
              </span>
            ) : (
              <span className="text-[11px] font-mono text-cohere-slate">
                Will route for review
              </span>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-cohere-slate">
              Expense Amount & Currency *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-sm border border-cohere-border-light text-base font-mono font-bold text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black placeholder:text-gray-300"
                />
              </div>

              {/* Currency Selector */}
              <div className="flex p-1 bg-cohere-soft-stone rounded-sm border border-cohere-card-border">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-cohere-ink shadow-sm'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('BDT')}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                    currency === 'BDT'
                      ? 'bg-white text-cohere-ink shadow-sm'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  BDT (৳)
                </button>
              </div>
            </div>

            {/* Exchange Rate breakdown for USD */}
            {currency === 'USD' && (
              <div className="p-3 bg-cohere-soft-stone/60 rounded-md border border-cohere-hairline space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cohere-slate">
                    Converted Total (Base BDT): <strong className="text-cohere-black">{formatBDT(convertedBDT)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomRateEnabled(!customRateEnabled)}
                    className="text-[11px] text-cohere-action-blue hover:underline"
                  >
                    {customRateEnabled ? 'Use default rate' : 'Override rate'}
                  </button>
                </div>

                {customRateEnabled && (
                  <div className="flex items-center gap-2 pt-1 border-t border-cohere-card-border">
                    <span className="text-[11px] font-mono text-cohere-slate">1 USD =</span>
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono border border-cohere-border-light rounded bg-white"
                    />
                    <span className="text-[11px] font-mono text-cohere-slate">BDT</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Status & Settlement */}
          <div className="space-y-2 p-3 bg-cohere-soft-stone/40 rounded-md border border-cohere-hairline">
            <label className="block text-[11px] font-mono uppercase text-cohere-slate">
              Payment & Settlement Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-sm border text-xs font-medium transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-white border-cohere-near-black text-cohere-ink font-semibold shadow-xs'
                    : 'bg-transparent border-cohere-border-light text-cohere-slate hover:bg-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-cohere-deep-green" />
                <span>Paid / Settled</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-sm border text-xs font-medium transition-all ${
                  paymentStatus === 'unpaid'
                    ? 'bg-white border-amber-600 text-amber-800 font-semibold shadow-xs'
                    : 'bg-transparent border-cohere-border-light text-cohere-slate hover:bg-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Unpaid (Accrue to AP)</span>
              </button>
            </div>

            {paymentStatus === 'unpaid' ? (
              <div className="pt-2">
                <label className="block text-[10px] font-mono uppercase text-amber-700 mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-amber-300 text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            ) : (
              <div className="text-[10px] font-mono text-cohere-muted-slate">
                Settles immediately against Cash/Bank operating account.
              </div>
            )}
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Description & Business Justification *
            </label>
            <textarea
              required
              rows={2}
              placeholder="E.g., Vercel Pro team subscription, AWS server instance, Figma enterprise license..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black placeholder:text-gray-300 resize-none font-body"
            />
          </div>

          {/* Receipt Attachment */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
              Receipt / Invoice Attachment (Optional)
            </label>

            <div className="border border-dashed border-cohere-hairline rounded-lg p-4 text-center hover:border-cohere-near-black transition-colors bg-cohere-soft-stone/20">
              <input
                type="file"
                id="receipt-file-input"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="receipt-file-input"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-cohere-slate" />
                <span className="text-xs font-medium text-cohere-ink">
                  {receiptFileName ? receiptFileName : 'Upload receipt image or PDF'}
                </span>
                <span className="text-[10px] text-cohere-muted-slate font-mono">
                  PNG, JPG, PDF up to 10MB
                </span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cohere-hairline">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-pill text-xs font-medium text-cohere-slate hover:text-cohere-ink font-body transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Ledger Entry...</span>
                </>
              ) : (
                <span>{initialExpense ? 'Save Changes' : 'Submit Expense Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
