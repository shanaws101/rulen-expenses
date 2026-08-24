import type { Metadata } from 'next';
import './globals.css';
import { ExpenseProvider } from '@/lib/store/expense-context';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Rulen Expenses — Remote Expense Intelligence & Approval Ops',
  description:
    'Multi-currency expense tracker, approvals queue, budgeting, and financial reporting for remote teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white selection:bg-cohere-soft-coral selection:text-black">
        <ExpenseProvider>
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="mt-auto border-t border-cohere-hairline py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-cohere-muted-slate">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cohere-deep-green" />
                <span>Rulen Remote Operations &middot; Base BDT Multi-Currency Core</span>
              </div>
              <div>
                <span>Powered by Supabase RLS &middot; Cohere Enterprise Design</span>
              </div>
            </div>
          </footer>
        </ExpenseProvider>
      </body>
    </html>
  );
}
