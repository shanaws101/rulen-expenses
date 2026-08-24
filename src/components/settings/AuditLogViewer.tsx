'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Activity, ShieldCheck } from 'lucide-react';

export function AuditLogViewer() {
  const { activityLogs, profiles } = useExpenses();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">Created Entry</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-pale-green text-cohere-deep-green border border-emerald-200">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      case 'resubmitted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200">Resubmitted</span>;
      case 'updated_settings':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-50 text-purple-700 border border-purple-200">Settings Changed</span>;
      case 'updated_budget':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">Budget Limit</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-slate">{action}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-cohere-hairline p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Governance & Audit Trail
          </div>
          <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
            <Activity className="w-4 h-4 text-cohere-slate" /> System Activity Log
          </h3>
          <p className="text-xs text-cohere-slate mt-0.5">
            Immutable log of all expense lifecycle events, policy changes, and managerial decisions.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cohere-pale-green text-cohere-deep-green text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Guard Active</span>
        </div>
      </div>

      <div className="mt-4 divide-y divide-cohere-hairline max-h-96 overflow-y-auto">
        {activityLogs.map((log) => {
          const actor = profiles.find((p) => p.id === log.actor_id);
          return (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-cohere-ink">{actor?.name || 'System Actor'}</span>
                  {getActionBadge(log.action)}
                </div>

                {log.details && (
                  <div className="text-[11px] text-cohere-slate font-mono bg-[#fafafa] p-1.5 rounded border border-cohere-hairline">
                    {JSON.stringify(log.details)}
                  </div>
                )}
              </div>

              <div className="text-[11px] font-mono text-cohere-muted-slate whitespace-nowrap text-right">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
