import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExpenseAccountForCategory, INITIAL_ACCOUNTS } from '@/lib/accounting';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const {
      userId,
      email,
      name,
      amount,
      currency,
      exchange_rate,
      category_id,
      description,
      expense_date,
      receipt_url,
      payment_status,
      due_date,
      paid_date,
    } = body;

    if (!userId || !amount || !category_id) {
      return NextResponse.json({ error: 'Missing required expense fields' }, { status: 400 });
    }

    // 1. Guarantee Profile Exists in DB
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      const role = count === 0 || count === null ? 'admin' : 'employee';

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: email || '',
        name: name || 'User',
        role,
        team_id: role === 'admin' ? 'Executive' : 'Engineering',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email || 'U')}`,
      });
    }

    // 2. Guarantee Category Exists & Has Valid UUID
    let targetCatId = category_id;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(category_id)) {
      const { data: dbCat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .ilike('name', category_id.replace(/^cat-/, '').replace(/-/g, ' '))
        .maybeSingle();

      if (dbCat?.id) {
        targetCatId = dbCat.id;
      } else {
        const { data: newCat } = await supabaseAdmin
          .from('categories')
          .insert({ name: category_id, is_active: true })
          .select('id')
          .single();
        if (newCat) targetCatId = newCat.id;
      }
    }

    const isAdmin = profile?.role === 'admin';
    const finalPaymentStatus = payment_status || 'paid';
    const finalDueDate = due_date || null;
    const finalPaidDate = finalPaymentStatus === 'paid' ? (paid_date || expense_date || new Date().toISOString().substring(0, 10)) : null;

    // 3. Insert Expense
    const { data: newExpense, error: expError } = await supabaseAdmin
      .from('expenses')
      .insert({
        submitted_by: userId,
        amount: Number(amount),
        currency: currency || 'BDT',
        exchange_rate: Number(exchange_rate) || 122.5,
        category_id: targetCatId,
        description: description.trim(),
        expense_date: expense_date || new Date().toISOString().substring(0, 10),
        receipt_url: receipt_url || null,
        status: isAdmin ? 'approved' : 'pending',
        payment_status: finalPaymentStatus,
        due_date: finalDueDate,
        paid_date: finalPaidDate,
        reviewed_by: isAdmin ? userId : null,
        reviewed_at: isAdmin ? new Date().toISOString() : null,
        review_note: isAdmin ? 'Auto-approved (Admin / Founder submission)' : null,
      })
      .select('*')
      .single();

    if (expError) {
      console.error('Server expense insert error:', expError);
      return NextResponse.json({ error: expError.message }, { status: 500 });
    }

    // 4. If approved (e.g. founder submission), post balanced double-entry Journal Entry
    if (isAdmin) {
      try {
        const { data: accountsList } = await supabaseAdmin.from('accounts').select('*');
        const accounts = accountsList || INITIAL_ACCOUNTS;
        const { data: catList } = await supabaseAdmin.from('categories').select('*');
        const categories = catList || [];

        const expenseAccount = getExpenseAccountForCategory(targetCatId, categories, accounts);
        const cashAccount = accounts.find((a) => a.code === '1010') || INITIAL_ACCOUNTS[0];
        const apAccount = accounts.find((a) => a.code === '2010') || INITIAL_ACCOUNTS[1];
        const creditAccount = finalPaymentStatus === 'paid' ? cashAccount : apAccount;

        const rate = Number(exchange_rate) || 122.5;
        const amountBDT = currency === 'USD' ? Number(amount) * rate : Number(amount);

        const { data: jEntry } = await supabaseAdmin
          .from('journal_entries')
          .insert({
            entry_date: expense_date || new Date().toISOString().substring(0, 10),
            settled_date: finalPaymentStatus === 'paid' ? finalPaidDate : null,
            description: `Expense: ${description.trim()} (${finalPaymentStatus === 'paid' ? 'Paid' : 'Accrued to Accounts Payable'})`,
            created_by: userId,
            source_type: 'expense',
            source_id: newExpense.id,
          })
          .select('*')
          .single();

        if (jEntry) {
          await supabaseAdmin.from('journal_lines').insert([
            {
              journal_entry_id: jEntry.id,
              account_id: expenseAccount.id,
              debit_amount: Number(amount),
              credit_amount: 0,
              currency: currency || 'BDT',
              exchange_rate: rate,
              debit_bdt: amountBDT,
              credit_bdt: 0,
            },
            {
              journal_entry_id: jEntry.id,
              account_id: creditAccount.id,
              debit_amount: 0,
              credit_amount: Number(amount),
              currency: currency || 'BDT',
              exchange_rate: rate,
              debit_bdt: 0,
              credit_bdt: amountBDT,
            },
          ]);
        }
      } catch (journalErr) {
        console.warn('Auto journal generation notice:', journalErr);
      }
    }

    // 5. Log audit trail
    await supabaseAdmin.from('activity_logs').insert({
      actor_id: userId,
      expense_id: newExpense.id,
      action: 'created',
      details: { amount, currency, description, autoApproved: isAdmin, payment_status: finalPaymentStatus },
    });

    return NextResponse.json({ expense: newExpense });
  } catch (err: any) {
    console.error('API expenses fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
