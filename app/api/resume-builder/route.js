import { NextResponse } from "next/server";

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanJsonText(text) {
  return String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function runOpenAI(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.35,
    }),
  });

  const text = await response.text();
  const data = tryParseJson(text);

  if (!response.ok || !data) {
    throw new Error(`OpenAI draft generation failed: ${text}`);
  }

  const content = data?.choices?.[0]?.message?.content || "";
  const parsed =
    typeof content === "string" ? tryParseJson(cleanJsonText(content)) : content;

  if (!parsed) {
    throw new Error("OpenAI returned invalid JSON");
  }

  return parsed;
}

async function runAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 1800,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const text = await response.text();
  const data = tryParseJson(text);

  if (!response.ok || !data) {
    throw new Error(`Anthropic API request failed: ${text}`);
  }

  const content = data?.content?.[0]?.text || "";
  const cleaned = cleanJsonText(content);
  const parsed = tryParseJson(cleaned);

  if (!parsed) {
    throw new Error(`Anthropic returned invalid JSON: ${content}`);
  }

  return parsed;
}

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
      fit_score,
    } = body;

    if (!job_title || !company) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required package data",
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

    const openAiDraft = await runOpenAI(openAiPrompt);

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
      finalNotes: ["Built from OpenAI draft only."],
    };
    let warning = "";

    try {
      const refined = await runAnthropic(anthropicPrompt);
      finalResume = refined;
    } catch (anthropicError) {
      warning =
        anthropicError.message ||
        "Anthropic refinement failed, using OpenAI draft instead.";

      finalResume = {
        ...openAiDraft,
        finalNotes: [
          "Anthropic refinement was unavailable, so this version is the OpenAI draft.",
        ],
      };
    }

    return NextResponse.json({
      ok: true,
      data: finalResume,
      draft: openAiDraft,
      warning,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Resume builder failed",
      },
      { status: 500 }
    );
  }
}
