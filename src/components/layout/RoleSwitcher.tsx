'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Shield, Users, User, ChevronDown, Check } from 'lucide-react';
import { Profile } from '@/lib/types';

export function RoleSwitcher() {
  const { currentUser, setCurrentUser, profiles } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-cohere-near-black text-white border border-black">
            <Shield className="w-3 h-3 text-cohere-coral" /> Admin (Founder)
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-cohere-deep-green text-white border border-[#004f44]">
            <Users className="w-3 h-3 text-cohere-pale-green" /> Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink border border-cohere-hairline">
            <User className="w-3 h-3 text-cohere-slate" /> Employee
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-pill border border-cohere-hairline bg-white hover:border-cohere-near-black transition-all text-xs font-body"
      >
        <img
          src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + currentUser.name}
          alt={currentUser.name}
          className="w-5 h-5 rounded-full object-cover border border-cohere-hairline"
        />
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-cohere-ink">{currentUser.name}</span>
          <span className="text-cohere-muted-slate text-[11px]">({currentUser.role})</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-cohere-slate" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md border border-cohere-hairline shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-cohere-hairline mb-1">
              <div className="text-[11px] font-mono uppercase text-cohere-muted-slate tracking-wider">
                Simulate User & Role (RLS Scope)
              </div>
              <div className="text-xs text-cohere-ink mt-0.5">
                Switch personas to test real-time data visibility & permissions.
              </div>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {profiles.map((p) => {
                const isSelected = p.id === currentUser.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentUser(p);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-cohere-soft-stone text-cohere-black font-medium'
                        : 'hover:bg-[#f9f9f9] text-cohere-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + p.name}
                        alt={p.name}
                        className="w-7 h-7 rounded-full object-cover border border-cohere-hairline"
                      />
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          {p.name}
                          {isSelected && <Check className="w-3.5 h-3.5 text-cohere-action-blue" />}
                        </div>
                        <div className="text-[11px] text-cohere-muted-slate font-mono">
                          {p.email} {p.team_id ? `· ${p.team_id}` : ''}
                        </div>
                      </div>
                    </div>
                    {getRoleBadge(p.role)}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-cohere-hairline text-[11px] text-cohere-muted-slate px-2">
              Role permissions are strictly enforced on all views, summaries, and approvals.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
