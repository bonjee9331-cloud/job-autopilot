"use client";

import { useEffect, useState } from "react";

export default function InterviewPrepPage() {
  const [packages, setPackages] = useState([]);
  const [prep, setPrep] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoadingPackages(true);
    setError("");

    try {
      const res = await fetch("/api/packages");
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned while loading packages");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load packages");
      }

      setPackages(data.packages || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load packages");
    } finally {
      setLoadingPackages(false);
    }
  }

  async function generatePrep(pkg) {
    setSelectedPackage(pkg);
    setPrep(null);
    setLoadingPrep(true);
    setError("");

    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          job_title: pkg.job_title,
          company: pkg.company,
          job_description: pkg.job_description,
          tailoredSummary: pkg.tailored_summary,
          tailoredExperienceBullets: pkg.tailored_experience_bullets || [],
          tailoredSkills: pkg.tailored_skills || []
        })
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned from interview prep API");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to generate interview prep");
      }

      setPrep(data.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Interview prep failed");
    } finally {
      setLoadingPrep(false);
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Interview Prep Engine</h1>
        <p>Select a saved package to generate tailored interview preparation.</p>
      </section>

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          alignItems: "start"
        }}
      >
        <aside className="card">
          <h2>Saved Packages</h2>

          {loadingPackages ? <p>Loading packages...</p> : null}

          {!loadingPackages && packages.length === 0 ? (
            <p>No saved packages found.</p>
          ) : null}

          <div style={{ display: "grid", gap: "10px" }}>
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => generatePrep(pkg)}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "10px",
                    border: isSelected ? "2px solid #111" : "1px solid #ccc",
                    background: "#fff",
                    cursor: "pointer"
                  }}
                >
                  <strong>{pkg.job_title}</strong>
                  <div>{pkg.company}</div>
                  <div style={{ fontSize: "12px", opacity: 0.7 }}>
                    Fit: {pkg.fit_score ?? "-"}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="stack">
          {!selectedPackage ? (
            <section className="card">
              <p>Select a package from the left to generate interview prep.</p>
            </section>
          ) : null}

          {selectedPackage ? (
            <section className="card">
              <h2>
                {selectedPackage.job_title} at {selectedPackage.company}
              </h2>
              <p><strong>Fit score:</strong> {selectedPackage.fit_score ?? "-"}</p>
              <p><strong>Resume version:</strong> {selectedPackage.resume_version_name || "Not named"}</p>
            </section>
          ) : null}

          {loadingPrep ? (
            <section className="card">
              <p>Generating interview prep...</p>
            </section>
          ) : null}

          {prep ? (
            <>
              <section className="card">
                <h2>🔥 60-Second Pitch</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>{prep.pitch}</p>
              </section>

              <section className="card">
                <h2>Likely Interview Questions</h2>
                <ul>
                  {(prep.questions || []).map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <h2>Strong Answer Angles</h2>
                <ul>
                  {(prep.answers || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <h2>Company-Specific Angles</h2>
                <ul>
                  {(prep.companyAngles || []).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <h2>Red Flags To Prepare For</h2>
                <ul>
                  {(prep.redFlags || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
