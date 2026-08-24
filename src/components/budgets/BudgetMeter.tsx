'use client';

import React from 'react';
import { Budget, Category } from '@/lib/types';
import { convertToBDT, formatBDT, formatCurrency } from '@/lib/currency';
import { useExpenses } from '@/lib/store/expense-context';
import { AlertCircle, AlertTriangle, CheckCircle, Edit3, Trash2 } from 'lucide-react';

interface BudgetMeterProps {
  budget: Budget;
  category: Category;
  spentBDT: number;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
}

export function BudgetMeter({
  budget,
  category,
  spentBDT,
  onEdit,
  onDelete,
}: BudgetMeterProps) {
  const { settings, currentUser } = useExpenses();
  const isAdmin = currentUser?.role === 'admin';

  // Budget limit converted to BDT
  const budgetLimitBDT = convertToBDT(
    budget.limit_amount,
    budget.limit_currency,
    settings.default_exchange_rate
  );

  const percentage = budgetLimitBDT > 0 ? Math.min(Math.round((spentBDT / budgetLimitBDT) * 100), 999) : 0;
  const remainingBDT = budgetLimitBDT - spentBDT;
  const isOverBudget = spentBDT > budgetLimitBDT;
  const isWarning = percentage >= 80 && !isOverBudget;

  // Status color logic based on Cohere design system
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-600';
    if (isWarning) return 'bg-cohere-coral';
    return 'bg-cohere-deep-green';
  };

  const getStatusBadge = () => {
    if (isOverBudget) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3" /> Over Budget ({percentage}%)
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3" /> Near Limit ({percentage}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-pale-green text-cohere-deep-green border border-[#c6e9be]">
        <CheckCircle className="w-3 h-3" /> On Track ({percentage}%)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-cohere-hairline p-5 shadow-sm hover:border-cohere-near-black transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-cohere-ink font-display">
              {category.name}
            </h4>
            {getStatusBadge()}
          </div>
          <p className="text-[11px] text-cohere-muted-slate mt-0.5">
            {category.description || 'Category budget'} &middot; {budget.period === 'month' ? 'Monthly' : 'Annual'} Limit
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(budget)}
                className="p-1 rounded text-cohere-slate hover:text-cohere-ink hover:bg-cohere-soft-stone transition-colors"
                title="Edit Budget Limit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(budget.id)}
                className="p-1 rounded text-cohere-slate hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete Budget"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Figures Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-cohere-hairline mb-3 font-mono">
        <div>
          <div className="text-[10px] uppercase text-cohere-muted-slate">Current Spend (BDT)</div>
          <div className="text-sm font-bold text-cohere-ink">{formatBDT(spentBDT)}</div>
        </div>

        <div>
          <div className="text-[10px] uppercase text-cohere-muted-slate">Budget Limit</div>
          <div className="text-sm font-bold text-cohere-slate">
            {formatCurrency(budget.limit_amount, budget.limit_currency)}
          </div>
          {budget.limit_currency === 'USD' && (
            <div className="text-[9px] text-cohere-muted-slate">
              ≈ {formatBDT(budgetLimitBDT)}
            </div>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase text-cohere-muted-slate">
            {isOverBudget ? 'Over Budget By' : 'Remaining Budget'}
          </div>
          <div
            className={`text-sm font-bold ${
              isOverBudget ? 'text-red-600' : 'text-cohere-deep-green'
            }`}
          >
            {isOverBudget ? `+${formatBDT(Math.abs(remainingBDT))}` : formatBDT(remainingBDT)}
          </div>
        </div>
      </div>

      {/* Progress Bar Meter */}
      <div>
        <div className="flex justify-between text-[11px] font-mono text-cohere-slate mb-1">
          <span>Utilization</span>
          <span className="font-bold text-cohere-ink">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-cohere-soft-stone rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
