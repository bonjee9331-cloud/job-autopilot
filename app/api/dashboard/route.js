import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('job_analyses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const items = data || [];
    const now = Date.now();
    const summary = {
      total: items.length,
      shortlisted: items.filter((x) => x.pipeline_status === 'shortlisted').length,
      saved: items.filter((x) => x.pipeline_status === 'saved').length,
      ignored: items.filter((x) => x.pipeline_status === 'ignored').length,
      applied: items.filter((x) => x.application_status === 'applied').length,
      interviews: items.filter((x) => x.application_status === 'interview').length,
      offers: items.filter((x) => x.application_status === 'offer').length,
      overdue: items.filter((x) => x.follow_up_due_at && new Date(x.follow_up_due_at).getTime() < now && x.application_status === 'applied').length
    };
    return NextResponse.json({ ok: true, summary, items });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to load dashboard' }, { status: 500 });
  }
}
