import { NextResponse } from 'next/server';
import { searchJobs } from '../../../../lib/jobs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile = {
      targetTitles: body.targetTitles || ['Sales Manager', 'Sales Operations Manager', 'Remote Sales Manager'],
      preferredLocations: body.preferredLocations || ['Australia', 'New Zealand'],
      location: body.location || '',
      minSalary: body.minSalary || 70000,
      remoteOnly: body.remoteOnly ?? true,
      excludedKeywords: body.excludedKeywords || ['finance', 'investment', 'real estate', 'car sales']
    };

    const { jobs, debug } = await searchJobs(profile);

    return NextResponse.json({ ok: true, jobs, count: jobs.length, debug });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Job search failed' }, { status: 500 });
  }
}
