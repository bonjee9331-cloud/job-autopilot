import { NextResponse } from 'next/server';
import { getSupabaseServer, isSupabaseConfigured } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEMO_JOBS = [
  {
    id: 'demo-1',
    title: 'Sales Manager',
    company: 'Tech Corp',
    location: 'Sydney',
    remote: true,
    salary: '$120k AUD',
    source: 'demo',
    fit_score: 85,
    status: 'discovered'
  },
  {
    id: 'demo-2',
    title: 'Sales Operations Manager',
    company: 'Finance Plus',
    location: 'Melbourne',
    remote: true,
    salary: '$110k AUD',
    source: 'demo',
    fit_score: 78,
    status: 'discovered'
  }
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
  const status = searchParams.get('status') || 'discovered';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      jobs: DEMO_JOBS,
      demoMode: true
    });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', status)
      .order('ingested_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      jobs: data || []
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
