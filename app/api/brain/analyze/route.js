import { NextResponse } from 'next/server';

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();

    if (!jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        {
          ok: false,
          error: 'jobTitle, company, and jobDescription are required'
        },
        { status: 400 }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `
You are an elite-level job application strategist.

Your job is to produce high-performance, recruiter-ready application content that:
- ranks in the top 0.01% of candidates
- passes ATS systems
- sounds fully human and credible
- is commercially sharp and outcome-driven

CRITICAL RULES:
- NEVER invent fake metrics, percentages, revenue figures, or tools
- ONLY include numbers if clearly supported by the candidate context
- If no number is available, use strong commercial language instead
- No fluff, no filler, no weak generic claims
- Every bullet should sound like a top performer wrote it

WRITING STYLE:
- Direct
- Sharp
- Outcome-focused
- ATS-friendly
- Human
`
          },
          {
            role: 'user',
            content: `
Return JSON in exactly this structure:

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
- Target roles: Sales Manager, Sales Operations Manager, Sales Team Leader, Contact Center Manager, Remote Sales Manager, Telesales Manager
- Locations: Australia, New Zealand, remote-friendly roles with workable hours from Hua Hin
- Remote only preferred: Yes
- Minimum salary: $70k
- Excluded industries: Finance, Investments, Real Estate, Car Sales
- Background:
  - Remote sales leadership
  - Team coaching and performance improvement
  - KPI tracking including conversion rates, revenue, and sales per hour
  - Contact center and outbound sales environment
  - Recruitment, onboarding, and training
  - Sales operations and process improvement

Job title:
${jobTitle}

Company:
${company}

Job description:
${jobDescription}

Instructions:
1. Extract ATS keywords
2. Identify strongest matching strengths
3. Keep gaps minimal and real
4. Write a tailored CV summary
5. Write tailored skills
6. Write 8 tailored experience bullets
7. Create a resume version name using company and role
8. Create a resume snapshot
9. Write a role-specific cover letter
10. Give a realistic fit score

Return JSON only.
`
          }
        ],
        temperature: 0.3
      })
    });

    const openaiText = await openaiResponse.text();
    const openaiJson = tryParseJson(openaiText);

    if (!openaiResponse.ok || !openaiJson) {
      return NextResponse.json(
        {
          ok: false,
          error: 'OpenAI request failed',
          details: openaiJson || openaiText
        },
        { status: 500 }
      );
    }

    const content = openaiJson.choices?.[0]?.message?.content || '';
    const parsed = typeof content === 'string' ? tryParseJson(content) : content;

    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Model did not return valid JSON',
          raw: content
        },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/job_analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
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
    });

    const saveText = await saveResponse.text();
    const savedAnalysis = tryParseJson(saveText);

    if (!saveResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to save to Supabase',
          details: savedAnalysis || saveText
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      savedId: savedAnalysis?.[0]?.id || null
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
