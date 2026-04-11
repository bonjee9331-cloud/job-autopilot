import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    // 🔥 TIMEOUT PROTECTION (8 seconds max)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // ===== PRIMARY MODEL (OPENAI - FAST) =====
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // FAST model
        messages: [
          {
            role: "system",
            content: "You are an elite resume writer. Output VALID JSON ONLY.",
          },
          {
            role: "user",
            content: `
Build a professional resume from this:

${JSON.stringify(body)}

Return ONLY JSON with:
headline, professionalSummary, keySkills, experienceBullets, atsKeywords, coverLetterIntro, resumeBody, finalNotes
            `,
          },
        ],
        temperature: 0.7,
      }),
    });

    clearTimeout(timeout);

    const openaiData = await openaiRes.json();

    let parsed;

    try {
      const content = openaiData.choices[0].message.content;
      parsed = JSON.parse(content);
    } catch (err) {
      return NextResponse.json({
        ok: false,
        error: "OpenAI returned invalid JSON",
        raw: openaiData,
      });
    }

    // ===== OPTIONAL SECONDARY (NON-BLOCKING) =====
    let warning = "";

    try {
      const anthRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", // ⚡ FAST model
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `Improve this resume slightly, return JSON only:\n${JSON.stringify(parsed)}`,
            },
          ],
        }),
      });

      const anthData = await anthRes.json();

      try {
        const text = anthData.content?.[0]?.text;
        const refined = JSON.parse(text);
        parsed = refined;
      } catch {
        warning = "Anthropic refinement skipped (invalid JSON)";
      }
    } catch {
      warning = "Anthropic skipped (timeout or error)";
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      warning,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      ok: false,
      error: err.message || "Server error",
    });
  }
}
