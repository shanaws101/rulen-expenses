'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ExpenseWithDetails } from '@/lib/types';
import { formatCurrency, formatBDT } from '@/lib/currency';
import { ReceiptModal } from './ReceiptModal';
import { ExpenseFormModal } from './ExpenseFormModal';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

interface ExpenseTableProps {
  expenses: ExpenseWithDetails[];
  showFilters?: boolean;
}

export function ExpenseTable({ expenses, showFilters = true }: ExpenseTableProps) {
  const { currentUser, approveExpense, rejectExpense, deleteExpense } = useExpenses();
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseWithDetails | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null);
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Status Badge Component
  const renderStatusBadge = (expense: ExpenseWithDetails) => {
    switch (expense.status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-cohere-pale-green text-cohere-deep-green border border-[#c4ebbe]">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-red-50 text-red-700 border border-red-200">
              <XCircle className="w-3 h-3" /> Rejected
            </span>
            {expense.review_note && (
              <span className="text-[10px] text-red-600 italic max-w-xs line-clamp-1" title={expense.review_note}>
                Note: {expense.review_note}
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#fff8e6] text-[#996500] border border-[#ffe099]">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  const handleConfirmReject = (id: string) => {
    if (!rejectNote.trim()) {
      alert('Please provide a reason or note for rejecting this expense.');
      return;
    }
    rejectExpense(id, rejectNote);
    setRejectingExpenseId(null);
    setRejectNote('');
  };

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
        <FileText className="w-8 h-8 text-cohere-muted-slate mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-cohere-ink font-display">No expenses found</h3>
        <p className="text-xs text-cohere-slate mt-1 max-w-md mx-auto">
          No records match the current filter or your role's visibility scope.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/50 text-[11px] font-mono uppercase text-cohere-slate tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Date & Submitter</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold text-right">Original Amount</th>
                <th className="py-3.5 px-4 font-semibold text-right">Converted (BDT)</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cohere-hairline text-xs font-body">
              {expenses.map((expense) => {
                const isSubmitter = currentUser ? expense.submitted_by === currentUser.id : false;
                const isAdmin = currentUser?.role === 'admin';
                const isManager = currentUser?.role === 'manager';
                const canReview = (isAdmin || (isManager && expense.submitter?.manager_id === currentUser?.id)) && expense.status === 'pending';
                const canEditResubmit = isSubmitter && (expense.status === 'rejected' || expense.status === 'pending');
                const canDelete = isAdmin || (isSubmitter && expense.status === 'pending');

                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-[#fafafa] transition-colors group"
                  >
                    {/* Date & Submitter */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-mono text-[11px] text-cohere-slate font-medium">
                        {expense.expense_date}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <img
                          src={expense.submitter?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (expense.submitter?.name || 'U')}
                          alt={expense.submitter?.name || 'User'}
                          className="w-4 h-4 rounded-full object-cover border border-cohere-hairline"
                        />
                        <span className="font-medium text-cohere-ink truncate max-w-[120px]">
                          {expense.submitter?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-cohere-soft-stone text-cohere-ink border border-cohere-card-border whitespace-nowrap">
                        {expense.category?.name || 'Other'}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="font-medium text-cohere-ink text-xs line-clamp-2">
                        {expense.description}
                      </div>
                      {expense.receipt_url && (
                        <button
                          onClick={() => setSelectedReceipt(expense)}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-cohere-action-blue hover:underline"
                        >
                          <FileText className="w-3 h-3" /> View Receipt
                        </button>
                      )}
                    </td>

                    {/* Original Amount */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="font-mono font-bold text-cohere-ink text-xs">
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                      <div className="text-[10px] font-mono text-cohere-muted-slate uppercase">
                        {expense.currency}
                      </div>
                    </td>

                    {/* Converted Amount (Base BDT) */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="font-mono font-bold text-cohere-black text-xs">
                        {formatBDT(expense.converted_amount_bdt)}
                      </div>
                      {expense.currency === 'USD' && (
                        <div className="text-[10px] font-mono text-cohere-slate" title={`Captured rate: 1 USD = ${expense.exchange_rate} BDT`}>
                          @ {expense.exchange_rate} BDT
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 align-top text-center">
                      {renderStatusBadge(expense)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Review Actions for Pending Items */}
                        {canReview && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              onClick={() => approveExpense(expense.id, 'Approved by reviewer')}
                              className="p-1 rounded-sm bg-cohere-pale-green hover:bg-[#d5f5cb] text-cohere-deep-green border border-[#b4e6aa] transition-colors text-[11px] flex items-center gap-0.5 font-medium px-2"
                              title="Approve expense"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingExpenseId(expense.id)}
                              className="p-1 rounded-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors text-[11px] flex items-center gap-0.5 font-medium px-2"
                              title="Reject expense"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}

                        {/* Resubmit / Edit action for submitter */}
                        {canEditResubmit && (
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-cohere-soft-stone text-cohere-ink hover:bg-cohere-hairline transition-colors"
                            title={expense.status === 'rejected' ? 'Fix and resubmit' : 'Edit entry'}
                          >
                            {expense.status === 'rejected' ? (
                              <>
                                <RotateCcw className="w-3 h-3 text-cohere-coral" /> Resubmit
                              </>
                            ) : (
                              <>
                                <Edit2 className="w-3 h-3 text-cohere-slate" /> Edit
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete button */}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this expense record?')) {
                                deleteExpense(expense.id);
                              }
                            }}
                            className="p-1 rounded text-cohere-muted-slate hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal with Note Prompt */}
      {rejectingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg border border-cohere-hairline shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-display font-bold text-cohere-ink tracking-tight">
              Reject Expense Entry
            </h3>
            <p className="text-xs text-cohere-slate mt-1">
              Please provide a clear note explaining why this expense is rejected so the employee can fix and resubmit.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-mono uppercase text-cohere-slate mb-1">
                Rejection Note / Feedback *
              </label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="E.g., Please attach the official VAT invoice/receipt..."
                required
                className="w-full p-2.5 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectingExpenseId(null);
                  setRejectNote('');
                }}
                className="px-3 py-1.5 rounded-pill text-xs text-cohere-slate hover:text-cohere-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingExpenseId)}
                className="px-4 py-1.5 rounded-pill bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          expense={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Edit/Resubmit Modal */}
      {editingExpense && (
        <ExpenseFormModal
          initialExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </>
  );
}
