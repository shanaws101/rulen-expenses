import type { Metadata } from 'next';
import './globals.css';
import { ExpenseProvider } from '@/lib/store/expense-context';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Rulen Financials — Remote Double-Entry Bookkeeping & Runway Ops',
  description:
    'Multi-currency double-entry ledger, accounts payable, founder equity contributions, forecasting, and CPA financial reporting for remote teams.',
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
      <body className="min-h-full bg-white text-cohere-ink antialiased">
        <ExpenseProvider>
          <AppLayout>{children}</AppLayout>
        </ExpenseProvider>
      </body>
    </html>
  );
}
