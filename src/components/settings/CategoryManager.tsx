'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Plus, Tag, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';

export function CategoryManager() {
  const { categories, addCategory, toggleCategoryActive } = useExpenses();
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName, newCatDesc);
    setNewCatName('');
    setNewCatDesc('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-lg border border-cohere-hairline p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Taxonomy & Policy
          </div>
          <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
            <Tag className="w-4 h-4 text-cohere-slate" /> Expense Categories
          </h3>
          <p className="text-xs text-cohere-slate mt-0.5">
            Configure company spend categories available to employees for expense logging.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Add New Category Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="my-4 p-4 rounded-md bg-cohere-soft-stone/70 border border-cohere-hairline space-y-3 animate-in fade-in">
          <div className="font-semibold text-xs text-cohere-ink">Create New Expense Category</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="E.g., Legal & Compliance"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Brief description of allowed items"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-cohere-slate hover:text-cohere-ink font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded-pill bg-cohere-near-black text-white text-xs font-medium font-body"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* Categories List */}
      <div className="mt-4 divide-y divide-cohere-hairline">
        {categories.map((cat) => (
          <div key={cat.id} className="py-3 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-cohere-ink font-display">
                  {cat.name}
                </span>
                {!cat.is_active && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-red-50 text-red-600 border border-red-200">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cohere-muted-slate mt-0.5">
                {cat.description || 'No description provided'}
              </p>
            </div>

            <button
              onClick={() => toggleCategoryActive(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-mono transition-colors ${
                cat.is_active
                  ? 'bg-cohere-pale-green text-cohere-deep-green hover:bg-emerald-100'
                  : 'bg-cohere-soft-stone text-cohere-slate hover:bg-gray-200'
              }`}
            >
              {cat.is_active ? 'Active' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
