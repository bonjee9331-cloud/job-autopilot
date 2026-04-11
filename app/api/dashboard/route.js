import { NextResponse } from 'next/server';

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/job_analyses?select=*&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    const text = await response.text();
    const data = tryParseJson(text);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to load dashboard data',
          details: data || text
        },
        { status: 500 }
      );
    }

    const items = Array.isArray(data) ? data : [];
    const now = new Date();

    const summary = {
      total: items.length,
      new: items.filter((x) => (x.pipeline_status || 'new') === 'new').length,
      shortlisted: items.filter((x) => x.pipeline_status === 'shortlisted').length,
      saved: items.filter((x) => x.pipeline_status === 'saved').length,
      ignored: items.filter((x) => x.pipeline_status === 'ignored').length,
      applied: items.filter((x) => x.application_status === 'applied').length,
      followupsDue: items.filter(
        (x) =>
          x.application_status === 'applied' &&
          x.follow_up_due_at &&
          new Date(x.follow_up_due_at) <= now
      ).length
    };

    return NextResponse.json({
      ok: true,
      summary,
      items
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Unknown server error'
      },
      { status: 500 }
    );
  }
}
