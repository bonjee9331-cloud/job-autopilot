import { NextResponse } from "next/server";
import { runOpenAIJson, runAnthropicJson } from "../../../lib/llm";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      job_title,
      company,
      job_description,
      tailored_summary,
      tailored_skills,
      tailored_experience_bullets,
      keywords,
      strengths,
      fit_score
    } = body;

    if (!job_title || !company) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required package data"
        },
        { status: 400 }
      );
    }

    const openAiPrompt = `
Create a sharp, ATS-safe, human-sounding cover letter for this exact role.

Return ONLY valid JSON in this exact shape:
{
  "subjectLine": "",
  "coverLetter": "",
  "keyThemes": []
}

Role: ${job_title}
Company: ${company}
Fit Score: ${fit_score || ""}
Job Description:
${job_description || ""}

Package Summary:
${tailored_summary || ""}

Tailored Skills:
${Array.isArray(tailored_skills) ? tailored_skills.join(", ") : ""}

Tailored Experience Bullets:
${Array.isArray(tailored_experience_bullets) ? tailored_experience_bullets.join("\n") : ""}

Keywords:
${Array.isArray(keywords) ? keywords.join(", ") : ""}

Strengths:
${Array.isArray(strengths) ? strengths.join(", ") : ""}

Rules:
- Do not fabricate achievements
- Keep tone natural, professional, and recruiter-safe
- Avoid clichés and obvious AI phrasing
- Align tightly to the target role
- Keep it concise and credible
`;

    const draft = await runOpenAIJson(
      openAiPrompt,
      "You are an expert career writing assistant. Return valid JSON only."
    );

    let finalData = draft;
    let warning = "";

    try {
      const anthropicPrompt = `
Refine this cover letter draft into a cleaner, sharper, more natural final version.

Return ONLY valid JSON in this exact shape:
{
  "subjectLine": "",
  "coverLetter": "",
  "keyThemes": []
}

Draft JSON:
${JSON.stringify(draft, null, 2)}

Rules:
- Keep all claims factual
- Improve flow, tone, and specificity
- Avoid fluff
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
        error: err.message || "Cover letter generation failed"
      },
      { status: 500 }
    );
  }
}
