import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { runOpenAIJson, runAnthropicJson } from '../../../../lib/llm';

export async function POST(req) {
  try {
    const { jobTitle, company, jobDescription, source, applyUrl, location, salaryText, remote, fitScore, matchedTitle } = await req.json();
    if (!jobTitle || !company || !jobDescription) {
      return NextResponse.json({ ok: false, error: 'jobTitle, company, and jobDescription are required' }, { status: 400 });
    }

    const basePrompt = `
Return valid JSON in this shape:
{
  "keywords": [],
  "strengths": [],
  "gaps": [],
  "tailoredSummary": "",
  "tailoredSkills": [],
  "tailoredExperienceBullets": [],
  "resumeVersionName": "",
  "resumeSnapshot": "",
  "coverLetter": ""
}

Candidate context:
- Name: Ben Lynch
- Core strengths: remote sales leadership, sales operations, outbound performance management, KPI coaching, recruitment, onboarding, contact centre leadership
- Rules: factual only, no hallucinated claims, ATS-safe, natural professional tone, no AI clichés, quantified language only when grounded.

Role: ${jobTitle}
Company: ${company}
Job description: ${jobDescription}
`;

    const draft = await runOpenAIJson(basePrompt, 'You write factual, recruiter-safe application packages. Return JSON only.');

    let refined = draft;
    let warning = '';

    try {
      refined = await runAnthropicJson(`Refine this application package without changing facts. Return the same JSON schema only.\n\n${JSON.stringify(draft, null, 2)}`);
    } catch (error) {
      warning = error.message || 'Anthropic refinement skipped';
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('job_analyses').insert({
      job_title: jobTitle,
      company,
      job_description: jobDescription,
      source: source || null,
      apply_url: applyUrl || null,
      location: location || null,
      salary_text: salaryText || null,
      remote: remote ?? false,
      matched_title: matchedTitle || null,
      keywords: refined.keywords || [],
      strengths: refined.strengths || [],
      gaps: refined.gaps || [],
      tailored_summary: refined.tailoredSummary || '',
      tailored_skills: refined.tailoredSkills || [],
      tailored_experience_bullets: refined.tailoredExperienceBullets || [],
      resume_version_name: refined.resumeVersionName || `${company}_${jobTitle}`,
      resume_snapshot: refined.resumeSnapshot || '',
      cover_letter: refined.coverLetter || '',
      fit_score: fitScore || 0,
      pipeline_status: 'new',
      application_status: 'draft'
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data: refined, warning, savedId: data.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to analyze job' }, { status: 500 });
  }
}
