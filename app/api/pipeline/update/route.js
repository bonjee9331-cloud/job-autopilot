import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('job_analyses')
      .update({ pipeline_status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to update pipeline' }, { status: 500 });
  }
}
