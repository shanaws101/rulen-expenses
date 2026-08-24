'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { ApprovalsList } from '@/components/approvals/ApprovalsList';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function ApprovalsPage() {
  const { currentUser, isLoading } = useExpenses();

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading approvals queue...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold font-display text-cohere-ink">Sign In Required</h2>
        <p className="text-xs text-cohere-slate">Please sign in with your manager or admin account to access the approvals queue.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-semibold">
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

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
