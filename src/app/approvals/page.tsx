'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ApprovalsList } from '@/components/approvals/ApprovalsList';
import { CheckCircle2, Shield } from 'lucide-react';

export default function ApprovalsPage() {
  const { currentUser, pendingApprovals } = useExpenses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-cohere-hairline">
        <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
          Decision Pipeline
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
              Approvals Queue
            </h1>
            <p className="text-xs text-cohere-slate mt-0.5">
              {currentUser.role === 'admin'
                ? 'Review and approve/reject all pending company expenses across departments.'
                : 'Review and approve/reject expense submissions from your assigned team members.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-pill bg-cohere-soft-stone text-xs font-mono text-cohere-ink border border-cohere-hairline">
              Role: <strong className="uppercase">{currentUser.role}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Approvals List */}
      <ApprovalsList />
    </div>
  );
}
