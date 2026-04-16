import { fetchWithTimeout } from './fetchWithTimeout';

export async function searchJooble({
  query,
  location,
  page = 1,
  radius = 50,
  dateCreatedFrom = null
}) {
  if (!process.env.JOOBLE_API_KEY) {
    throw new Error('Missing JOOBLE_API_KEY');
  }

  const url = `https://jooble.org/api/${process.env.JOOBLE_API_KEY}`;

  const payload = {
    keywords: query,
    location: location || 'Australia',
    radius,
    pageNum: page
  };

  if (dateCreatedFrom) {
    payload.dateCreatedFrom = dateCreatedFrom;
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    },
    15000
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jooble error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Jooble API error: ${data.error}`);
  }

  const results = data.jobs || [];

  return results.map((job) => normalizeJoobleJob(job));
}

function normalizeJoobleJob(job) {
  const isRemote = /remote|work from home|wfh/i.test(job.snippet || '');
  const jobId = job.id || `jooble-${Math.random().toString(36).slice(2, 11)}`;

  let salaryText = null;
  if (job.salary) {
    salaryText = job.salary.replace(/\s+/g, ' ').trim();
  }

  return {
    id: `jooble-${jobId}`,
    title: job.title,
    company: job.company || 'Unknown',
    location: job.location || 'Australia',
    remote: isRemote,
    salary: salaryText,
    source: 'jooble',
    source_id: jobId,
    source_url: job.link,
    posted_at: new Date().toISOString(),
    jd_summary: (job.snippet || '').slice(0, 500)
  };
}
