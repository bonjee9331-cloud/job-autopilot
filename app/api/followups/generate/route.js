import { NextResponse } from "next/server";
import { runOpenAIJson, runAnthropicJson } from "../../../../lib/llm";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      job_title,
      company,
      mode = "post_application"
    } = body;

    const prompt = `
Create a follow-up email.

Return JSON:
{
  "subject": "",
  "email": ""
}

Mode: ${mode}

Role: ${job_title}
Company: ${company}

Rules:
- natural tone
- not pushy
- professional
- short and clear
- no AI phrasing
`;

    const draft = await runOpenAIJson(prompt);

    let finalData = draft;

    try {
      finalData = await runAnthropicJson(`
Refine this email.

Return same JSON format.

${JSON.stringify(draft)}
`);
    } catch {}

    return NextResponse.json({
      ok: true,
      data: finalData
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
