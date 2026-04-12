"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Not set";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Not set";
  }
}

function isOverdue(value) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

function fitClass(score) {
  const value = Number(score || 0);
  if (value >= 85) return "badge badge-green";
  if (value >= 65) return "badge badge-blue";
  if (value >= 45) return "badge badge-yellow";
  return "badge badge-red";
}

function statusBadge(status) {
  const value = String(status || "new").toLowerCase();

  if (value === "shortlisted") return "badge badge-green";
  if (value === "saved") return "badge badge-blue";
  if (value === "ignored") return "badge badge-red";
  if (value === "applied") return "badge badge-orange";
  return "badge badge-yellow";
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="card">
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ marginBottom: "6px" }}>{title}</h2>
        {subtitle ? <p className="small">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ItemCard({ item, compact }) {
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: compact ? "12px" : "14px",
        background: "rgba(255,255,255,0.02)",
        display: "grid",
        gap: "8px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <strong>{item.job_title}</strong>
          <div className="small">{item.company}</div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "start" }}>
          <span className={fitClass(item.fit_score)}>{item.fit_score ?? "-"}</span>
          <span className={statusBadge(item.pipeline_status || item.application_status || "new")}>
            {item.pipeline_status || item.application_status || "new"}
          </span>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="small">Created: {formatDate(item.created_at)}</div>
          {item.applied_at ? <div className="small">Applied: {formatDate(item.applied_at)}</div> : null}
          {item.follow_up_due_at ? (
            <div className="small">
              Follow-up: {formatDate(item.follow_up_due_at)}
              {isOverdue(item.follow_up_due_at) ? " · Overdue" : ""}
            </div>
          ) : null}
        </>
      ) : null}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <a href="/packages" className="btn btn-secondary">Open Package</a>
        {item.application_status === "applied" ? (
          <a href="/followups" className="btn btn-secondary">Follow-up</a>
        ) : null}
        <a href="/interviews" className="btn btn-secondary">Interview Prep</a>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/dashboard");
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server returned non-JSON response");
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to load dashboard");
        }

        setSummary(data.summary || null);
        setItems(data.items || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const derived = useMemo(() => {
    const shortlisted = items
      .filter((x) => x.pipeline_status === "shortlisted")
      .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

    const saved = items
      .filter((x) => x.pipeline_status === "saved")
      .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));

    const applied = items
      .filter((x) => x.application_status === "applied")
      .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0));

    const overdue = applied
      .filter((x) => x.follow_up_due_at && isOverdue(x.follow_up_due_at))
      .sort((a, b) => new Date(a.follow_up_due_at) - new Date(b.follow_up_due_at));

    const upcoming = applied
      .filter((x) => x.follow_up_due_at && !isOverdue(x.follow_up_due_at))
      .sort((a, b) => new Date(a.follow_up_due_at) - new Date(b.follow_up_due_at));

    const recent = [...items]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6);

    const topFit = [...items]
      .filter((x) => (x.fit_score || 0) >= 75)
      .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
      .slice(0, 6);

    const dailyActions = [
      ...overdue.slice(0, 3).map((x) => ({
        type: "follow-up",
        label: `Follow up with ${x.company} for ${x.job_title}`,
        href: "/followups"
      })),
      ...shortlisted.slice(0, 3).map((x) => ({
        type: "package",
        label: `Generate or review package for ${x.job_title}`,
        href: "/packages"
      })),
      ...topFit.slice(0, 2).map((x) => ({
        type: "apply",
        label: `Priority target: ${x.job_title} at ${x.company}`,
        href: "/jobs"
      }))
    ].slice(0, 8);

    return {
      shortlisted,
      saved,
      applied,
      overdue,
      upcoming,
      recent,
      topFit,
      dailyActions
    };
  }, [items]);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Pipeline Command Center</h1>
        <p>
          See what needs action now, track your highest-value targets, and move your applications through the pipeline with zero guesswork.
        </p>
      </section>

      {loading ? (
        <section className="card">
          <p>Loading dashboard...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</p>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section className="grid">
            <div className="card">
              <h2>Total Targets</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.total}</p>
            </div>
            <div className="card">
              <h2>Shortlisted</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.shortlisted}</p>
            </div>
            <div className="card">
              <h2>Saved</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.saved}</p>
            </div>
            <div className="card">
              <h2>Applied</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.applied}</p>
            </div>
            <div className="card">
              <h2>Follow-ups Due</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.followupsDue}</p>
            </div>
            <div className="card">
              <h2>Ignored</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{summary.ignored}</p>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <SectionCard
              title="Daily Actions"
              subtitle="The highest-impact moves to make next."
            >
              {derived.dailyActions.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.dailyActions.map((action, index) => (
                    <div
                      key={`${action.type}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "center",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "12px"
                      }}
                    >
                      <div>
                        <strong>{action.label}</strong>
                        <div className="small">Action type: {action.type}</div>
                      </div>
                      <a href={action.href} className="btn btn-primary">Open</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No urgent actions right now.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Overdue Follow-ups"
              subtitle="These need attention first."
            >
              {derived.overdue.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.overdue.slice(0, 5).map((item) => (
                    <ItemCard key={item.id} item={item} compact />
                  ))}
                </div>
              ) : (
                <p>No overdue follow-ups.</p>
              )}
            </SectionCard>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <SectionCard
              title="Top-Fit Shortlist"
              subtitle="Your strongest current targets."
            >
              {derived.shortlisted.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.shortlisted.slice(0, 6).map((item) => (
                    <ItemCard key={item.id} item={item} compact />
                  ))}
                </div>
              ) : (
                <p>No shortlisted targets yet.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Packages"
              subtitle="Most recently created role packages."
            >
              {derived.recent.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.recent.map((item) => (
                    <ItemCard key={item.id} item={item} compact />
                  ))}
                </div>
              ) : (
                <p>No recent packages yet.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Applied Pipeline"
              subtitle="Roles already in motion."
            >
              {derived.applied.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.applied.slice(0, 6).map((item) => (
                    <ItemCard key={item.id} item={item} compact />
                  ))}
                </div>
              ) : (
                <p>No applied roles yet.</p>
              )}
            </SectionCard>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <SectionCard
              title="Upcoming Follow-ups"
              subtitle="Scheduled next touches that are not overdue yet."
            >
              {derived.upcoming.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.upcoming.slice(0, 8).map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p>No upcoming follow-ups queued.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Saved For Later"
              subtitle="Targets worth keeping warm."
            >
              {derived.saved.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {derived.saved.slice(0, 8).map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p>No saved targets yet.</p>
              )}
            </SectionCard>
          </section>
        </>
      ) : null}
    </main>
  );
}
