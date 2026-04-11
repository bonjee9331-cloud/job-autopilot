import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('job_analyses').select('*');
    if (error) throw error;
    const items = data || [];
    const applied = items.filter((x) => x.application_status === 'applied').length;
    const interviews = items.filter((x) => x.application_status === 'interview').length;
    const offers = items.filter((x) => x.application_status === 'offer').length;
    const cvVersions = items.reduce((acc, item) => {
      const key = item.resume_version_name || 'unnamed';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return NextResponse.json({
      ok: true,
      metrics: {
        total: items.length,
        applied,
        interviews,
        offers,
        applicationToInterviewRate: applied ? Math.round((interviews / applied) * 100) : 0,
        interviewToOfferRate: interviews ? Math.round((offers / interviews) * 100) : 0,
        responseRate: items.length ? Math.round(((interviews + offers) / items.length) * 100) : 0,
        bestCvVersions: Object.entries(cvVersions).sort((a, b) => b[1] - a[1]).slice(0, 5)
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Analytics failed' }, { status: 500 });
  }
}
