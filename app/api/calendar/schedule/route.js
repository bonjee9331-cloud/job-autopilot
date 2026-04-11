import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    return NextResponse.json({
      ok: true,
      message: 'Calendar scheduling shell ready. Connect Google OAuth before enabling live creation.',
      requestedEvent: {
        title: body.title,
        start: body.start,
        end: body.end,
        reminders: body.reminders || [1440, 60]
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Calendar scheduling failed' }, { status: 500 });
  }
}
