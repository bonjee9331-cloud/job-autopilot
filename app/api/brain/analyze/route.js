import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '../../../../lib/jobs/fetchWithTimeout';
import { getSupabaseServer, isSupabaseConfigured } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_JD_LENGTH = 20000;
const MAX_TITLE_LENGTH = 200;
const MAX_COMPANY_LENGTH = 200;

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();

    if (!jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { ok: false, error: 'jobTitle, company, and jobDescription are required' },
        { status: 400 }
      );
    }

    if (
      jobTitle.length > MAX_TITLE_LENGTH ||
      company.length > MAX_COMPANY_LENGTH ||
      jobDescription.length > MAX_JD_LENGTH
    ) {
      return NextResponse.json(
        { ok: false, error: 'Input too long' },
        { status: 413 }
      );
    }

    const openaiResponse = await fetchWithTimeout(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are an expert job application strategist. Return strict JSON only. Never invent experience. Tailor honestly, strongly, and clearly for ATS-friendly screening.'
            },
            {
              role: 'user',
              content: buildUserPrompt({ jobTitle, company, jobDescription })
            }
          ],
          temperature: 0.3
        })
      },
      Number(process.env.LLM_TIMEOUT_MS || 30000)
    );

    const openaiText = await openaiResponse.text();
    const openaiJson = tryParseJson(openaiText);

    if (!openaiResponse.ok || !openaiJson) {
      return NextResponse.json(
        {
          ok: false,
          error: 'OpenAI request failed',
          status: openaiResponse.status
        },
        { status: 500 }
      );
    }

    const content = openaiJson.choices?.[0]?.message?.content || '';
    const parsed = typeof content === 'string' ? tryParseJson(content) : content;

    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: 'Model did not return valid JSON' },
        { status: 500 }
      );
    }

    let savedId = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServer();
        const { data, error } = await supabase
          .from('job_analyses')
          .insert({
            job_title: jobTitle,
            company,
            job_description: jobDescription,
            keywords: parsed.keywords,
            strengths: parsed.strengths,
            gaps: parsed.gaps,
            tailored_summary: parsed.tailoredSummary,
            tailored_skills: parsed.tailoredSkills,
            tailored_experience_bullets: parsed.tailoredExperienceBullets,
            resume_version_name: parsed.resumeVersionName,
            resume_snapshot: parsed.resumeSnapshot,
            cover_letter: parsed.coverLetter,
            fit_score: parsed.fitScore,
            application_status: 'draft'
          })
          .select('id')
          .single();

        if (error) {
          console.error('[analyze] supabase save failed:', error.message);
        } else {
          savedId = data?.id || null;
        }
      } catch (err) {
        console.error('[analyze] supabase save crashed:', err.message);
      }
    }

    return NextResponse.json({
      ok: true,
      modelOutput: parsed,
      savedId
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}

function buildUserPrompt({ jobTitle, company, jobDescription }) {
  return `
Analyze this job and return JSON in exactly this shape:

{
  "keywords": [],
  "strengths": [],
  "gaps": [],
  "tailoredSummary": "",
  "tailoredSkills": [],
  "tailoredExperienceBullets": [],
  "resumeVersionName": "",
  "resumeSnapshot": "",
  "coverLetter": "",
  "fitScore": 0
}

Candidate context:
- Name: Ben Lynch
- Target roles: Sales Manager, Sales Operations Manager, Sales Team Leader, Contact Center Manager, Remote Sales Manager
- Locations: Australia, New Zealand
- Remote only: Yes
- Minimum salary: $70k
- Excluded industries: Finance, Investments, Real Estate, Car Sales
- Background highlights:
  - Remote sales leadership
  - Team coaching and performance improvement
  - KPI tracking including conversion rates, revenue growth, and sales per hour
  - Contact center and sales operations thinking
  - Recruitment, onboarding, and training support
  - Business development and regional sales management
  - Strong stakeholder management and process improvement

Important rules:
- Do not invent tools, achievements, or experience
- Reframe honestly using only the candidate's real background
- Keep bullets sharp and credible
- Keep the cover letter concise and human

Job title:
${jobTitle}

Company:
${company}

Job description:
${jobDescription}

Instructions:
1. Extract the most important keywords and phrases from the job description
2. List the candidate's strongest matching strengths
3. List any meaningful gaps without inventing experience
4. Write a tailored professional summary for the CV
5. Write a tailored skills list
6. Write 8 tailored experience bullets aligned to the role
7. Create a clear resume version name using company and role
8. Create a resume snapshot that combines the tailored summary, skills, and experience bullets into a clean plain-text resume section
9. Write a sharp, specific cover letter for this exact role
10. Give a realistic fit score from 0 to 100

Return valid JSON only.
`;
}
