'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, CheckCircle2, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { profiles, setCurrentUser, currentUser } = useExpenses();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const match = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
      if (match) {
        setCurrentUser(match);
        router.push('/');
      } else {
        // Allow login as demo user if email unknown
        setError('No existing demo profile matched that email. Use one of the fast demo personas below.');
        setIsSubmitting(false);
      }
    }, 400);
  };

  const handleSelectPersona = (p: typeof profiles[0]) => {
    setCurrentUser(p);
    router.push('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-sm bg-cohere-near-black text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">
          R
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-cohere-ink tracking-tight">
          Sign in to Rulen Expenses
        </h2>
        <p className="text-xs text-cohere-slate mt-1">
          Remote financial operations, multi-currency ledger & approvals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-cohere-hairline sm:px-8 space-y-6">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@rulen.co"
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In with Supabase Auth'}
            </button>
          </form>

          {/* Persona Demo Fast-Launch */}
          <div className="pt-4 border-t border-cohere-hairline">
            <div className="text-[10px] font-mono uppercase text-cohere-muted-slate text-center mb-3 tracking-wider">
              Or Fast-Sign In As A Persona (RLS Test)
            </div>

            <div className="space-y-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p)}
                  className="w-full flex items-center justify-between p-2.5 rounded border border-cohere-hairline hover:border-cohere-near-black hover:bg-cohere-soft-stone/50 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + p.name}
                      alt={p.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-semibold text-cohere-ink">{p.name}</div>
                      <div className="text-[10px] font-mono text-cohere-muted-slate">{p.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cohere-soft-stone text-cohere-slate">
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
