import { fetchWithTimeout } from './fetchWithTimeout';

export async function searchAdzuna({
  query,
  location,
  page = 1,
  maxDaysOld = 7,
  salaryMin = 70000,
  fullTime = true
}) {
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    throw new Error('Missing ADZUNA_APP_ID or ADZUNA_APP_KEY');
  }

  const country = 'au';
  const daysAgo = new Date(Date.now() - maxDaysOld * 24 * 60 * 60 * 1000);
  const dateStr = daysAgo.toISOString().split('T')[0];

  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: 50,
    page,
    what: query,
    where: location || 'australia',
    country,
    sort_by: 'date',
    full_time: fullTime ? 1 : 0,
    salary_min: salaryMin
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;

  const response = await fetchWithTimeout(url, { method: 'GET' }, 15000);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Adzuna error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const results = data.results || [];

  return results.map((job) => normalizeAdzunaJob(job));
}

function normalizeAdzunaJob(job) {
  const isRemote = /remote|work from home|wfh/i.test(job.description || '');
  const salaryText = job.salary_max
    ? `$${(job.salary_max / 1000).toFixed(0)}k AUD`
    : null;

  return {
    id: `adzuna-${job.id}`,
    title: job.title,
    company: job.company.display_name,
    location: job.location?.display_name || 'Australia',
    remote: isRemote,
    salary: salaryText,
    source: 'adzuna',
    source_id: job.id,
    source_url: job.redirect_url,
    posted_at: new Date(job.created).toISOString(),
    jd_summary: (job.description || '').slice(0, 500)
  };
}
