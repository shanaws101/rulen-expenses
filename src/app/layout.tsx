import type { Metadata } from 'next';
import './globals.css';
import { ExpenseProvider } from '@/lib/store/expense-context';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Rulen Expenses — Remote Expense Intelligence & Approval Ops',
  description:
    'Multi-currency expense tracker, approvals queue, budgeting, and financial reporting for remote teams.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
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
        <Analytics />
      </body>
    </html>
  );
}
