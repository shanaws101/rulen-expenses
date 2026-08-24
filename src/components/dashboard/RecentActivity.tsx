'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { formatCurrency, formatBDT } from '@/lib/currency';
import { CheckCircle2, Clock, XCircle, ArrowUpRight, Activity } from 'lucide-react';
import Link from 'next/link';

export function RecentActivity() {
  const { scopedExpenses, activityLogs, profiles } = useExpenses();

  const recentExpenses = scopedExpenses.slice(0, 5);
  const recentLogs = activityLogs.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-cohere-deep-green" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Submissions */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-cohere-hairline shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Registry
            </div>
            <h3 className="text-base font-semibold text-cohere-ink font-display">
              Recent Expense Submissions
            </h3>
          </div>
          <Link
            href="/expenses"
            className="text-xs font-mono text-cohere-action-blue hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-cohere-hairline mt-2">
          {recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-cohere-muted-slate">
              No recent expense records.
            </div>
          ) : (
            recentExpenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-cohere-soft-stone">
                    {getStatusIcon(exp.status)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-cohere-ink flex items-center gap-2">
                      <span className="truncate max-w-[240px]">{exp.description}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cohere-soft-stone text-cohere-slate">
                        {exp.category?.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-cohere-muted-slate mt-0.5">
                      {exp.submitter?.name} &middot; {exp.expense_date}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-cohere-ink">
                    {formatCurrency(exp.amount, exp.currency)}
                  </div>
                  <div className="text-[10px] text-cohere-slate">
                    ≈ {formatBDT(exp.converted_amount_bdt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Activity Trail */}
      <div className="bg-white p-6 rounded-lg border border-cohere-hairline shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Security
            </div>
            <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-cohere-slate" /> Audit Trail
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cohere-pale-green text-cohere-deep-green">
            Immutable
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {recentLogs.map((log) => {
            const actor = profiles.find((p) => p.id === log.actor_id);
            return (
              <div key={log.id} className="text-xs border-l-2 border-cohere-hairline pl-3 py-1">
                <div className="font-medium text-cohere-ink">
                  <strong>{actor?.name || 'User'}</strong>{' '}
                  <span className="text-cohere-slate font-mono uppercase text-[10px] px-1 rounded bg-cohere-soft-stone">
                    {log.action}
                  </span>
                </div>
                {log.details?.description && (
                  <div className="text-[11px] text-cohere-slate truncate mt-0.5">
                    "{log.details.description}"
                  </div>
                )}
                {log.details?.note && (
                  <div className="text-[11px] text-cohere-slate italic mt-0.5">
                    Note: "{log.details.note}"
                  </div>
                )}
                <div className="text-[10px] font-mono text-cohere-muted-slate mt-0.5">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
