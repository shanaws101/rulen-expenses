'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ApprovalCard } from './ApprovalCard';
import { CheckCircle2, Inbox, Shield, Users } from 'lucide-react';

export function ApprovalsList() {
  const { currentUser, pendingApprovals, approveExpense } = useExpenses();

  const handleApproveAll = () => {
    if (confirm(`Approve all ${pendingApprovals.length} pending expense submissions in this queue?`)) {
      pendingApprovals.forEach((exp) => {
        approveExpense(exp.id, 'Batch approved by reviewer');
      });
    }
  };

  if (currentUser.role === 'employee') {
    return (
      <div className="p-8 bg-white border border-cohere-hairline rounded-lg text-center">
        <Shield className="w-8 h-8 text-cohere-slate mx-auto mb-2 opacity-60" />
        <h3 className="text-sm font-semibold text-cohere-ink font-display">Approval Queue Restricted</h3>
        <p className="text-xs text-cohere-slate mt-1 max-w-sm mx-auto">
          As an employee, your submitted expenses are reviewed by your designated manager or company founders.
        </p>
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
        <CheckCircle2 className="w-10 h-10 text-cohere-deep-green mx-auto mb-3" />
        <h3 className="text-base font-semibold text-cohere-ink font-display">
          All caught up! No pending approvals.
        </h3>
        <p className="text-xs text-cohere-slate mt-1 max-w-md mx-auto">
          {currentUser.role === 'admin'
            ? 'There are no pending expense submissions requiring executive approval across the company.'
            : 'All expenses from your managed team members have been reviewed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Queue summary toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-cohere-soft-stone/70 border border-cohere-hairline rounded-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-mono text-cohere-ink">
            <strong>{pendingApprovals.length}</strong> pending item{pendingApprovals.length === 1 ? '' : 's'} awaiting your decision ({currentUser.role === 'admin' ? 'Company-wide' : 'Team Scoped'})
          </span>
        </div>

        {pendingApprovals.length > 1 && (
          <button
            onClick={handleApproveAll}
            className="px-3.5 py-1.5 rounded-pill text-xs font-medium font-body bg-cohere-deep-green text-white hover:bg-[#004f44] transition-colors"
          >
            Approve All ({pendingApprovals.length})
          </button>
        )}
      </div>

      {/* Cards list */}
      <div className="space-y-4">
        {pendingApprovals.map((exp) => (
          <ApprovalCard key={exp.id} expense={exp} />
        ))}
      </div>
    </div>
  );
}
