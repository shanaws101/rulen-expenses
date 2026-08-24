'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Currency, Expense } from '@/lib/types';
import { convertToBDT, formatBDT } from '@/lib/currency';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';

interface ExpenseFormModalProps {
  onClose: () => void;
  initialExpense?: Expense | null; // If editing / resubmitting
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

  // File upload handler (uploads to Supabase Storage if configured or creates base64 preview)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      
      // Try uploading to Supabase Storage
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

      // Fallback to local base64 reader
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample receipt presets for quick testing
  const sampleReceipts = [
    { label: 'Cloud Invoice', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80' },
    { label: 'SaaS Receipt', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80' },
    { label: 'Contractor Bill', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    try {
      if (initialExpense) {
        if (initialExpense.status === 'rejected') {
          resubmitExpense(initialExpense.id, {
            amount: numericAmount,
            currency,
            exchange_rate: currency === 'USD' ? numericRate : 1,
            category_id: categoryId,
            description,
            expense_date: expenseDate,
            receipt_url: receiptUrl,
          });
        } else {
          updateExpense(initialExpense.id, {
            amount: numericAmount,
            currency,
            exchange_rate: currency === 'USD' ? numericRate : 1,
            category_id: categoryId,
            description,
            expense_date: expenseDate,
            receipt_url: receiptUrl,
          });
        }
      } else {
        addExpense({
          amount: numericAmount,
          currency,
          exchange_rate: currency === 'USD' ? numericRate : 1,
          category_id: categoryId,
          description,
          expense_date: expenseDate,
          receipt_url: receiptUrl,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense entry.');
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
            <div className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              {initialExpense ? (initialExpense.status === 'rejected' ? 'Fix & Resubmit Entry' : 'Edit Expense') : 'New Expense Submission'}
            </div>
            <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight mt-0.5">
              {initialExpense ? 'Update Expense Details' : 'Log Company Expense'}
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
              Will route to manager for review
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount and Currency Row */}
          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1.5 tracking-wider">
              Expense Amount & Currency *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-2.5 rounded-sm border border-cohere-border-light text-cohere-ink font-mono text-base font-semibold focus:outline-none focus:ring-1 focus:ring-cohere-near-black focus:border-cohere-near-black transition-all"
                />
              </div>

              {/* Currency Selector Pills */}
              <div className="flex rounded-sm p-1 bg-cohere-soft-stone border border-cohere-card-border">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
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
                  className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                    currency === 'BDT'
                      ? 'bg-white text-cohere-ink shadow-sm'
                      : 'text-cohere-slate hover:text-cohere-ink'
                  }`}
                >
                  BDT (৳)
                </button>
              </div>
            </div>

            {/* Live Currency Conversion Helper */}
            <div className="mt-2.5 p-3 rounded-sm bg-cohere-pale-blue/60 border border-[#e1e9fc] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-cohere-dark-navy">
                <span className="font-mono font-semibold uppercase text-[10px] text-cohere-action-blue tracking-wider block sm:inline mr-2">
                  Converted Total (Base BDT):
                </span>
                <span className="font-mono text-sm font-bold text-cohere-black">
                  {formatBDT(convertedBDT)}
                </span>
              </div>

              {currency === 'USD' && (
                <div className="text-[11px] font-mono text-cohere-slate flex items-center gap-1.5">
                  <span>Rate: 1 USD =</span>
                  {customRateEnabled ? (
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-20 px-1.5 py-0.5 border border-cohere-hairline rounded bg-white text-xs font-mono text-cohere-ink"
                    />
                  ) : (
                    <strong className="text-cohere-ink font-mono">{exchangeRate}</strong>
                  )}
                  <span>BDT</span>
                  <button
                    type="button"
                    onClick={() => setCustomRateEnabled(!customRateEnabled)}
                    className="text-cohere-action-blue underline text-[10px] ml-1"
                  >
                    {customRateEnabled ? 'Done' : 'Override'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1.5 tracking-wider">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-cohere-ink text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cohere-near-black focus:border-cohere-near-black bg-white"
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1.5 tracking-wider">
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-cohere-ink text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cohere-near-black focus:border-cohere-near-black bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1.5 tracking-wider">
              Description & Business Justification *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Monthly Cursor AI Team license for frontend engineers"
              required
              className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-cohere-ink text-xs focus:outline-none focus:ring-1 focus:ring-cohere-near-black focus:border-cohere-near-black transition-all"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-mono uppercase text-cohere-slate mb-1.5 tracking-wider">
              Receipt / Invoice Attachment (Optional)
            </label>
            <div className="border-2 border-dashed border-cohere-hairline rounded-md p-4 text-center hover:border-cohere-slate transition-colors bg-[#fafafa]">
              {receiptUrl ? (
                <div className="flex items-center justify-between bg-white p-2 rounded border border-cohere-hairline">
                  <div className="flex items-center gap-2">
                    <img
                      src={receiptUrl}
                      alt="Receipt preview"
                      className="w-10 h-10 object-cover rounded border border-cohere-hairline"
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-cohere-ink truncate max-w-[200px]">
                        {receiptFileName || 'Uploaded receipt image'}
                      </div>
                      <span className="text-[10px] text-cohere-deep-green font-mono">Attachment ready</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(null);
                      setReceiptFileName(null);
                    }}
                    className="text-xs text-red-600 hover:underline font-mono"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-6 h-6 text-cohere-slate mx-auto mb-1.5" />
                  <div className="text-xs text-cohere-ink font-medium">
                    Drag and drop your receipt image, or{' '}
                    <label className="text-cohere-action-blue underline cursor-pointer hover:text-blue-700">
                      browse
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-cohere-muted-slate mt-1">
                    PNG, JPG, WebP up to 10MB
                  </p>
                  
                  {/* Sample presets for quick testing */}
                  <div className="mt-3 pt-2 border-t border-cohere-card-border flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-cohere-muted-slate uppercase">Quick Sample:</span>
                    {sampleReceipts.map((sr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setReceiptUrl(sr.url);
                          setReceiptFileName(`${sr.label}.jpg`);
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-white border border-cohere-hairline text-cohere-slate hover:text-cohere-ink hover:border-black font-body transition-colors"
                      >
                        + {sr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cohere-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill text-xs font-medium text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing...'
                : initialExpense
                ? initialExpense.status === 'rejected'
                  ? 'Resubmit for Review'
                  : 'Save Changes'
                : 'Submit Expense Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
