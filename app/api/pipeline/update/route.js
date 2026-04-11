import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/job_analyses?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          pipeline_status: status
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
