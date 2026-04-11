import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) return NextResponse.json({ ok: false, error: 'Missing package id' }, { status: 400 });

    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 3);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('job_analyses')
      .update({ application_status: 'applied', applied_at: new Date().toISOString(), follow_up_due_at: followUp.toISOString(), follow_up_status: 'scheduled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, package: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to mark package as applied' }, { status: 500 });
  }
}
