'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { calculateForecast, calculateCashBurnMetrics } from '@/lib/accounting';
import { formatBDT } from '@/lib/currency';
import {
  TrendingUp,
  RotateCw,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  CreditCard,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function ForecastPage() {
  const { recurringItems, scopedExpenses, journalEntries, accounts, isLoading } = useExpenses();
  const [projectionHorizon, setProjectionHorizon] = useState<3 | 6 | 12>(6);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Generating forecast model...</p>
      </div>
    );
  }

  // Calculate Cash Burn & Runway
  const burnMetrics = calculateCashBurnMetrics(journalEntries, scopedExpenses, accounts);
  const forecast = calculateForecast(
    recurringItems,
    scopedExpenses,
    burnMetrics.currentCashBalanceBDT,
    projectionHorizon
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Predictive Cash Model
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Financial Forecast & Runway
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Model forward-looking cash depletion based on active subscriptions, hosting contracts, and trailing non-recurring operational spend.
          </p>
        </div>

        {/* Projection Horizon Tabs */}
        <div className="flex items-center p-1 bg-cohere-soft-stone rounded-pill border border-cohere-card-border">
          <button
            onClick={() => setProjectionHorizon(3)}
            className={`px-3 py-1.5 rounded-pill text-xs font-mono font-semibold transition-all ${
              projectionHorizon === 3
                ? 'bg-white text-cohere-ink shadow-xs font-bold'
                : 'text-cohere-slate hover:text-cohere-ink'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setProjectionHorizon(6)}
            className={`px-3 py-1.5 rounded-pill text-xs font-mono font-semibold transition-all ${
              projectionHorizon === 6
                ? 'bg-white text-cohere-ink shadow-xs font-bold'
                : 'text-cohere-slate hover:text-cohere-ink'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => setProjectionHorizon(12)}
            className={`px-3 py-1.5 rounded-pill text-xs font-mono font-semibold transition-all ${
              projectionHorizon === 12
                ? 'bg-white text-cohere-ink shadow-xs font-bold'
                : 'text-cohere-slate hover:text-cohere-ink'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Runway Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Current Cash Balance</div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(burnMetrics.currentCashBalanceBDT)}
          </div>
          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
            Net Liquid: {formatBDT(burnMetrics.netLiquidCashBDT)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">Monthly Projected Burn</div>
          <div className="text-2xl font-bold font-mono text-cohere-coral mt-1">
            {formatBDT(forecast.projectedMonthlySpendBDT)}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            Recurring + Run-rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate">
            Projected Total Spend ({projectionHorizon}M)
          </div>
          <div className="text-2xl font-bold font-mono text-cohere-ink mt-1">
            {formatBDT(forecast.projectedTotalSpendBDT)}
          </div>
          <div className="text-[10px] font-mono text-cohere-slate mt-0.5">
            Over next {projectionHorizon} months
          </div>
        </div>

        <div className="bg-cohere-near-black text-white p-5 rounded-lg border border-black shadow-sm">
          <div className="text-[10px] font-mono uppercase text-cohere-soft-coral">Estimated Runway</div>
          <div className="text-3xl font-bold font-mono text-white mt-1">
            {forecast.projectedRunwayMonths >= 99
              ? 'Infinite'
              : `${forecast.projectedRunwayMonths.toFixed(1)} Months`}
          </div>
          <div className="text-[10px] font-mono text-gray-300 mt-0.5">
            Until zero cash depletion
          </div>
        </div>
      </div>

      {/* Projection Timeline Table */}
      <div className="bg-white border border-cohere-hairline rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-cohere-hairline bg-cohere-soft-stone/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cohere-deep-green" />
            <h3 className="font-semibold text-xs text-cohere-ink font-body">
              Month-by-Month Projected Cash Trajectory
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cohere-slate">
            Base Currency: BDT (৳)
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-cohere-hairline bg-cohere-soft-stone/50 text-[10px] font-mono uppercase text-cohere-slate">
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4 text-right">Starting Cash</th>
              <th className="py-3 px-4 text-right">Recurring Subscriptions</th>
              <th className="py-3 px-4 text-right">Baseline Operations</th>
              <th className="py-3 px-4 text-right">Projected Burn</th>
              <th className="py-3 px-4 text-right">Ending Cash Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cohere-hairline font-mono">
            {forecast.monthsList.map((p, idx) => {
              const isNegative = p.endingCashBDT < 0;
              return (
                <tr key={idx} className="hover:bg-cohere-soft-stone/20 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-cohere-ink">
                    {p.month}
                  </td>

                  <td className="py-3.5 px-4 text-right text-cohere-slate">
                    {formatBDT(p.startingCashBDT)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-cohere-ink">
                    {formatBDT(p.recurringSpendBDT)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-cohere-slate">
                    {formatBDT(p.variableSpendBDT)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-cohere-coral">
                    -{formatBDT(p.totalSpendBDT)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-sm">
                    <span className={isNegative ? 'text-red-600' : 'text-cohere-deep-green'}>
                      {formatBDT(p.endingCashBDT)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Breakdown Details & Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg border border-cohere-hairline shadow-sm space-y-3">
          <h3 className="font-semibold text-xs text-cohere-ink font-body flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-cohere-slate" /> Recurring Subscriptions & Hosting Seed
          </h3>
          <p className="text-xs text-cohere-slate">
            Forecast includes {recurringItems.length} active recurring contracts (Vercel, Supabase, Cloudflare, AI APIs).
          </p>
          <Link
            href="/renewals"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cohere-action-blue hover:underline"
          >
            Manage Recurring Contracts & Renewals &rarr;
          </Link>
        </div>

        <div className="bg-amber-50/60 p-5 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Forecasting Methodology & Disclaimer</span>
          </div>
          <p className="text-[11px] leading-relaxed font-body">
            Projections are modeled on recurring contracts and trailing run-rate history, not a guarantee. All company inflows originate from founder equity injections. Adjust founder capital contributions as needed to maintain adequate runway.
          </p>
        </div>
      </div>
    </div>
  );
}
