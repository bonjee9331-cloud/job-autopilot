import { searchAdzuna } from './adzuna.js';
import { searchJooble } from './jooble.js';
import { getSupabaseAdmin } from '../supabaseAdmin.js';

export async function runIngestion(profile) {
    const {
          targetTitles = [],
          preferredLocations = [],
          remoteOnly = true,
          minSalary = 0,
          excludedKeywords = []
    } = profile || {};

  console.log('[Ingest] Starting job ingestion', { targetTitles: targetTitles.length, locations: preferredLocations.length });

  const enabledSources = process.env.JOB_SEARCH_SOURCES?.split(',').map(s => s.trim()) || ['adzuna', 'jooble'];
    const jobs = [];

  if (enabledSources.includes('adzuna')) {
        for (const title of targetTitles) {
                try {
                          const adzunaJobs = await searchAdzuna(title);
                          jobs.push(...adzunaJobs);
                } catch (error) {
                          console.error('[Adzuna]', error.message);
                }
        }
  }

  if (enabledSources.includes('jooble')) {
        for (const title of targetTitles) {
                for (const location of preferredLocations) {
                          try {
                                      const joobleJobs = await searchJooble(title, location);
                                      jobs.push(...joobleJobs);
                          } catch (error) {
                                      console.error('[Jooble]', error.message);
                          }
                }
        }
  }

  console.log(`[Ingest] Found ${jobs.length} jobs before filtering`);

  const deduped = deduplicateJobs(jobs);
    console.log(`[Ingest] ${deduped.length} jobs after deduplication`);

  const filtered = filterJobs(deduped, {
        remoteOnly,
        minSalary,
        locations: preferredLocations,
        excludedKeywords
  });

  console.log(`[Ingest] ${filtered.length} jobs after filtering`);

  const scored = filtered.map(job => ({
        ...job,
        fit_score: calculateFitScore(job, { targetTitles, preferredLocations, remoteOnly })
  }));

  const supabase = getSupabaseAdmin();
    const stored = [];

  for (const job of scored) {
        try {
                const { data, error } = await supabase
                  .from('jobs')
                  .upsert({
                              source: job.source,
                              external_id: job.external_id,
                              title: job.title,
                              company: job.company,
                              description: job.description,
                              apply_url: job.apply_url,
                              location: job.location,
                              salary_min: job.salary_min,
                              salary_max: job.salary_max,
                              salary_text: job.salary_text,
                              remote: job.remote,
                              fit_score: job.fit_score,
                              posted_at: job.posted_at,
                              ingested_at: new Date().toISOString()
                  }, {
                              onConflict: 'source,external_id'
                  })
                  .select()
                  .single();

          if (error) {
                    console.error(`[DB] Error storing job ${job.source}-${job.external_id}:`, error.message);
          } else {
                    stored.push(data);
          }
        } catch (error) {
                console.error(`[DB] Exception storing job:`, error.message);
        }
  }

  console.log(`[Ingest] ${stored.length} jobs stored to Supabase`);

  return {
        total: jobs.length,
        deduped: deduped.length,
        filtered: filtered.length,
        stored: stored.length,
        jobs: stored
  };
}

function deduplicateJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
          const key = `${job.source}-${job.external_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
    });
}

function filterJobs(jobs, criteria) {
    return jobs.filter(job => {
          if (criteria.remoteOnly && !job.remote) return false;
          if (criteria.minSalary && job.salary_max && job.salary_max < criteria.minSalary) return false;

                           if (criteria.locations && criteria.locations.length > 0) {
                                   const jobLocation = (job.location || '').toLowerCase();
                                   const matches = criteria.locations.some(loc => jobLocation.includes(loc.toLowerCase()));
                                   if (!matches) return false;
                           }

                           if (criteria.excludedKeywords && criteria.excludedKeywords.length > 0) {
                                   const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
                                   const hasExcluded = criteria.excludedKeywords.some(keyword => jobText.includes(keyword.toLowerCase()));
                                   if (hasExcluded) return false;
                           }

                           return true;
    });
}

function calculateFitScore(job, profile) {
    let score = 50;

  if (job.remote && profile.remoteOnly) score += 20;
    if (job.title && profile.targetTitles) {
          const titleMatch = profile.targetTitles.some(t => job.title.toLowerCase().includes(t.toLowerCase()));
          if (titleMatch) score += 25;
    }
    if (job.location && profile.preferredLocations) {
          const locationMatch = profile.preferredLocations.some(l => job.location.toLow
