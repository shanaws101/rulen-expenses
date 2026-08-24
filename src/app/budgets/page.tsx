'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { BudgetMeter } from '@/components/budgets/BudgetMeter';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { Budget, Category } from '@/lib/types';
import { convertToBDT, formatBDT } from '@/lib/currency';
import { Plus, PieChart, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, categories, scopedExpenses, settings, currentUser, deleteBudget } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const currentMonth = new Date().toISOString().substring(0, 7);

  // Active non-rejected expenses for current month
  const currentExpenses = scopedExpenses.filter(
    (e) => e.expense_date.startsWith(currentMonth) && e.status !== 'rejected'
  );

  // Calculate spend per category in BDT
  const categorySpendMap = new Map<string, number>();
  currentExpenses.forEach((exp) => {
    const current = categorySpendMap.get(exp.category_id) || 0;
    categorySpendMap.set(exp.category_id, current + exp.converted_amount_bdt);
  });

  // Calculate overall metrics
  const totalBudgetBDT = budgets.reduce((sum, b) => {
    return sum + convertToBDT(b.limit_amount, b.limit_currency, settings.default_exchange_rate);
  }, 0);

  const totalSpentBDT = currentExpenses.reduce((sum, e) => sum + e.converted_amount_bdt, 0);
  const overallPercentage = totalBudgetBDT > 0 ? Math.round((totalSpentBDT / totalBudgetBDT) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Fiscal Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
            Category Budgets & Limits
          </h1>
          <p className="text-xs text-cohere-slate mt-0.5">
            Monitor spend velocity against predefined monthly category allocations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
          </button>
        )}
      </div>

      {/* Aggregate Budget Health Banner */}
      <div className="bg-cohere-near-black text-white p-6 rounded-lg border border-black shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase text-cohere-soft-coral tracking-wider">
            Overall Month Allocation (Aug 2026)
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold">
            {formatBDT(totalSpentBDT)}{' '}
            <span className="text-sm font-normal text-gray-400">/ {formatBDT(totalBudgetBDT)} limit</span>
          </div>
          <p className="text-xs text-gray-300 font-body">
            Combined spend across {budgets.length} budgeted categories converted to base currency BDT.
          </p>
        </div>

        <div className="min-w-[200px] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-300">Total Utilization</span>
            <span className="font-bold text-white">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-[#333] h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100
                  ? 'bg-red-500'
                  : overallPercentage > 80
                  ? 'bg-cohere-coral'
                  : 'bg-cohere-pale-green'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Category Budget Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {budgets.map((budget) => {
          const category = categories.find((c) => c.id === budget.category_id) || {
            id: budget.category_id,
            name: 'Unassigned Category',
            description: '',
            is_active: true,
            created_at: '',
          };
          const spent = categorySpendMap.get(budget.category_id) || 0;

          return (
            <BudgetMeter
              key={budget.id}
              budget={budget}
              category={category}
              spentBDT={spent}
              onEdit={(b) => {
                setEditingBudget(b);
                setIsModalOpen(true);
              }}
              onDelete={(id) => {
                if (confirm('Remove this category budget?')) {
                  deleteBudget(id);
                }
              }}
            />
          );
        })}
      </div>

      {/* Budget Modal */}
      {isModalOpen && (
        <BudgetModal
          editingBudget={editingBudget}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
