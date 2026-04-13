"use client";

import { useEffect, useState } from "react";

export default function ApplyPage() {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prepared, setPrepared] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setJobs(data.items || []);
  }

  async function prepare(job) {
    setSelected(job);
    setLoading(true);

    const res = await fetch("/api/apply/prepare", {
      method: "POST",
      body: JSON.stringify({
        job
      })
    });

    const data = await res.json();

    setPrepared(data.data);
    setLoading(false);
  }

  function openApply() {
    if (prepared?.apply_url) {
      window.open(prepared.apply_url, "_blank");
    }
  }

  return (
    <main className="stack">
      <h1>Auto Apply (Semi)</h1>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
        
        <div className="card">
          <h2>Targets</h2>
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => prepare(job)}
              style={{ display: "block", marginBottom: "10px" }}
            >
              {job.job_title} - {job.company}
            </button>
          ))}
        </div>

        <div className="card">
          <h2>Application Preview</h2>

          {loading && <p>Preparing...</p>}

          {prepared && (
            <>
              <p><strong>{prepared.job_title}</strong></p>
              <p>{prepared.company}</p>

              <h3>Form Data</h3>
              <pre>{JSON.stringify(prepared.fields, null, 2)}</pre>

              <h3>Notes</h3>
              <ul>
                {prepared.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>

              <button onClick={openApply} className="btn btn-primary">
                Open Application Page
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
