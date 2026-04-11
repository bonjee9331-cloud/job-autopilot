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
      `${supabaseUrl}/rest/v1/job_analyses?select=*&application_status=eq.applied&order=follow_up_due_at.asc.nullslast`,
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
          error: 'Failed to load follow-up queue',
          details: data || text
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: Array.isArray(data) ? data : []
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
