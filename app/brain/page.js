"use client";

import { useEffect, useState } from "react";

function ToggleRow({ label, value, description }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "16px",
        alignItems: "center",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px"
      }}
    >
      <div>
        <strong>{label}</strong>
        {description ? <div className="small">{description}</div> : null}
      </div>

      <span className={value ? "badge badge-green" : "badge badge-red"}>
        {value ? "Active" : "Off"}
      </span>
    </div>
  );
}

export default function BrainPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStatus() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/brain/status");
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid JSON from brain status API");
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to load brain status");
        }

        setStatus(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load brain status");
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Brain Dashboard</h1>
        <p>
          Control the sniper system, monitor live capability status, and see what is active across search, generation, follow-up, and future automations.
        </p>
      </section>

      {loading ? (
        <section className="card">
          <p>Loading brain status...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</p>
        </section>
      ) : null}

      {status ? (
        <>
          <section className="grid">
            <div className="card">
              <h2>Sniper Mode</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{status.sniperMode}</p>
            </div>
            <div className="card">
              <h2>Primary Model</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{status.primaryModel}</p>
            </div>
            <div className="card">
              <h2>Secondary Model</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>{status.secondaryModel}</p>
            </div>
            <div className="card">
              <h2>System State</h2>
              <p style={{ fontSize: "28px", fontWeight: 800 }}>
                {status.ok ? "Operational" : "Degraded"}
              </p>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "20px",
              alignItems: "start"
            }}
          >
            <section className="card">
              <h2>Automation Matrix</h2>
              <div className="stack" style={{ marginTop: "14px" }}>
                <ToggleRow
                  label="Job Search"
                  value={status.automations.jobSearch}
                  description="Live target acquisition and filtering"
                />
                <ToggleRow
                  label="Package Generation"
                  value={status.automations.packageGeneration}
                  description="Role-specific package creation"
                />
                <ToggleRow
                  label="Resume Builder"
                  value={status.automations.resumeBuilder}
                  description="OpenAI + Anthropic resume generation"
                />
                <ToggleRow
                  label="Cover Letter Engine"
                  value={status.automations.coverLetterEngine}
                  description="Multi-mode cover letter generation"
                />
                <ToggleRow
                  label="Interview Prep"
                  value={status.automations.interviewPrep}
                  description="Questions, pitch, and company angles"
                />
                <ToggleRow
                  label="Follow-up Generation"
                  value={status.automations.followUpGeneration}
                  description="Recruiter-safe follow-up draft generation"
                />
                <ToggleRow
                  label="Auto Apply"
                  value={status.automations.autoApply}
                  description="Semi-automated apply flow not yet enabled"
                />
                <ToggleRow
                  label="Calendar Sync"
                  value={status.automations.calendarSync}
                  description="Interview scheduling integration not yet enabled"
                />
                <ToggleRow
                  label="Analytics Engine"
                  value={status.automations.analytics}
                  description="Conversion and response analytics not yet enabled"
                />
              </div>
            </section>

            <section className="stack">
              <section className="card">
                <h2>Daily Run Summary</h2>
                <div className="grid" style={{ marginTop: "12px" }}>
                  <div className="card" style={{ padding: "14px" }}>
                    <h3>Jobs Scanned</h3>
                    <p style={{ fontSize: "24px", fontWeight: 800 }}>{status.dailyRun.jobsScanned}</p>
                  </div>
                  <div className="card" style={{ padding: "14px" }}>
                    <h3>Shortlisted</h3>
                    <p style={{ fontSize: "24px", fontWeight: 800 }}>{status.dailyRun.shortlisted}</p>
                  </div>
                  <div className="card" style={{ padding: "14px" }}>
                    <h3>Packages</h3>
                    <p style={{ fontSize: "24px", fontWeight: 800 }}>{status.dailyRun.packagesGenerated}</p>
                  </div>
                  <div className="card" style={{ padding: "14px" }}>
                    <h3>Follow-ups Due</h3>
                    <p style={{ fontSize: "24px", fontWeight: 800 }}>{status.dailyRun.followUpsDue}</p>
                  </div>
                  <div className="card" style={{ padding: "14px" }}>
                    <h3>Interview Prep</h3>
                    <p style={{ fontSize: "24px", fontWeight: 800 }}>{status.dailyRun.interviewsPrepared}</p>
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>Search Profile</h2>
                <p className="small">Current default operating posture for the system.</p>

                <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                    <strong>Mode</strong>
                    <div className="small">Precision targeting for high-fit roles, minimal wasted motion.</div>
                  </div>

                  <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                    <strong>Regions</strong>
                    <div className="small">Australia, New Zealand, remote-compatible targets.</div>
                  </div>

                  <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                    <strong>Role Family</strong>
                    <div className="small">Sales leadership, sales operations, contact center management, remote team leadership.</div>
                  </div>

                  <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "12px" }}>
                    <strong>Exclusions</strong>
                    <div className="small">Finance, investment, real estate, car sales, low-fit noise.</div>
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>System Notes</h2>
                <ul>
                  {(status.notes || []).map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </section>
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
