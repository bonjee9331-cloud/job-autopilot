import { NextResponse } from 'next/server';
import { runOpenAIJson } from '../../../../lib/llm';

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = `Return JSON only in this shape:
{
  "questions": [],
  "answers": [],
  "pitch": "",
  "companyAngles": [],
  "redFlags": []
}

Role: ${body.job_title}
Company: ${body.company}
Job description: ${body.job_description}
Summary: ${body.tailored_summary || ''}
Skills: ${(body.tailored_skills || []).join(', ')}
Experience: ${(body.tailored_experience_bullets || []).join('\n')}

Write role-specific interview prep for a senior commercial candidate. No fabricated facts.`;

    const prep = await runOpenAIJson(prompt, 'You generate factual interview preparation. Return JSON only.');
    return NextResponse.json({ ok: true, data: prep });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Interview prep failed' }, { status: 500 });
  }
}
