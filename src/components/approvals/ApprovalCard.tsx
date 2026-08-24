'use client';

import React, { useState } from 'react';
import { ExpenseWithDetails } from '@/lib/types';
import { formatCurrency, formatBDT } from '@/lib/currency';
import { useExpenses } from '@/lib/store/expense-context';
import { ReceiptModal } from '../expenses/ReceiptModal';
import { Check, X, FileText, Calendar, Building, ArrowRight, User } from 'lucide-react';

interface ApprovalCardProps {
  expense: ExpenseWithDetails;
}

export function ApprovalCard({ expense }: ApprovalCardProps) {
  const { approveExpense, rejectExpense } = useExpenses();
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = () => {
    setIsApproving(true);
    approveExpense(expense.id, 'Approved');
    setIsApproving(false);
  };

  const handleReject = () => {
    if (!rejectNote.trim()) {
      alert('Please provide a reason or note for rejecting this expense.');
      return;
    }
    rejectExpense(expense.id, rejectNote);
    setIsRejecting(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-cohere-hairline p-5 shadow-sm hover:border-cohere-near-black transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cohere-hairline">
          {/* Submitter details */}
          <div className="flex items-center gap-3">
            <img
              src={expense.submitter?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (expense.submitter?.name || 'U')}
              alt={expense.submitter?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-cohere-hairline"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-cohere-ink font-display">
                  {expense.submitter?.name || 'Team Member'}
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-slate border border-cohere-card-border">
                  {expense.submitter?.team_id || 'Team Member'}
                </span>
              </div>
              <div className="text-[11px] text-cohere-muted-slate font-mono flex items-center gap-2 mt-0.5">
                <span>{expense.submitter?.email}</span>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {expense.expense_date}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="text-right bg-cohere-soft-stone/60 px-4 py-2 rounded-sm border border-cohere-card-border">
            <div className="text-base font-bold font-mono text-cohere-ink">
              {formatCurrency(expense.amount, expense.currency)}
            </div>
            <div className="text-[11px] font-mono text-cohere-deep-green font-semibold">
              ≈ {formatBDT(expense.converted_amount_bdt)} (Base BDT)
            </div>
            {expense.currency === 'USD' && (
              <div className="text-[10px] font-mono text-cohere-muted-slate">
                Rate: 1 USD = {expense.exchange_rate} BDT
              </div>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="py-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cohere-slate">Category:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-cohere-near-black text-white">
              {expense.category?.name || 'General'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cohere-slate block mb-1">
              Business Justification:
            </span>
            <p className="text-xs text-cohere-ink font-body leading-relaxed bg-[#fafafa] p-3 rounded border border-cohere-hairline">
              {expense.description}
            </p>
          </div>

          {/* Receipt Attachment preview */}
          {expense.receipt_url && (
            <div className="pt-2">
              <button
                onClick={() => setIsReceiptOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono bg-cohere-pale-blue text-cohere-action-blue hover:bg-blue-100 transition-colors border border-[#d2e0fc]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Attached Receipt Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-cohere-hairline flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cohere-muted-slate">
            Status: <strong className="text-amber-600">Pending Review</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRejecting(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-pill text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject with Note</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-pill text-xs font-medium text-white bg-cohere-deep-green hover:bg-[#004f44] transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-display font-bold text-cohere-ink">
              Reject Expense Submission
            </h3>
            <p className="text-xs text-cohere-slate mt-1">
              Explain why this expense from <strong>{expense.submitter?.name}</strong> cannot be approved (e.g. missing receipt, out of policy).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
                Reason / Feedback Note *
              </label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="E.g., Please provide the tax invoice with company name..."
                required
                className="w-full p-2.5 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-cohere-hairline">
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(false);
                  setRejectNote('');
                }}
                className="px-3 py-1.5 rounded-pill text-xs text-cohere-slate hover:text-cohere-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-1.5 rounded-pill bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && (
        <ReceiptModal
          expense={expense}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </>
  );
}
