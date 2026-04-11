function cleanText(value) {
  return String(value || '').trim();
}

function normalizeTitle(value) {
  return cleanText(value).toLowerCase();
}

function normalizeMoney(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function buildSalaryText(min, max, fallback = '') {
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return fallback || '';
}

function scoreJob(job, targetTitles = [], preferredLocations = []) {
  let score = 0;
  const title = normalizeTitle(job.title);
  const location = normalizeTitle(job.location);
  const description = normalizeTitle(job.description);

  for (const target of targetTitles) {
    const t = normalizeTitle(target);
    if (!t) continue;
    if (title.includes(t)) score += 50;
    else if (description.includes(t)) score += 20;
  }

  if (job.remote) score += 20;

  for (const loc of preferredLocations) {
    const l = normalizeTitle(loc);
    if (!l) continue;
    if (location.includes(l)) score += 15;
  }

  return Math.min(score, 100);
}

function isExcluded(job, excludedKeywords = []) {
  const haystack = `${job.title} ${job.company} ${job.description}`.toLowerCase();
  return excludedKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export async function fetchAdzunaJobs({
  query,
  location,
  minSalary,
  remoteOnly,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) return [];

  const countries = ['au', 'nz'];
  const results = [];

  for (const country of countries) {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '20',
      what: query || targetTitles.join(' OR '),
      content_type: 'application/json'
    });

    if (location) params.set('where', location);
    if (minSalary) params.set('salary_min', String(minSalary));

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.results) continue;

    for (const item of data.results) {
      const job = {
        source: 'adzuna',
        external_id: String(item.id),
        title: cleanText(item.title),
        company: cleanText(item.company?.display_name),
        location: cleanText(item.location?.display_name || country.toUpperCase()),
        salary_min: normalizeMoney(item.salary_min),
        salary_max: normalizeMoney(item.salary_max),
        salary_text: buildSalaryText(item.salary_min, item.salary_max),
        remote: /remote/i.test(`${item.title} ${item.description || ''}`),
        apply_url: cleanText(item.redirect_url),
        description: cleanText(item.description),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (remoteOnly && !job.remote) continue;
      if (isExcluded(job, excludedKeywords)) continue;

      job.fit_score = scoreJob(job, targetTitles, preferredLocations);
      job.matched_title =
        targetTitles.find((t) => normalizeTitle(job.title).includes(normalizeTitle(t))) || '';

      results.push(job);
    }
  }

  return results;
}

export async function fetchMuseJobs({
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const results = [];
  const pages = [1, 2];

  for (const page of pages) {
    const url = `https://www.themuse.com/api/public/jobs?page=${page}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.results) continue;

    for (const item of data.results) {
      const location = (item.locations || []).map((l) => l.name).join(', ');
      const contents = cleanText(item.contents || '');
      const job = {
        source: 'muse',
        external_id: String(item.id),
        title: cleanText(item.name),
        company: cleanText(item.company?.name),
        location: location || 'Unspecified',
        salary_min: null,
        salary_max: null,
        salary_text: '',
        remote: /remote/i.test(`${item.name} ${location} ${contents}`),
        apply_url: cleanText(item.refs?.landing_page || item.refs?.apply),
        description: contents,
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (isExcluded(job, excludedKeywords)) continue;

      job.fit_score = scoreJob(job, targetTitles, preferredLocations);
      job.matched_title =
        targetTitles.find((t) => normalizeTitle(job.title).includes(normalizeTitle(t))) || '';

      results.push(job);
    }
  }

  return results;
}

export async function fetchRemotiveJobs({
  query,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const params = new URLSearchParams();
  if (query) params.set('search', query);

  const url = `https://remotive.com/api/remote-jobs${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.jobs) return [];

  return data.jobs
    .map((item) => {
      const job = {
        source: 'remotive',
        external_id: String(item.id),
        title: cleanText(item.title),
        company: cleanText(item.company_name),
        location: cleanText(item.candidate_required_location || 'Remote'),
        salary_min: null,
        salary_max: null,
        salary_text: cleanText(item.salary || ''),
        remote: true,
        apply_url: cleanText(item.url),
        description: cleanText(item.description),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      job.fit_score = scoreJob(job, targetTitles, preferredLocations);
      job.matched_title =
        targetTitles.find((t) => normalizeTitle(job.title).includes(normalizeTitle(t))) || '';

      return job;
    })
    .filter((job) => !isExcluded(job, excludedKeywords));
}

export async function fetchHimalayasJobs({
  query,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);

  const url = `https://himalayas.app/jobs/api/search${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.jobs) return [];

  return data.jobs
    .map((item) => {
      const salaryMin = normalizeMoney(item?.salary?.minAmount || item?.minSalary);
      const salaryMax = normalizeMoney(item?.salary?.maxAmount || item?.maxSalary);
      const job = {
        source: 'himalayas',
        external_id: String(item.id || item.slug || item.url),
        title: cleanText(item.title),
        company: cleanText(item.companyName || item.company?.name),
        location: cleanText(
          item.location || item.country || item.timezone || 'Remote'
        ),
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_text: buildSalaryText(salaryMin, salaryMax, ''),
        remote: true,
        apply_url: cleanText(item.applyUrl || item.url),
        description: cleanText(item.description || ''),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      job.fit_score = scoreJob(job, targetTitles, preferredLocations);
      job.matched_title =
        targetTitles.find((t) => normalizeTitle(job.title).includes(normalizeTitle(t))) || '';

      return job;
    })
    .filter((job) => !isExcluded(job, excludedKeywords));
}

export async function fetchGreenhouseJobs({
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const tokens = String(process.env.GREENHOUSE_BOARD_TOKENS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (!tokens.length) return [];

  const results = [];

  for (const token of tokens) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.jobs) continue;

    for (const item of data.jobs) {
      const location = cleanText(item.location?.name || 'Unspecified');
      const job = {
        source: 'greenhouse',
        external_id: `${token}:${item.id}`,
        title: cleanText(item.title),
        company: token,
        location,
        salary_min: null,
        salary_max: null,
        salary_text: '',
        remote: /remote/i.test(`${item.title} ${location}`),
        apply_url: cleanText(item.absolute_url),
        description: cleanText(item.metadata?.map((m) => `${m.name}: ${m.value}`).join('\n') || ''),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (isExcluded(job, excludedKeywords)) continue;

      job.fit_score = scoreJob(job, targetTitles, preferredLocations);
      job.matched_title =
        targetTitles.find((t) => normalizeTitle(job.title).includes(normalizeTitle(t))) || '';

      results.push(job);
    }
  }

  return results;
}

export function dedupeJobs(jobs) {
  const map = new Map();

  for (const job of jobs) {
    const key = `${normalizeTitle(job.title)}|${normalizeTitle(job.company)}|${normalizeTitle(job.location)}`;
    if (!map.has(key) || (job.fit_score || 0) > (map.get(key).fit_score || 0)) {
      map.set(key, job);
    }
  }

  return [...map.values()].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
}
