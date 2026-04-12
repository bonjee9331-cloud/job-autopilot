import { NextResponse } from 'next/server';
import { ... } from "../../../lib/llm";

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = `Return JSON only: {"subject":"", "coverLetter":"", "whyThisRole":[""], "timelineCheck":""}

Write a sharp, human cover letter for:
Role: ${body.job_title}
Company: ${body.company}
Job description: ${body.job_description}
Candidate summary: ${body.tailored_summary}
Skills: ${(body.tailored_skills || []).join(', ')}
Experience bullets: ${(body.tailored_experience_bullets || []).join('\n')}

Rules:
- factual only
- no fabricated metrics
- ATS-safe
- consistent with timeline
- commercially sharp but natural`;

    const draft = await runOpenAIJson(prompt, 'You write crisp, human, recruiter-safe cover letters. Return JSON only.');
    let final = draft;
    let warning = '';
    try {
      final = await runAnthropicJson(`Polish this cover letter without changing facts. Return same JSON schema only.\n\n${JSON.stringify(draft, null, 2)}`);
    } catch (error) {
      warning = error.message || 'Anthropic refinement skipped';
    }

    return NextResponse.json({ ok: true, data: final, warning });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to generate cover letter' }, { status: 500 });
  }
}
