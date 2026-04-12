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
      cover_letter,
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
Create a premium resume draft for this exact role.

Return ONLY valid JSON in this exact shape:
{
  "headline": "",
  "professionalSummary": "",
  "keySkills": [],
  "experienceBullets": [],
  "atsKeywords": [],
  "coverLetterIntro": "",
  "resumeBody": ""
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

Cover Letter:
${cover_letter || ""}

Rules:
- Do not invent fake metrics
- Make it ATS-friendly
- Make it commercially sharp
- Make it sound human
- Make the resume targeted to this exact role
- Keep the output concise and recruiter-friendly
`;

    const openAiDraft = await runOpenAIJson(
      openAiPrompt,
      "You are an expert resume writer. Return valid JSON only."
    );

    const anthropicPrompt = `
Refine this resume draft into a sharper, cleaner, more premium final version.

Return ONLY valid JSON in this exact shape:
{
  "headline": "",
  "professionalSummary": "",
  "keySkills": [],
  "experienceBullets": [],
  "atsKeywords": [],
  "coverLetterIntro": "",
  "resumeBody": "",
  "finalNotes": []
}

Original draft JSON:
${JSON.stringify(openAiDraft, null, 2)}

Rules:
- Keep it credible
- No invented tools or metrics
- Improve clarity, confidence, and commercial edge
- Strengthen readability and recruiter impact
- Return JSON only
- Keep the structure tight and polished
`;

    let finalResume = {
      ...openAiDraft,
      finalNotes: ["Built from OpenAI draft only."]
    };
    let warning = "";

    try {
      const refined = await runAnthropicJson(anthropicPrompt);
      finalResume = refined;
    } catch (err) {
      warning =
        err.message ||
        "Anthropic refinement failed, using OpenAI draft instead.";

      finalResume = {
        ...openAiDraft,
        finalNotes: [
          "Anthropic refinement was unavailable, so this version is the OpenAI draft."
        ]
      };
    }

    return NextResponse.json({
      ok: true,
      data: finalResume,
      draft: openAiDraft,
      warning
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Resume builder failed"
      },
      { status: 500 }
    );
  }
}
