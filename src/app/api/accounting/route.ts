import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_ACCOUNTS, verifyJournalBalance } from '@/lib/accounting';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ accounts: INITIAL_ACCOUNTS, journalEntries: [], contributions: [], recurringItems: [] });
    }

    // Fetch Accounts
    let { data: accounts } = await supabase.from('accounts').select('*').order('code');
    if (!accounts || accounts.length === 0) {
      // Seed accounts
      await supabase.from('accounts').upsert(INITIAL_ACCOUNTS);
      const { data: fresh } = await supabase.from('accounts').select('*').order('code');
      accounts = fresh || INITIAL_ACCOUNTS;
    }

    // Fetch Journal Entries with Lines
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('*, lines:journal_lines(*)')
      .order('entry_date', { ascending: false });

    // Fetch Capital Contributions
    const { data: contributions } = await supabase
      .from('capital_contributions')
      .select('*')
      .order('contribution_date', { ascending: false });

    // Fetch Recurring Items
    const { data: recurringItems } = await supabase
      .from('recurring_items')
      .select('*')
      .order('next_due_date', { ascending: true });

    return NextResponse.json({
      accounts: accounts || INITIAL_ACCOUNTS,
      journalEntries: entries || [],
      contributions: contributions || [],
      recurringItems: recurringItems || [],
    });
  } catch (err: any) {
    console.error('API accounting GET error:', err);
    return NextResponse.json({ error: err.message, accounts: INITIAL_ACCOUNTS }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin client unconfigured' }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. CREATE MANUAL / SYSTEM JOURNAL ENTRY
    if (action === 'create_journal_entry') {
      const { entry_date, settled_date, description, created_by, source_type, source_id, lines } = body;

      // Verify balance
      const balanceCheck = verifyJournalBalance(lines);
      if (!balanceCheck.isBalanced) {
        return NextResponse.json(
          {
            error: `Journal entry does not balance! Total Debits: ${balanceCheck.totalDebits} BDT, Total Credits: ${balanceCheck.totalCredits} BDT (Diff: ${balanceCheck.diff} BDT).`,
          },
          { status: 400 }
        );
      }

      // Insert Header
      const { data: newEntry, error: entryErr } = await supabase
        .from('journal_entries')
        .insert({
          entry_date: entry_date || new Date().toISOString().substring(0, 10),
          settled_date: settled_date || null,
          description: description.trim(),
          created_by,
          source_type: source_type || 'manual',
          source_id: source_id || null,
        })
        .select('*')
        .single();

      if (entryErr) throw entryErr;

      // Insert Lines
      const lineRows = lines.map((l: any) => ({
        journal_entry_id: newEntry.id,
        account_id: l.account_id,
        debit_amount: Number(l.debit_amount) || 0,
        credit_amount: Number(l.credit_amount) || 0,
        currency: l.currency || 'BDT',
        exchange_rate: Number(l.exchange_rate) || 122.5,
        debit_bdt: Number(l.debit_bdt) || 0,
        credit_bdt: Number(l.credit_bdt) || 0,
      }));

      const { data: createdLines, error: linesErr } = await supabase
        .from('journal_lines')
        .insert(lineRows)
        .select('*');

      if (linesErr) throw linesErr;

      return NextResponse.json({ entry: { ...newEntry, lines: createdLines } });
    }

    // 2. CREATE CAPITAL CONTRIBUTION
    if (action === 'create_contribution') {
      const {
        contributed_by,
        founder_account_id,
        amount,
        currency,
        exchange_rate,
        contribution_date,
        settled_date,
        method,
        note,
      } = body;

      const rate = Number(exchange_rate) || 122.5;
      const amountBDT = currency === 'USD' ? Number(amount) * rate : Number(amount);

      // Find Cash and Equity Accounts
      const { data: cashAcc } = await supabase
        .from('accounts')
        .select('id')
        .eq('code', '1010')
        .single();

      let targetEquityAccId = founder_account_id;
      if (!targetEquityAccId) {
        const { data: defEquity } = await supabase
          .from('accounts')
          .select('id')
          .eq('code', '3010')
          .single();
        targetEquityAccId = defEquity?.id;
      }

      // Create Contribution Record
      const { data: contrib, error: contribErr } = await supabase
        .from('capital_contributions')
        .insert({
          contributed_by,
          founder_account_id: targetEquityAccId,
          amount: Number(amount),
          currency,
          exchange_rate: rate,
          contribution_date: contribution_date || new Date().toISOString().substring(0, 10),
          settled_date: settled_date || contribution_date || new Date().toISOString().substring(0, 10),
          method: method || 'bank_transfer',
          note: note?.trim() || null,
        })
        .select('*')
        .single();

      if (contribErr) throw contribErr;

      // Post Balanced Journal Entry (Debit Cash, Credit Founder Capital)
      if (cashAcc?.id && targetEquityAccId) {
        const { data: jEntry } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: contribution_date || new Date().toISOString().substring(0, 10),
            settled_date: settled_date || contribution_date,
            description: `Capital Contribution from Founder (Method: ${method || 'Bank Transfer'}${note ? ' — ' + note : ''})`,
            created_by: contributed_by,
            source_type: 'contribution',
            source_id: contrib.id,
          })
          .select('*')
          .single();

        if (jEntry) {
          await supabase.from('journal_lines').insert([
            {
              journal_entry_id: jEntry.id,
              account_id: cashAcc.id,
              debit_amount: Number(amount),
              credit_amount: 0,
              currency,
              exchange_rate: rate,
              debit_bdt: amountBDT,
              credit_bdt: 0,
            },
            {
              journal_entry_id: jEntry.id,
              account_id: targetEquityAccId,
              debit_amount: 0,
              credit_amount: Number(amount),
              currency,
              exchange_rate: rate,
              debit_bdt: 0,
              credit_bdt: amountBDT,
            },
          ]);

          await supabase
            .from('capital_contributions')
            .update({ journal_entry_id: jEntry.id })
            .eq('id', contrib.id);
        }
      }

      return NextResponse.json({ contribution: contrib });
    }

    // 3. MARK EXPENSE AS PAID (Settle AP)
    if (action === 'mark_expense_paid') {
      const { expenseId, paidDate, actorId } = body;
      const effectivePaidDate = paidDate || new Date().toISOString().substring(0, 10);

      // Get Expense
      const { data: exp } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (!exp) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

      // Update Expense Payment Status
      await supabase
        .from('expenses')
        .update({
          payment_status: 'paid',
          paid_date: effectivePaidDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', expenseId);

      // Settle Accounts Payable via Double-Entry (Debit AP, Credit Cash)
      const { data: cashAcc } = await supabase.from('accounts').select('id').eq('code', '1010').single();
      const { data: apAcc } = await supabase.from('accounts').select('id').eq('code', '2010').single();

      if (cashAcc && apAcc) {
        const amountBDT =
          exp.currency === 'USD' ? Number(exp.amount) * Number(exp.exchange_rate) : Number(exp.amount);

        const { data: jEntry } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: effectivePaidDate,
            settled_date: effectivePaidDate,
            description: `AP Settlement: Paid invoice for ${exp.description}`,
            created_by: actorId,
            source_type: 'adjustment',
            source_id: exp.id,
          })
          .select('*')
          .single();

        if (jEntry) {
          await supabase.from('journal_lines').insert([
            {
              journal_entry_id: jEntry.id,
              account_id: apAcc.id,
              debit_amount: Number(exp.amount),
              credit_amount: 0,
              currency: exp.currency,
              exchange_rate: exp.exchange_rate,
              debit_bdt: amountBDT,
              credit_bdt: 0,
            },
            {
              journal_entry_id: jEntry.id,
              account_id: cashAcc.id,
              debit_amount: 0,
              credit_amount: Number(exp.amount),
              currency: exp.currency,
              exchange_rate: exp.exchange_rate,
              debit_bdt: 0,
              credit_bdt: amountBDT,
            },
          ]);
        }
      }

      return NextResponse.json({ success: true });
    }

    // 4. RECURRING ITEM CRUD
    if (action === 'create_recurring') {
      const { name, category_id, vendor_name, amount, currency, frequency, next_due_date, exchange_rate } = body;
      const { data: item, error: recErr } = await supabase
        .from('recurring_items')
        .insert({
          name: name.trim(),
          category_id,
          vendor_name: vendor_name.trim(),
          amount: Number(amount),
          currency: currency || 'USD',
          frequency: frequency || 'monthly',
          next_due_date,
          exchange_rate: Number(exchange_rate) || 122.5,
          is_active: true,
        })
        .select('*')
        .single();

      if (recErr) throw recErr;
      return NextResponse.json({ recurringItem: item });
    }

    // 5. CREATE ACCOUNT
    if (action === 'create_account') {
      const { code, name, type, parent_id, description } = body;
      const { data: acc, error: accErr } = await supabase
        .from('accounts')
        .insert({
          code: code?.trim() || null,
          name: name.trim(),
          type,
          parent_id: parent_id || null,
          description: description?.trim() || null,
          is_active: true,
        })
        .select('*')
        .single();

      if (accErr) throw accErr;
      return NextResponse.json({ account: acc });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('API accounting POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
