import { runIngestion } from '../../lib/jobs/ingest.js';

export default async (req, context) => {
  try {
    const result = await runIngestion();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[job-sync] error:', error.message);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
