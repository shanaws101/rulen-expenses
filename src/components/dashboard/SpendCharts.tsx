'use client';

import React from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { formatBDT } from '@/lib/currency';
import { Layers, Users, TrendingUp } from 'lucide-react';

export function SpendCharts() {
  const { scopedExpenses, categories, profiles, currentUser } = useExpenses();

  // Active / approved expenses for current month
  const activeExpenses = scopedExpenses.filter((e) => e.status !== 'rejected');

  const totalSpentBDT = activeExpenses.reduce((sum, e) => sum + e.converted_amount_bdt, 0);

  // 1. Group by Category
  const categorySpendMap: Record<string, { name: string; amount: number; count: number }> = {};

  categories.forEach((cat) => {
    categorySpendMap[cat.id] = { name: cat.name, amount: 0, count: 0 };
  });

  activeExpenses.forEach((exp) => {
    if (categorySpendMap[exp.category_id]) {
      categorySpendMap[exp.category_id].amount += exp.converted_amount_bdt;
      categorySpendMap[exp.category_id].count += 1;
    }
  });

  const categoryList = Object.values(categorySpendMap)
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 2. Group by Person
  const personSpendMap: Record<string, { profile?: typeof profiles[0]; amount: number; count: number }> = {};

  activeExpenses.forEach((exp) => {
    const pId = exp.submitted_by;
    if (!personSpendMap[pId]) {
      const p = profiles.find((prof) => prof.id === pId);
      personSpendMap[pId] = { profile: p, amount: 0, count: 0 };
    }
    personSpendMap[pId].amount += exp.converted_amount_bdt;
    personSpendMap[pId].count += 1;
  });

  const personList = Object.values(personSpendMap).sort((a, b) => b.amount - a.amount);

  // Color palette for breakdown bars
  const colors = [
    '#003c33', // deep green
    '#1863dc', // action blue
    '#ff7759', // coral
    '#17171c', // near black
    '#9b60aa', // violet
    '#75758a', // slate
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Spend Distribution */}
      <div className="bg-white p-6 rounded-lg border border-cohere-hairline shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              Allocation
            </div>
            <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-cohere-slate" /> Spend by Category
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-cohere-black">
            {formatBDT(totalSpentBDT)} Total
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {categoryList.length === 0 ? (
            <div className="py-8 text-center text-xs text-cohere-muted-slate">
              No category expense activity to report.
            </div>
          ) : (
            categoryList.map((cat, idx) => {
              const pct = totalSpentBDT > 0 ? Math.round((cat.amount / totalSpentBDT) * 100) : 0;
              const barColor = colors[idx % colors.length];

              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: barColor }}
                      />
                      <span className="font-medium text-cohere-ink">{cat.name}</span>
                      <span className="text-[11px] text-cohere-muted-slate font-mono">
                        ({cat.count} {cat.count === 1 ? 'item' : 'items'})
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="font-bold text-cohere-ink">{formatBDT(cat.amount)}</span>
                      <span className="text-cohere-slate ml-1.5 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-cohere-soft-stone rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Person Spend Breakdown (Admin/Manager view) */}
      <div className="bg-white p-6 rounded-lg border border-cohere-hairline shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
          <div>
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
              {currentUser?.role === 'admin' ? 'Company Team' : 'Managed Team'}
            </div>
            <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-cohere-slate" /> Spend by Person
            </h3>
          </div>
          <span className="text-xs font-mono text-cohere-muted-slate">
            {personList.length} Active {personList.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>

        <div className="mt-5 divide-y divide-cohere-hairline">
          {personList.length === 0 ? (
            <div className="py-8 text-center text-xs text-cohere-muted-slate">
              No team spending records found.
            </div>
          ) : (
            personList.map((item) => {
              const pct = totalSpentBDT > 0 ? Math.round((item.amount / totalSpentBDT) * 100) : 0;
              const name = item.profile?.name || 'Unknown';
              const role = item.profile?.role || 'employee';

              return (
                <div key={item.profile?.id || name} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.profile?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + name}
                      alt={name}
                      className="w-8 h-8 rounded-full object-cover border border-cohere-hairline"
                    />
                    <div>
                      <div className="text-xs font-semibold text-cohere-ink flex items-center gap-1.5">
                        {name}
                        {currentUser && item.profile?.id === currentUser.id && (
                          <span className="text-[10px] font-mono uppercase px-1 rounded bg-cohere-soft-stone text-cohere-slate">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-cohere-muted-slate">
                        {item.profile?.team_id || 'Team'} &middot; {item.count} submissions
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-cohere-ink">
                      {formatBDT(item.amount)}
                    </div>
                    <div className="text-[10px] text-cohere-slate">
                      {pct}% of total
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
