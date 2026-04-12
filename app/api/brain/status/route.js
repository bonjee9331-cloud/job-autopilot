import { NextResponse } from "next/server";

export async function GET() {
  try {
    const status = {
      ok: true,
      sniperMode: process.env.BRAIN_MODE || "precision",
      primaryModel: process.env.PRIMARY_LLM || "openai",
      secondaryModel: process.env.SECONDARY_LLM || "anthropic",
      automations: {
        jobSearch: true,
        packageGeneration: true,
        resumeBuilder: true,
        coverLetterEngine: true,
        interviewPrep: true,
        followUpGeneration: true,
        autoApply: false,
        calendarSync: false,
        analytics: false
      },
      dailyRun: {
        jobsScanned: 0,
        shortlisted: 0,
        packagesGenerated: 0,
        followUpsDue: 0,
        interviewsPrepared: 0
      },
      notes: [
        "Auto-apply is disabled until approval flow is built.",
        "Calendar sync is not connected yet.",
        "Analytics engine is not active yet."
      ]
    };

    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Failed to load brain status"
      },
      { status: 500 }
    );
  }
}
