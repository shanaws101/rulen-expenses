'use client';

import React, { useState } from 'react';
import { useExpenses } from '@/lib/store/expense-context';
import { useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import { Shield, ArrowRight, CheckCircle2, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signUpWithEmail, currentUser } = useExpenses();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to home
  React.useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error: err } = await signInWithPassword(email.trim(), password);
        if (err) {
          setError(err.message || 'Invalid email or password. Please check your credentials.');
        } else {
          router.push('/');
        }
      } else {
        if (!fullName.trim()) {
          setError('Please provide your full name.');
          setIsSubmitting(false);
          return;
        }

        const { error: err } = await signUpWithEmail(email.trim(), password, fullName.trim(), role);
        if (err) {
          setError(err.message || 'Could not register account. Please try again.');
        } else {
          setSuccessMessage('Account registered successfully! Signing in...');
          setTimeout(() => {
            router.push('/');
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/logo.png"
            alt="Rulen Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-display font-bold text-cohere-ink tracking-tight">
          {mode === 'signin' ? 'Sign in to Rulen Financials' : 'Create Founder or Team Account'}
        </h2>
        <p className="text-xs text-cohere-slate mt-1">
          Double-entry bookkeeping, multi-currency ledger, approvals & forecasting
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-cohere-hairline sm:px-8 space-y-5">
          {/* Tab toggle */}
          <div className="flex p-1 bg-cohere-soft-stone rounded-sm border border-cohere-card-border">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded text-xs font-semibold font-body transition-all ${
                mode === 'signin'
                  ? 'bg-white text-cohere-ink shadow-sm'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded text-xs font-semibold font-body transition-all ${
                mode === 'signup'
                  ? 'bg-white text-cohere-ink shadow-sm'
                  : 'text-cohere-slate hover:text-cohere-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded bg-cohere-pale-green border border-emerald-200 text-xs text-cohere-deep-green flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                    Account Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="admin">Admin / Founder (Full governance & approvals)</option>
                    <option value="accountant">Certified Accountant (Bookkeeping, GL & Statements)</option>
                    <option value="manager">Manager (Team approvals & spend)</option>
                    <option value="employee">Employee (Submissions only)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@rulen.co"
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-cohere-slate mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-sm border border-cohere-border-light text-xs text-cohere-ink focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-pill bg-cohere-near-black hover:bg-cohere-deep-green text-white text-xs font-semibold font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'signin' ? (
                <span>Sign In</span>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-cohere-muted-slate font-mono">
            Powered by Supabase RLS & Dual Cash/Accrual Ledger
          </div>
        </div>
      </div>
    </div>
  );
}
