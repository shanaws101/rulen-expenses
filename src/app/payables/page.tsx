'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { formatBDT } from '@/lib/currency';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Search,
  Check,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function AccountsPayablePage() {
  const { unpaidPayables, markExpenseAsPaid, currentUser, isLoading } = useExpenses();
  const [settlingExpenseId, setSettlingExpenseId] = useState<string | null>(null);
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading Accounts Payable...</p>
      </div>
    );
  }

  const isFinancialUser = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  if (!isFinancialUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white p-8 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
        <Lock className="w-8 h-8 text-cohere-muted-slate mx-auto" />
        <h2 className="text-xl font-display font-bold text-cohere-ink">Access Restricted</h2>
        <p className="text-xs text-cohere-slate">
          Accounts Payable management is reserved for company administrators and certified accountants.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const filteredPayables = useMemo(() => {
    return unpaidPayables.filter((exp) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchSubmitter = exp.submitter?.name.toLowerCase().includes(q);
        const matchCat = exp.category?.name.toLowerCase().includes(q);
        if (!matchDesc && !matchSubmitter && !matchCat) return false;
      }
      return true;
    });
  }, [unpaidPayables, search]);

  const totalPayablesBDT = unpaidPayables.reduce((sum, e) => sum + e.converted_amount_bdt, 0);
  const overdueCount = unpaidPayables.filter((e) => e.due_date && e.due_date < today).length;

  const handleConfirmSettle = async (expenseId: string) => {
    setIsSubmitting(true);
    try {
      await markExpenseAsPaid(expenseId, settleDate);
      setSettlingExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to settle payable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Short-Term Operational Obligations
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Accounts Payable (AP)
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Manage approved unpaid invoices and vendor bills. Marking an invoice paid automatically posts a debit to Accounts Payable and credit to Cash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-pill bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-semibold">
            {unpaidPayables.length} Unpaid Obligations
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Total Outstanding Payables</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(totalPayablesBDT)}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            Accrued in General Ledger under 2010
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Overdue Invoices</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {overdueCount} {overdueCount === 1 ? 'Bill' : 'Bills'}
          </div>
          <div className="text-[10px] font-mono text-amber-600 mt-0.5">
            {overdueCount > 0 ? 'Past agreed payment due date' : 'All bills within payment terms'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Automated Settlement</div>
          <div className="text-xs text-cohere-ink font-body mt-1">
            Marking an expense paid sets the cash settlement date and clears the liability balance.
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-cohere-hairline shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-cohere-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payable vendor, description, submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Payables List */}
      {filteredPayables.length === 0 ? (
        <div className="py-16 text-center bg-white border border-cohere-hairline rounded-lg">
          <CheckCircle2 className="w-10 h-10 text-cohere-deep-green mx-auto mb-3" />
          <h3 className="text-base font-semibold text-cohere-ink font-display">
            Zero Unpaid Payables!
          </h3>
          <p className="text-xs text-cohere-slate mt-1 max-w-sm mx-auto">
            All approved operational expenses and contractor invoices have been fully settled and paid.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/40 text-[10px] font-mono uppercase text-cohere-slate tracking-wider">
                <th className="py-3 px-4">Invoice / Description</th>
                <th className="py-3 px-4">Submitter</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Amount (Original)</th>
                <th className="py-3 px-4 text-right">Converted (BDT)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cohere-hairline font-body">
              {filteredPayables.map((exp) => {
                const isOverdue = exp.due_date && exp.due_date < today;
                const isSettling = settlingExpenseId === exp.id;

                return (
                  <React.Fragment key={exp.id}>
                    <tr className="hover:bg-cohere-soft-stone/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-cohere-ink">{exp.description}</div>
                        <div className="text-[10px] font-mono text-cohere-muted-slate">
                          Incurred: {exp.expense_date}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-cohere-slate">
                        {exp.submitter?.name || 'Team Member'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cohere-soft-stone text-cohere-ink">
                          {exp.category?.name || 'Operational'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {exp.due_date ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                              isOverdue
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" /> {exp.due_date}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-cohere-muted-slate">No due date set</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-cohere-slate">
                        {exp.currency === 'USD' ? `$${Number(exp.amount).toFixed(2)}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cohere-ink text-sm">
                        {formatBDT(exp.converted_amount_bdt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSettlingExpenseId(isSettling ? null : exp.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-[11px] font-medium font-body transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark as Paid</span>
                        </button>
                      </td>
                    </tr>

                    {/* Inline Settlement Panel */}
                    {isSettling && (
                      <tr className="bg-emerald-50/50 border-y border-emerald-200">
                        <td colSpan={7} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="font-semibold text-xs text-cohere-deep-green flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-cohere-deep-green" /> Settle Invoice & Post Cash Outflow
                              </div>
                              <div className="text-[11px] font-mono text-cohere-slate">
                                Posts Journal Entry: <strong>Debit Accounts Payable</strong> (-Liability) & <strong>Credit Cash / Bank</strong> (-Asset).
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-cohere-slate">Paid Date:</span>
                                <input
                                  type="date"
                                  value={settleDate}
                                  onChange={(e) => setSettleDate(e.target.value)}
                                  className="px-2.5 py-1 text-xs border border-cohere-border-light rounded bg-white font-mono"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setSettlingExpenseId(null)}
                                className="px-3 py-1 text-xs text-cohere-slate hover:text-cohere-ink"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleConfirmSettle(exp.id)}
                                className="px-4 py-1.5 rounded-pill bg-cohere-deep-green text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                              >
                                {isSubmitting ? 'Settling...' : 'Confirm Cash Payment'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
