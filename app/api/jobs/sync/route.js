import { NextResponse } from 'next/server';
import { runIngestion } from '../../../../lib/jobs/ingest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  const apiKey = process.env.JOB_SYNC_API_KEY;

  if (process.env.NODE_ENV === 'production' && !apiKey) {
    return NextResponse.json(
      { ok: false, error: 'JOB_SYNC_API_KEY not configured' },
      { status: 403 }
    );
  }

  const headerKey = req.headers.get('x-api-key');
  if (process.env.NODE_ENV === 'production' && headerKey !== apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await runIngestion();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
