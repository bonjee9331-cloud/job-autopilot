import { NextResponse } from "next/server";
import { runOpenAIJson, runAnthropicJson } from "../../../lib/llm";

function buildPrompt({
  mode,
  job_title,
  company,
  job_description,
  tailored_summary,
  tailored_skills,
  tailored_experience_bullets,
  keywords,
  strengths,
  fit_score
}) {
  const modeInstructions = {
    concise:
      "Write a short, sharp cover letter suitable for fast applications. Keep it tight, direct, and punchy.",
    standard:
      "Write a standard professional cover letter with strong structure, clear relevance, and natural recruiter-safe tone.",
    executive:
      "Write a more senior, polished, executive-style cover letter with stronger strategic framing and leadership emphasis."
  };

  return `
Create a high-quality, human-sounding cover letter for this exact role.

Return ONLY valid JSON in this exact shape:
{
  "subjectLine": "",
  "opening": "",
  "body": "",
  "closing": "",
  "fullLetter": "",
  "keyThemes": []
}

Mode:
${mode}

Mode instruction:
${modeInstructions[mode] || modeInstructions.standard}

Role:
${job_title}

Company:
${company}

Fit Score:
${fit_score || ""}

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
- Do not fabricate achievements, tools, or metrics
- Keep facts aligned with the resume timeline and package
- Avoid clichés, filler, and obvious AI phrasing
- Sound natural, credible, and recruiter-safe
- Make the relevance to the target role very clear
- Make the writing specific, not generic
- Make the final fullLetter email-ready and polished
`;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      mode = "standard",
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

    const draft = await runOpenAIJson(
      buildPrompt({
        mode,
        job_title,
        company,
        job_description,
        tailored_summary,
        tailored_skills,
        tailored_experience_bullets,
        keywords,
        strengths,
        fit_score
      }),
      "You are an expert cover letter writer for commercial roles. Return valid JSON only."
    );

    let finalData = draft;
    let warning = "";

    try {
      const refinePrompt = `
Refine this cover letter draft into a cleaner, sharper, more natural final version.

Return ONLY valid JSON in this exact shape:
{
  "subjectLine": "",
  "opening": "",
  "body": "",
  "closing": "",
  "fullLetter": "",
  "keyThemes": []
}

Draft JSON:
${JSON.stringify(draft, null, 2)}

Rules:
- Keep every factual claim intact
- Improve readability, flow, and specificity
- Avoid fluff and generic language
- Keep the tone professional and human
- Return JSON only
`;

      finalData = await runAnthropicJson(refinePrompt);
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
