'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { Role } from '@/lib/types';
import { Users, UserPlus, Shield, UserCheck, User } from 'lucide-react';

export function UserManager() {
  const { profiles, addUser, updateUser, currentUser } = useExpenses();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [teamId, setTeamId] = useState('Engineering');
  const [managerId, setManagerId] = useState<string>('');

  const managers = profiles.filter((p) => p.role === 'manager' || p.role === 'admin');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addUser({
      name,
      email,
      role,
      team_id: teamId,
      manager_id: role === 'employee' ? managerId || null : null,
    });

    setName('');
    setEmail('');
    setRole('employee');
    setIsAdding(false);
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-near-black text-white">
            Admin (Founder)
          </span>
        );
      case 'manager':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-deep-green text-white">
            Manager
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cohere-soft-stone text-cohere-ink">
            Employee
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-cohere-hairline p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cohere-hairline">
        <div>
          <div className="text-[10px] font-mono uppercase text-cohere-muted-slate tracking-wider">
            Access Control & Org Hierarchy
          </div>
          <h3 className="text-base font-semibold text-cohere-ink font-display flex items-center gap-2">
            <Users className="w-4 h-4 text-cohere-slate" /> Users & Permissions
          </h3>
          <p className="text-xs text-cohere-slate mt-0.5">
            Manage company team members, assign organizational roles, and configure manager approval scoping.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-medium font-body transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Invite User Form */}
      {isAdding && (
        <form onSubmit={handleAddUser} className="my-4 p-4 rounded-md bg-cohere-soft-stone/70 border border-cohere-hairline space-y-3 animate-in fade-in">
          <div className="font-semibold text-xs text-cohere-ink">Invite & Provision Team Member</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="E.g., Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                Work Email *
              </label>
              <input
                type="email"
                placeholder="alex@rulen.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                System Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="employee">Employee (Submissions only)</option>
                <option value="manager">Manager (Team approvals & spend)</option>
                <option value="admin">Admin / Founder (Full access)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                Team / Department
              </label>
              <input
                type="text"
                placeholder="Engineering, Design, Growth"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {role === 'employee' && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-cohere-slate mb-1">
                  Assign Approving Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-sm border border-cohere-border-light text-xs font-medium text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">None (Routes to Admin)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              Save Member
            </button>
          </div>
        </form>
      )}

      {/* Users Registry Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-cohere-hairline text-[10px] font-mono uppercase text-cohere-slate">
              <th className="py-2.5 px-3">Member</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Team</th>
              <th className="py-2.5 px-3">Approving Manager</th>
              <th className="py-2.5 px-3 text-right">RLS Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cohere-hairline font-body">
            {profiles.map((p) => {
              const mgr = profiles.find((m) => m.id === p.manager_id);
              return (
                <tr key={p.id} className="hover:bg-cohere-soft-stone/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + p.name}
                        alt={p.name}
                        className="w-7 h-7 rounded-full object-cover border border-cohere-hairline"
                      />
                      <div>
                        <div className="font-semibold text-cohere-ink">{p.name}</div>
                        <div className="text-[11px] font-mono text-cohere-muted-slate">{p.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">{getRoleBadge(p.role)}</td>

                  <td className="py-3 px-3 font-mono text-[11px] text-cohere-slate">
                    {p.team_id || 'General'}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-cohere-slate">
                    {p.role === 'admin' ? (
                      <span className="text-cohere-muted-slate italic">Self-governing</span>
                    ) : mgr ? (
                      <span className="font-medium text-cohere-ink">{mgr.name}</span>
                    ) : (
                      <span className="text-cohere-muted-slate">Founders / Admin</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-[10px] uppercase text-cohere-muted-slate">
                    {p.role === 'admin'
                      ? 'Full Company'
                      : p.role === 'manager'
                      ? 'Team Directs'
                      : 'Self Only'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
