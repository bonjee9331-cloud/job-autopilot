import { NextResponse } from 'next/server';
import { runOpenAIJson, runAnthropicJson } from '../../../../lib/llm';

export async function POST(req) {
  try {
    const body = await req.json();
    const openAiPrompt = `Return JSON only:
{
  "headline": "",
  "professionalSummary": "",
  "keySkills": [],
  "experienceBullets": [],
  "atsKeywords": [],
  "coverLetterIntro": "",
  "resumeBody": ""
}

Create a premium resume draft for:
Role: ${body.job_title}
Company: ${body.company}
Description: ${body.job_description || ''}
Summary: ${body.tailored_summary || ''}
Skills: ${(body.tailored_skills || []).join(', ')}
Experience bullets: ${(body.tailored_experience_bullets || []).join('\n')}
Keywords: ${(body.keywords || []).join(', ')}
Strengths: ${(body.strengths || []).join(', ')}

Rules: factual, ATS-friendly, no invented metrics, natural tone.`;

    const openAiDraft = await runOpenAIJson(openAiPrompt, 'You write factual, polished resumes. Return JSON only.');

    let finalResume = { ...openAiDraft, finalNotes: ['Built from OpenAI draft only.'] };
    let warning = '';
    try {
      finalResume = await runAnthropicJson(`Refine this resume draft without changing facts. Return JSON only in same schema with finalNotes added.\n\n${JSON.stringify(openAiDraft, null, 2)}`);
    } catch (error) {
      warning = error.message || 'Anthropic refinement failed';
    }

    return NextResponse.json({ ok: true, data: finalResume, draft: openAiDraft, warning });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Resume builder failed' }, { status: 500 });
  }
}
