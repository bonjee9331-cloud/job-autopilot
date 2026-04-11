import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

function renderTemplate(template, item, candidateName = 'Ben Lynch') {
  return String(template || '')
    .replaceAll('{{job_title}}', item.job_title || '')
    .replaceAll('{{company}}', item.company || '')
    .replaceAll('{{candidate_name}}', candidateName);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const { data: item, error: itemError } = await supabase.from('job_analyses').select('*').eq('id', body.id).single();
    if (itemError) throw itemError;
    const { data: template, error: templateError } = await supabase.from('followup_templates').select('*').eq('id', body.templateId).single();
    if (templateError) throw templateError;

    const due = new Date();
    due.setDate(due.getDate() + Number(template.days_after || 3));

    const subject = renderTemplate(template.subject_template, item, body.candidateName);
    const draft = renderTemplate(template.body_template, item, body.candidateName);

    const { data, error } = await supabase
      .from('job_analyses')
      .update({ follow_up_due_at: due.toISOString(), follow_up_status: 'scheduled', notes: `${item.notes || ''}\n\nFOLLOW-UP SUBJECT: ${subject}\nFOLLOW-UP DRAFT:\n${draft}`.trim() })
      .eq('id', body.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data, subject, draft });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to schedule follow-up' }, { status: 500 });
  }
}
