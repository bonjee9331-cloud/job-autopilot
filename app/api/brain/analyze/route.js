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
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `
You are an elite sales recruitment strategist.

Your job is to position the candidate as a TOP 0.01% performer.

STRICT RULES:
- No generic phrasing
- No fluff
- No “I am excited”
- No weak verbs (helped, assisted, worked on)
- Every sentence must imply PERFORMANCE, CONTROL, or IMPACT
- Never invent fake experience
- Reframe truth into high-performance positioning

OUTPUT MUST BE VALID JSON ONLY.

--------------------------------------

JOB:
${jobTitle} at ${company}

DESCRIPTION:
${jobDescription}

--------------------------------------

CANDIDATE PROFILE:
- Remote Sales Manager / Sales Leader
- Outbound sales leadership
- KPI driven (SPH, conversion, revenue)
- Coaching teams to hit targets
- Contact centre + sales ops
- Recruitment, onboarding, training
- Performance improvement systems
- Strong control of sales process

--------------------------------------

RETURN JSON:

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

--------------------------------------

INSTRUCTIONS:

1. KEYWORDS
Extract high-value ATS keywords from the job

2. STRENGTHS
Only include REAL strengths from candidate profile
Frame them like advantages, not traits

3. GAPS
Be honest but controlled
Do NOT make the candidate look weak

4. SUMMARY
Write like a high-performance operator
Tone: confident, commercial, decisive

5. SKILLS
Must be ATS-friendly AND commercially relevant

6. EXPERIENCE BULLETS (VERY IMPORTANT)
Write 8 bullets that:
- Show leadership
- Show revenue impact
- Show control over KPIs
- Sound like a top performer
- Avoid generic phrasing completely

Bad:
"Led a team"

Good:
"Built and drove performance across a remote outbound sales team, enforcing KPI discipline and consistently improving conversion rates"

7. RESUME SNAPSHOT
Combine:
- Summary
- Skills
- Bullets
Into a clean, interview-ready CV section

8. COVER LETTER (CRITICAL)
- Direct
- No fluff
- No begging tone
- Show VALUE quickly
- Make them want to interview

Bad:
"I am excited to apply..."

Good:
"I lead outbound sales teams to hit aggressive revenue targets through tight KPI control and high-performance coaching..."

9. FIT SCORE
Be realistic (0–100)

--------------------------------------

RETURN ONLY JSON
`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Return strict JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const text = await aiRes.text();
    const json = tryParseJson(text);

    if (!aiRes.ok || !json) {
      return NextResponse.json(
        { ok: false, error: 'AI failed', details: text },
        { status: 500 }
      );
    }

    const content = json.choices?.[0]?.message?.content;
    const parsed = typeof content === 'string' ? tryParseJson(content) : content;

    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: 'Invalid AI JSON', raw: content },
        { status: 500 }
      );
    }

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

    const saveText = await saveRes.text();
    const saved = tryParseJson(saveText);

    return NextResponse.json({
      ok: true,
      data: parsed,
      savedId: saved?.[0]?.id || null
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
