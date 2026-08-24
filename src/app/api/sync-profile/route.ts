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
    const { userId, email, name, role, team_id } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // Check if profile exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ profile: existing });
    }

    // Check total profiles count (first registrant is admin)
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const assignedRole = (count === 0 || count === null) ? 'admin' : (role || 'admin');

    const newProfile = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name?.trim() || email.split('@')[0] || 'User',
      role: assignedRole,
      team_id: team_id || (assignedRole === 'admin' ? 'Executive' : 'Engineering'),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
    };

    const { data: created, error: insertError } = await supabaseAdmin
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .single();

    if (insertError) {
      console.error('Server sync-profile error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: created });
  } catch (err: any) {
    console.error('API sync-profile fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
