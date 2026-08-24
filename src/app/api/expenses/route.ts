import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      const role = (count === 0 || count === null) ? 'admin' : 'employee';

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

    // 3. Insert Expense
    const { data: newExpense, error: expError } = await supabaseAdmin
      .from('expenses')
      .insert({
        submitted_by: userId,
        amount: Number(amount),
        currency: currency || 'BDT',
        exchange_rate: Number(exchange_rate) || 122.50,
        category_id: targetCatId,
        description: description.trim(),
        expense_date: expense_date || new Date().toISOString().substring(0, 10),
        receipt_url: receipt_url || null,
        status: isAdmin ? 'approved' : 'pending',
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

    // 4. Log audit trail
    await supabaseAdmin.from('activity_logs').insert({
      actor_id: userId,
      expense_id: newExpense.id,
      action: 'created',
      details: { amount, currency, description, autoApproved: isAdmin },
    });

    return NextResponse.json({ expense: newExpense });
  } catch (err: any) {
    console.error('API expenses fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
