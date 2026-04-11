export function normalizeText(value) {
  return String(value || '').toLowerCase();
}

export function computeFitScore(job, profile) {
  const title = normalizeText(job.title);
  const description = normalizeText(job.description);
  const location = normalizeText(job.location);
  const matchedTitle = (profile.targetTitles || []).find((target) => title.includes(normalizeText(target)));

  let score = 0;
  if (matchedTitle) score += 40;

  const skillSignals = ['sales', 'operations', 'revenue', 'kpi', 'performance', 'remote', 'leadership', 'manager'];
  const matches = skillSignals.filter((term) => description.includes(term) || title.includes(term)).length;
  score += Math.min(matches * 6, 30);

  const preferredLocations = (profile.preferredLocations || []).map(normalizeText);
  if (preferredLocations.some((loc) => location.includes(loc))) score += 10;
  if (profile.remoteOnly && job.remote) score += 10;

  const minSalary = Number(profile.minSalary || 0);
  const salarySignal = Number(job.salary_max || job.salary_min || 0);
  if (salarySignal >= minSalary && minSalary > 0) score += 10;

  return {
    score: Math.min(score, 100),
    matchedTitle: matchedTitle || null,
    breakdown: {
      titleMatch: matchedTitle ? 40 : 0,
      skillAlignment: Math.min(matches * 6, 30),
      locationFit: preferredLocations.some((loc) => location.includes(loc)) ? 10 : 0,
      remoteFit: profile.remoteOnly && job.remote ? 10 : 0,
      compFit: salarySignal >= minSalary && minSalary > 0 ? 10 : 0
    }
  };
}
