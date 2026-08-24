'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { X, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const { settings } = useExpenses();

  if (!visible) return null;

  return (
    <aside aria-label="Announcement" className="w-full bg-cohere-black text-white text-[13px] py-2 px-4 border-b border-[#222]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#222] text-cohere-soft-coral border border-[#333]">
            LIVE RATE
          </span>
          <span className="text-gray-300 font-body">
            1 USD = <strong className="text-white font-mono">{settings.default_exchange_rate.toFixed(2)} BDT</strong> &middot; Multi-Currency Scoped Engine active.
          </span>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-white underline underline-offset-4 hover:text-cohere-soft-coral transition-colors font-medium ml-1"
          >
            Manage exchange rate <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
