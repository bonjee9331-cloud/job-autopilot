import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('job_analyses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, packages: data || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to load packages' }, { status: 500 });
  }
}
