import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('job_analyses').select('*').not('follow_up_due_at', 'is', null).order('follow_up_due_at', { ascending: true });
    if (error) throw error;
    const { data: templates } = await supabase.from('followup_templates').select('*').eq('active', true).order('created_at', { ascending: true });
    return NextResponse.json({ ok: true, items: data || [], templates: templates || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to load followups' }, { status: 500 });
  }
}
