import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    return NextResponse.json({
      ok: true,
      mode: 'manual_approval_required',
      compliance: [
        'Use official APIs first',
        'Require explicit user approval before submission',
        'Browser automation only where permitted by site terms'
      ],
      nextAction: 'Generate package and review submission payload before any apply action',
      target: body.applyUrl || null
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Auto apply preparation failed' }, { status: 500 });
  }
}
