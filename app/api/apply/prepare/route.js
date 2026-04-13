import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      job,
      resume,
      coverLetter
    } = body;

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Missing job data" },
        { status: 400 }
      );
    }

    const prepared = {
      job_title: job.title,
      company: job.company,
      apply_url: job.apply_url,

      fields: {
        full_name: "Ben Lynch",
        email: "your-email@example.com",
        phone: "your-phone",
        location: "Hua Hin, Thailand",
        work_authorization: "Eligible for remote work",
      },

      assets: {
        resume: resume || null,
        cover_letter: coverLetter || null
      },

      notes: [
        "Review all fields before submitting",
        "Ensure resume matches role",
        "Ensure cover letter tone fits company"
      ]
    };

    return NextResponse.json({
      ok: true,
      data: prepared
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
