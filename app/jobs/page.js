"use client";

import { useState } from "react";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState("");

  async function runSearch() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error);

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getFitColor(score) {
    if (score >= 85) return "#00ff9d";
    if (score >= 65) return "#00c3ff";
    if (score >= 45) return "#ffc400";
    return "#ff4d4d";
  }

  return (
    <main style={{ padding: "20px" }}>

      {/* COMMAND HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h1 style={{ fontSize: "22px" }}>🎯 SNIPER TARGET ACQUISITION</h1>

        <button
          onClick={runSearch}
          style={{
            background: "#0b5cff",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer"
          }}
        >
          {loading ? "Scanning..." : "Scan Targets"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* MAIN GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: "20px"
      }}>

        {/* LEFT SIDE - TARGET LIST */}
        <div style={{
          display: "grid",
          gap: "10px",
          maxHeight: "75vh",
          overflowY: "auto"
        }}>

          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              style={{
                background: "#0f172a",
                padding: "14px",
                borderRadius: "12px",
                cursor: "pointer",
                border: "1px solid #1e293b"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{job.title}</strong>

                <span style={{
                  color: getFitColor(job.fit_score),
                  fontWeight: "bold"
                }}>
                  {job.fit_score || "-"}%
                </span>
              </div>

              <p style={{ margin: "4px 0", opacity: 0.7 }}>
                {job.company} · {job.location}
              </p>

              <div style={{ fontSize: "12px", opacity: 0.6 }}>
                {job.source}
              </div>
            </div>
          ))}

          {!jobs.length && !loading && (
            <p>No targets loaded.</p>
          )}

        </div>

        {/* RIGHT SIDE - TARGET DETAILS */}
        <div style={{
          background: "#020617",
          padding: "20px",
          borderRadius: "14px",
          border: "1px solid #1e293b",
          minHeight: "75vh"
        }}>

          {!selectedJob && (
            <p>Select a target to view details.</p>
          )}

          {selectedJob && (
            <>
              <h2>{selectedJob.title}</h2>
              <p>{selectedJob.company}</p>

              <p style={{
                marginTop: "10px",
                color: getFitColor(selectedJob.fit_score)
              }}>
                Fit Score: {selectedJob.fit_score || "-"}%
              </p>

              <p style={{ marginTop: "14px", lineHeight: "1.5" }}>
                {selectedJob.description?.slice(0, 600)}...
              </p>

              {/* ACTIONS */}
              <div style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
              }}>

                <a
                  href={selectedJob.apply_url}
                  target="_blank"
                  style={{
                    background: "#1e293b",
                    padding: "10px 14px",
                    borderRadius: "8px"
                  }}
                >
                  Open Target
                </a>

                <button
                  style={{
                    background: "#0b5cff",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none"
                  }}
                >
                  Generate Package
                </button>

                <button
                  style={{
                    background: "#00ff9d",
                    color: "#000",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none"
                  }}
                >
                  Shortlist
                </button>

                <button
                  style={{
                    background: "#ff4d4d",
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none"
                  }}
                >
                  Ignore
                </button>

              </div>
            </>
          )}

        </div>

      </div>

    </main>
  );
}
