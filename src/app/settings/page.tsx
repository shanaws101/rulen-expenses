'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { CategoryManager } from '@/components/settings/CategoryManager';
import { ExchangeRateManager } from '@/components/settings/ExchangeRateManager';
import { UserManager } from '@/components/settings/UserManager';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { Settings, Shield, Lock, Coins, Tag, Users, Activity, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { currentUser, isLoading } = useExpenses();
  const [activeTab, setActiveTab] = useState<'categories' | 'rates' | 'users' | 'audit'>('rates');

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-cohere-near-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-cohere-muted-slate">Loading system settings...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold font-display text-cohere-ink">Sign In Required</h2>
        <p className="text-xs text-cohere-slate">Please sign in with your admin account to access settings.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-pill bg-cohere-near-black text-white text-xs font-semibold">
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white p-8 rounded-lg border border-cohere-hairline shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display font-bold text-cohere-ink tracking-tight">
          Admin Settings Restricted
        </h2>
        <p className="text-xs text-cohere-slate leading-relaxed">
          You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role}). Only company founders and administrators can configure categories, default exchange rates, and user roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-cohere-hairline">
        <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
          System Administration
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
              Company Settings & Governance
            </h1>
            <p className="text-xs text-cohere-slate mt-0.5">
              Administer system-wide exchange rates, spend taxonomy, team permissions, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cohere-near-black text-white text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-cohere-coral" />
            <span>Admin Clearance: {currentUser.name}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cohere-hairline space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rates')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-body font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rates'
              ? 'border-cohere-near-black text-cohere-black font-semibold'
              : 'border-transparent text-cohere-slate hover:text-cohere-ink'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Exchange Rate</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-body font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-cohere-near-black text-cohere-black font-semibold'
              : 'border-transparent text-cohere-slate hover:text-cohere-ink'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categories</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-body font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-cohere-near-black text-cohere-black font-semibold'
              : 'border-transparent text-cohere-slate hover:text-cohere-ink'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-body font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-cohere-near-black text-cohere-black font-semibold'
              : 'border-transparent text-cohere-slate hover:text-cohere-ink'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'rates' && <ExchangeRateManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'users' && <UserManager />}
        {activeTab === 'audit' && <AuditLogViewer />}
      </div>
    </div>
  );
}
