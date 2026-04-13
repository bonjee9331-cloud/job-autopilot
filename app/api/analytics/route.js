import { NextResponse } from "next/server";

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start, end) {
  const a = safeDate(start);
  const b = safeDate(end);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return ms >= 0 ? Math.round(ms / (1000 * 60 * 60 * 24)) : null;
}

function average(values) {
  const valid = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!valid.length) return 0;
  return Number((valid.reduce((sum, v) => sum + v, 0) / valid.length).toFixed(1));
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase environment variables"
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/job_analyses?select=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    const text = await response.text();

    let items;
    try {
      items = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON returned from analytics query");
    }

    if (!response.ok || !Array.isArray(items)) {
      throw new Error(items?.message || "Failed to load analytics data");
    }

    const totalTargets = items.length;
    const shortlisted = items.filter((x) => x.pipeline_status === "shortlisted");
    const saved = items.filter((x) => x.pipeline_status === "saved");
    const ignored = items.filter((x) => x.pipeline_status === "ignored");
    const applied = items.filter((x) => x.application_status === "applied");

    const interviews = items.filter(
      (x) =>
        x.application_status === "interview" ||
        x.pipeline_status === "interview" ||
        x.interview_scheduled_at
    );

    const offers = items.filter(
      (x) =>
        x.application_status === "offer" ||
        x.pipeline_status === "offer"
    );

    const responses = items.filter(
      (x) =>
        x.application_status === "interview" ||
        x.pipeline_status === "interview" ||
        x.interview_scheduled_at ||
        x.application_status === "offer" ||
        x.pipeline_status === "offer"
    );

    const applicationRate = totalTargets ? Number(((applied.length / totalTargets) * 100).toFixed(1)) : 0;
    const interviewRate = applied.length ? Number(((interviews.length / applied.length) * 100).toFixed(1)) : 0;
    const offerRate = interviews.length ? Number(((offers.length / interviews.length) * 100).toFixed(1)) : 0;
    const responseRate = applied.length ? Number(((responses.length / applied.length) * 100).toFixed(1)) : 0;

    const timeToInterviewValues = interviews
      .map((item) => daysBetween(item.applied_at || item.created_at, item.interview_scheduled_at || item.updated_at))
      .filter((v) => v !== null);

    const avgTimeToInterview = average(timeToInterviewValues);

    const packagesByVersionMap = new Map();
    for (const item of items) {
      const key = item.resume_version_name || "Unnamed Version";
      if (!packagesByVersionMap.has(key)) {
        packagesByVersionMap.set(key, {
          version: key,
          count: 0,
          applied: 0,
          interviews: 0,
          offers: 0,
          avgFit: 0,
          fitValues: []
        });
      }

      const row = packagesByVersionMap.get(key);
      row.count += 1;
      if (item.application_status === "applied") row.applied += 1;
      if (
        item.application_status === "interview" ||
        item.pipeline_status === "interview" ||
        item.interview_scheduled_at
      ) row.interviews += 1;
      if (
        item.application_status === "offer" ||
        item.pipeline_status === "offer"
      ) row.offers += 1;
      if (typeof item.fit_score === "number") row.fitValues.push(item.fit_score);
    }

    const packagePerformance = [...packagesByVersionMap.values()]
      .map((row) => ({
        version: row.version,
        count: row.count,
        applied: row.applied,
        interviews: row.interviews,
        offers: row.offers,
        avgFit: average(row.fitValues),
        interviewRate: row.applied ? Number(((row.interviews / row.applied) * 100).toFixed(1)) : 0,
        offerRate: row.interviews ? Number(((row.offers / row.interviews) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.interviewRate - a.interviewRate || b.avgFit - a.avgFit)
      .slice(0, 10);

    const sourceMap = new Map();
    for (const item of items) {
      const source = item.source || "unknown";
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          count: 0,
          applied: 0,
          interviews: 0,
          offers: 0
        });
      }

      const row = sourceMap.get(source);
      row.count += 1;
      if (item.application_status === "applied") row.applied += 1;
      if (
        item.application_status === "interview" ||
        item.pipeline_status === "interview" ||
        item.interview_scheduled_at
      ) row.interviews += 1;
      if (
        item.application_status === "offer" ||
        item.pipeline_status === "offer"
      ) row.offers += 1;
    }

    const sourcePerformance = [...sourceMap.values()]
      .map((row) => ({
        ...row,
        applicationRate: row.count ? Number(((row.applied / row.count) * 100).toFixed(1)) : 0,
        interviewRate: row.applied ? Number(((row.interviews / row.applied) * 100).toFixed(1)) : 0,
        offerRate: row.interviews ? Number(((row.offers / row.interviews) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.interviewRate - a.interviewRate || b.applicationRate - a.applicationRate);

    const recentActivity = [...items]
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
      .slice(0, 12)
      .map((item) => ({
        id: item.id,
        job_title: item.job_title,
        company: item.company,
        pipeline_status: item.pipeline_status || "new",
        application_status: item.application_status || "draft",
        updated_at: item.updated_at || item.created_at,
        fit_score: item.fit_score ?? 0
      }));

    return NextResponse.json({
      ok: true,
      summary: {
        totalTargets,
        shortlisted: shortlisted.length,
        saved: saved.length,
        ignored: ignored.length,
        applied: applied.length,
        interviews: interviews.length,
        offers: offers.length,
        applicationRate,
        interviewRate,
        offerRate,
        responseRate,
        avgTimeToInterview
      },
      packagePerformance,
      sourcePerformance,
      recentActivity
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Failed to load analytics"
      },
      { status: 500 }
    );
  }
}
