import { NextResponse } from "next/server";
import { runOpenAIJson, runAnthropicJson } from "../../../lib/llm";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      job_title,
      company,
      job_description,
      tailoredSummary,
      tailoredExperienceBullets,
      tailoredSkills
    } = body;

    if (!job_title || !company || !job_description) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required interview prep fields"
        },
        { status: 400 }
      );
    }

    const openAiPrompt = `
You are an elite interview strategist for commercial and sales leadership roles.

Create interview preparation for this candidate.

ROLE:
${job_title}

COMPANY:
${company}

JOB DESCRIPTION:
${job_description}

CANDIDATE SUMMARY:
${tailoredSummary || ""}

CANDIDATE SKILLS:
${Array.isArray(tailoredSkills) ? tailoredSkills.join(", ") : ""}

CANDIDATE EXPERIENCE BULLETS:
${Array.isArray(tailoredExperienceBullets) ? tailoredExperienceBullets.join("\n") : ""}

Return ONLY valid JSON in this exact structure:
{
  "questions": [],
  "answers": [],
  "pitch": "",
  "companyAngles": [],
  "redFlags": []
}

Rules:
- Be commercially sharp
- Be recruiter-safe
- Do not fabricate
- Focus on sales leadership, KPI management, coaching, revenue, conversion, pipeline, team performance, and operations where relevant
`;

    const draft = await runOpenAIJson(
      openAiPrompt,
      "You are an expert interview preparation assistant. Return valid JSON only."
    );

    let finalData = draft;
    let warning = "";

    try {
      const anthropicPrompt = `
Refine this interview prep draft into a sharper, cleaner, more natural version.

Return ONLY valid JSON in this exact structure:
{
  "questions": [],
  "answers": [],
  "pitch": "",
  "companyAngles": [],
  "redFlags": []
}

Draft JSON:
${JSON.stringify(draft, null, 2)}

Rules:
- Keep it factual
- Improve clarity and realism
- Avoid AI-sounding language
- Return JSON only
`;

      finalData = await runAnthropicJson(anthropicPrompt);
    } catch (err) {
      warning = err.message || "Anthropic refinement failed, using OpenAI draft.";
    }

    return NextResponse.json({
      ok: true,
      data: finalData,
      warning
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Interview prep failed"
      },
      { status: 500 }
    );
  }
}
