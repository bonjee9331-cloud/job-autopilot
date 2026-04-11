import { computeFitScore, normalizeText } from './scoring';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function sanitizeDescription(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shouldExclude(job, excludedKeywords = []) {
  const haystack = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
  return excludedKeywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${normalizeText(job.title)}|${normalizeText(job.company)}|${normalizeText(job.location)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getAdzunaJobs(profile) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const what = encodeURIComponent((profile.targetTitles || []).slice(0, 5).join(' OR ') || 'sales manager');
  const where = encodeURIComponent(profile.location || profile.preferredLocations?.[0] || 'Australia');
  const url = `https://api.adzuna.com/v1/api/jobs/au/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${what}&where=${where}`;
  const data = await fetchJson(url);
  return (data.results || []).map((item) => ({
    id: `adzuna-${item.id}`,
    external_id: String(item.id),
    title: item.title,
    company: item.company?.display_name || 'Unknown company',
    location: item.location?.display_name || 'Unknown location',
    description: sanitizeDescription(item.description),
    apply_url: item.redirect_url,
    source: 'adzuna',
    salary_min: item.salary_min || 0,
    salary_max: item.salary_max || 0,
    salary_text: item.salary_min || item.salary_max ? `${item.salary_min || ''}${item.salary_min && item.salary_max ? ' - ' : ''}${item.salary_max || ''}` : 'Not listed',
    remote: /remote/i.test(`${item.title} ${item.description} ${item.location?.display_name || ''}`)
  }));
}

async function getRemotiveJobs(profile) {
  const data = await fetchJson('https://remotive.com/api/remote-jobs');
  return (data.jobs || []).slice(0, 50).map((item) => ({
    id: `remotive-${item.id}`,
    external_id: String(item.id),
    title: item.title,
    company: item.company_name,
    location: item.candidate_required_location || 'Remote',
    description: sanitizeDescription(item.description),
    apply_url: item.url,
    source: 'remotive',
    salary_min: 0,
    salary_max: 0,
    salary_text: item.salary || 'Not listed',
    remote: true
  }));
}

async function getMuseJobs() {
  const data = await fetchJson('https://www.themuse.com/api/public/jobs?page=1');
  return (data.results || []).slice(0, 40).map((item) => ({
    id: `muse-${item.id}`,
    external_id: String(item.id),
    title: item.name,
    company: item.company?.name || 'Unknown company',
    location: (item.locations || []).map((l) => l.name).join(', ') || 'Unknown location',
    description: sanitizeDescription(item.contents),
    apply_url: item.refs?.landing_page || item.refs?.apply,
    source: 'muse',
    salary_min: 0,
    salary_max: 0,
    salary_text: 'Not listed',
    remote: /remote/i.test(`${item.name} ${item.contents}`)
  }));
}

async function getHimalayasJobs() {
  // Simple JSON endpoint is not officially guaranteed. Fallback safe shell.
  return [];
}

async function getGreenhouseJobs() {
  return [];
}

export async function searchJobs(profile) {
  const sources = String(process.env.JOB_SEARCH_SOURCES || 'adzuna,remotive,muse').split(',').map((s) => s.trim().toLowerCase());
  const results = { adzuna: [], remotive: [], muse: [], himalayas: [], greenhouse: [] };

  if (sources.includes('adzuna')) {
    try { results.adzuna = await getAdzunaJobs(profile); } catch {}
  }
  if (sources.includes('remotive')) {
    try { results.remotive = await getRemotiveJobs(profile); } catch {}
  }
  if (sources.includes('muse')) {
    try { results.muse = await getMuseJobs(profile); } catch {}
  }
  if (sources.includes('himalayas')) {
    try { results.himalayas = await getHimalayasJobs(profile); } catch {}
  }
  if (sources.includes('greenhouse')) {
    try { results.greenhouse = await getGreenhouseJobs(profile); } catch {}
  }

  const flat = dedupeJobs(Object.values(results).flat());
  const filtered = flat.filter((job) => !shouldExclude(job, profile.excludedKeywords || []));
  const targetTitles = (profile.targetTitles || []).map(normalizeText);
  const titleFiltered = filtered.filter((job) => {
    if (!targetTitles.length) return true;
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    return targetTitles.some((title) => haystack.includes(title));
  });

  const salaryFiltered = titleFiltered.filter((job) => {
    const minSalary = Number(profile.minSalary || 0);
    if (!minSalary) return true;
    const salarySignal = Number(job.salary_max || job.salary_min || 0);
    return salarySignal === 0 || salarySignal >= minSalary;
  });

  const remoteFiltered = salaryFiltered.filter((job) => !profile.remoteOnly || job.remote);

  const ranked = remoteFiltered.map((job) => {
    const fit = computeFitScore(job, profile);
    return { ...job, fit_score: fit.score, matched_title: fit.matchedTitle, fit_breakdown: fit.breakdown, pipeline_status: 'new' };
  }).sort((a, b) => b.fit_score - a.fit_score);

  return {
    jobs: ranked,
    debug: {
      enabledSources: sources,
      countsBeforeDedupe: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.length])),
      countsAfterFiltering: {
        deduped: flat.length,
        filtered: filtered.length,
        titleFiltered: titleFiltered.length,
        salaryFiltered: salaryFiltered.length,
        final: ranked.length
      }
    }
  };
}
