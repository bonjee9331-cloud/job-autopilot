import { NextResponse } from 'next/server';
import {
  dedupeJobs,
  fetchAdzunaJobs,
  fetchGreenhouseJobs,
  fetchHimalayasJobs,
  fetchMuseJobs,
  fetchRemotiveJobs
} from '../../../../lib/job-sources';

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseBool(value) {
  return String(value || '').toLowerCase() === 'true';
}

export async function POST(req) {
  try {
    const body = await req.json();

    const targetTitles = body.targetTitles || [
      'Sales Manager',
      'Sales Operations Manager',
      'Sales Team Leader',
      'Contact Center Manager',
      'Contact Centre Manager',
      'Remote Sales Manager',
      'Telesales Manager',
      'Outbound Sales Manager',
      'Inside Sales Manager'
    ];

    const preferredLocations = body.preferredLocations || [
      'Australia',
      'New Zealand'
    ];

    const excludedKeywords = body.excludedKeywords || [
      'finance',
      'investment',
      'real estate',
      'car sales',
      'automotive sales'
    ];

    const query =
      body.query ||
      targetTitles.join(' OR ');

    const location = body.location || '';
    const minSalary = Number(body.minSalary || 70000);
    const remoteOnly = parseBool(body.remoteOnly ?? true);

    const enabledSources = String(
      process.env.JOB_SEARCH_SOURCES || 'adzuna,muse,remotive,himalayas,greenhouse'
    )
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    const tasks = [];

    if (enabledSources.includes('adzuna')) {
      tasks.push(
        fetchAdzunaJobs({
          query,
          location,
          minSalary,
          remoteOnly,
          targetTitles,
          preferredLocations,
          excludedKeywords
        })
      );
    }

    if (enabledSources.includes('muse')) {
      tasks.push(
        fetchMuseJobs({
          targetTitles,
          preferredLocations,
          excludedKeywords
        })
      );
    }

    if (enabledSources.includes('remotive')) {
      tasks.push(
        fetchRemotiveJobs({
          query,
          targetTitles,
          preferredLocations,
          excludedKeywords
        })
      );
    }

    if (enabledSources.includes('himalayas')) {
      tasks.push(
        fetchHimalayasJobs({
          query,
          targetTitles,
          preferredLocations,
          excludedKeywords
        })
      );
    }

    if (enabledSources.includes('greenhouse')) {
      tasks.push(
        fetchGreenhouseJobs({
          targetTitles,
          preferredLocations,
          excludedKeywords
        })
      );
    }

    const results = await Promise.all(tasks);
    const jobs = dedupeJobs(results.flat()).filter((job) => {
      if (minSalary && job.salary_min && job.salary_min < minSalary && !job.salary_max) {
        return false;
      }
      if (minSalary && job.salary_max && job.salary_max < minSalary) {
        return false;
      }
      return true;
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && jobs.length) {
      await Promise.all(
        jobs.slice(0, 100).map(async (job) => {
          const response = await fetch(
            `${supabaseUrl}/rest/v1/jobs?on_conflict=source,external_id`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: 'resolution=merge-duplicates'
              },
              body: JSON.stringify(job)
            }
          );

          if (!response.ok) {
            const text = await response.text();
            console.error('Failed to save job', job.source, job.external_id, tryParseJson(text) || text);
          }
        })
      );
    }

    return NextResponse.json({
      ok: true,
      count: jobs.length,
      jobs
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Unknown server error'
      },
      { status: 500 }
    );
  }
}
