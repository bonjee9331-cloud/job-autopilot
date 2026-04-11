import { NextResponse } from "next/server";

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

    const prompt = `
You are an elite interview strategist for commercial and sales leadership roles.

Your task is to create interview preparation for this candidate.

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
  "questions": [
    "10 tailored interview questions"
  ],
  "answers": [
    "10 strong, commercially sharp answers matching the questions in order"
  ],
  "pitch": "A confident 60-second tell-me-about-yourself answer",
  "companyAngles": [
    "5 smart talking points tailored to this company and role"
  ],
  "redFlags": [
    "5 risks or difficult questions the interviewer may raise"
  ]
}

Rules:
- Be direct, sharp, and commercially credible
- No fake metrics unless already provided
- Make answers sound human and interview-ready
- Focus on sales leadership, KPI management, coaching, revenue, conversion, pipeline, team performance, and operations where relevant
- Return JSON only
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5
      })
    });

    const text = await response.text();
    const data = tryParseJson(text);

    if (!response.ok || !data) {
      return NextResponse.json(
        {
          ok: false,
          error: "OpenAI request failed",
          details: data || text
        },
        { status: 500 }
      );
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = typeof content === "string" ? tryParseJson(content) : content;

    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Model did not return valid JSON",
          raw: content
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: parsed
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
