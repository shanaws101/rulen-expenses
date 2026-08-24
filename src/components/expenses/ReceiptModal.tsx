'use client';

import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { ExpenseWithDetails } from '@/lib/types';
import { formatCurrency, formatBDT } from '@/lib/currency';

interface ReceiptModalProps {
  expense: ExpenseWithDetails;
  onClose: () => void;
}

export function ReceiptModal({ expense, onClose }: ReceiptModalProps) {
  if (!expense.receipt_url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-lg border border-cohere-hairline shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cohere-hairline bg-cohere-soft-stone/60">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Receipt Document &middot; {expense.category?.name || 'Expense'}
            </div>
            <div className="text-sm font-semibold text-cohere-ink flex items-center gap-2">
              <span>{expense.description}</span>
              <span className="font-mono font-bold text-cohere-deep-green">
                ({formatCurrency(expense.amount, expense.currency)} &middot; {formatBDT(expense.converted_amount_bdt)})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-cohere-slate hover:text-cohere-ink hover:bg-white transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-cohere-slate hover:text-cohere-ink hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex items-center justify-center bg-[#111]">
          <img
            src={expense.receipt_url}
            alt={`Receipt for ${expense.description}`}
            className="max-h-[65vh] object-contain rounded border border-[#333]"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-white border-t border-cohere-hairline flex items-center justify-between text-xs text-cohere-slate font-mono">
          <span>Submitted by: <strong>{expense.submitter?.name}</strong> on {expense.expense_date}</span>
          <span>Status: <strong className="uppercase">{expense.status}</strong></span>
        </div>
      </div>
    </div>
  );
}
