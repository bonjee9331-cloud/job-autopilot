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
        messages: [
          {
            role: 'system',
            content:
              'You are an expert job application strategist. Return strict JSON only. Never invent experience. Tailor honestly, strongly, and clearly for ATS-friendly screening.'
          },
          {
            role: 'user',
            content: `
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
  - KPI tracking including conversion, revenue, and sales per hour
  - Contact center and sales operations thinking
  - Recruitment, onboarding, and training support
  - Business development and regional sales management
  - Strong stakeholder management and process improvement
- Important rule:
  - Do not invent tools, achievements, or experience
  - Reframe honestly using only the candidate's real background

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
6. Write 8 to 12 tailored experience bullets aligned to the role
7. Create a clear resume version name using company and role
8. Create a resume snapshot that combines the tailored summary, skills, and experience bullets into a clean plain-text resume section
9. Write a sharp, specific cover letter for this exact role
10. Give a realistic fit score from 0 to 100

Return valid JSON only.
`
          }
        ],
        temperature: 0.4
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

    const primaryText = openaiJson.choices?.[0]?.message?.content || '';

    let finalText = primaryText;

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `
You are reviewing a JSON response for a job application workflow.

IMPORTANT:
- You MUST return valid JSON
- Do NOT add explanations
- Do NOT add text outside JSON
- Do NOT change the structure
- Do NOT invent experience
- Improve clarity, strength, credibility, and natural language

Here is the JSON to improve:
${primaryText}

Return ONLY valid JSON.
`
            }
          ]
        })
      });

      const anthropicText = await anthropicResponse.text();
      const anthropicJson = tryParseJson(anthropicText);

      if (!anthropicResponse.ok || !anthropicJson) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Anthropic request failed',
            details: anthropicJson || anthropicText
          },
          { status: 500 }
        );
      }

      finalText = anthropicJson?.content?.[0]?.text || primaryText;
    }

    const parsed = tryParseJson(finalText);

    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Model did not return valid JSON',
          raw: finalText
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
        company: company,
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
      modelOutput: parsed,
      savedAnalysis
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
