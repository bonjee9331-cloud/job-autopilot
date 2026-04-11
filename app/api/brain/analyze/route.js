import { runBrain } from '../../../../lib/llm';
import { candidateProfile } from '../../../../lib/data';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export async function POST(request) {
  try {
    const body = await request.json();
    const jobTitle = body.jobTitle || '';
    const company = body.company || '';
    const jobDescription = body.jobDescription || '';

    if (!jobTitle || !company || !jobDescription) {
      return Response.json(
        {
          ok: false,
          error: 'jobTitle, company, and jobDescription are required'
        },
        { status: 400 }
      );
    }

    const prompt = `
You are helping tailor a job application for this candidate.

Candidate profile:
${JSON.stringify(candidateProfile, null, 2)}

Target company:
${company}

Target role:
${jobTitle}

Job description:
${jobDescription}

Your job:
1. Extract the most important keywords and phrases from the job description
2. Identify the candidate strengths most relevant to this role
3. Identify any gaps, but do not invent experience
4. Rewrite a short tailored professional summary for the CV
5. Write a sharp, specific cover letter for this role
6. Give a fit score from 0 to 100

Return your answer in this exact JSON shape:

{
  "keywords": ["keyword 1", "keyword 2"],
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "tailoredSummary": "short CV summary here",
  "coverLetter": "full cover letter here",
  "fitScore": 85
}

Return valid JSON only.
`;

    const result = await runBrain(prompt);

    let parsed;
    try {
      parsed = JSON.parse(result.final);
    } catch (error) {
      return Response.json(
        {
          ok: false,
          error: 'Model did not return valid JSON',
          raw: result.final
        },
        { status: 500 }
      );
    }
await supabase.from('job_analyses').insert([
  {
    job_title: jobTitle,
    company: company,
    job_description: jobDescription,
    keywords: parsed.keywords,
    strengths: parsed.strengths,
    gaps: parsed.gaps,
    tailored_summary: parsed.tailoredSummary,
    cover_letter: parsed.coverLetter,
    fit_score: parsed.fitScore
  }
]);
    return Response.json({
      ok: true,
      modelOutput: parsed,
      drafts: {
        primary: result.primary,
        secondary: result.secondary,
        final: result.final
      }
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
