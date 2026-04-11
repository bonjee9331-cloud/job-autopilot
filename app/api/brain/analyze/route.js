import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();

    if (!jobDescription) {
      return NextResponse.json(
        { ok: false, error: 'Missing job description' },
        { status: 400 }
      );
    }

    // ---------- PRIMARY LLM (OpenAI) ----------
    const primaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
              'You are an elite job application strategist. Extract structured insights and return STRICT JSON only.'
          },
          {
            role: 'user',
            content: `
Analyze this job description and return JSON:

{
  "keywords": [],
  "strengths": [],
  "gaps": [],
  "tailoredSummary": "",
  "coverLetter": "",
  "fitScore": 0
}

Job:
${jobDescription}
`
          }
        ],
        temperature: 0.7
      })
    });

    const primaryData = await primaryRes.json();
    const primaryText = primaryData.choices?.[0]?.message?.content || '';

    // ---------- SECONDARY LLM (Anthropic) ----------
    let secondaryText = '';

    if (process.env.ANTHROPIC_API_KEY) {
      const secondaryRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `
Refine this output and ensure it is valid JSON only:

${primaryText}
`
            }
          ]
        })
      });

      const secondaryData = await secondaryRes.json();
      secondaryText = secondaryData?.content?.[0]?.text || '';
    }

    // ---------- FINAL OUTPUT ----------
    const finalText = secondaryText || primaryText;

    let parsed;
    try {
      parsed = JSON.parse(finalText);
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Model did not return valid JSON',
          raw: finalText
        },
        { status: 500 }
      );
    }

    // ---------- SUPABASE SAVE ----------
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const saveRes = await fetch(`${supabaseUrl}/rest/v1/job_analyses`, {
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
        cover_letter: parsed.coverLetter,
        fit_score: parsed.fitScore
      })
    });

    const savedAnalysis = await saveRes.json();

    if (!saveRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to save to Supabase',
          details: savedAnalysis
        },
        { status: 500 }
      );
    }

    // ---------- SUCCESS ----------
    return NextResponse.json({
      ok: true,
      modelOutput: parsed,
      savedAnalysis
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
