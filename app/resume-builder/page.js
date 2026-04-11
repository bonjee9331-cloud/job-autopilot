"use client";

import { useEffect, useState } from "react";

export default function ResumeBuilderPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [resume, setResume] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingResume, setLoadingResume] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

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
        throw new Error("Invalid JSON while loading packages");
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

  async function buildResume(pkg) {
    setSelectedPackage(pkg);
    setResume(null);
    setLoadingResume(true);
    setError("");
    setWarning("");
    setCopyMessage("");

    try {
      const res = await fetch("/api/resume-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pkg),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON from resume builder API");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Resume builder failed");
      }

      setResume(data.data);
      setWarning(data.warning || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Resume builder failed");
    } finally {
      setLoadingResume(false);
    }
  }

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopyMessage(`${label} copied`);
      setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage(`Could not copy ${label.toLowerCase()}`);
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Resume Builder</h1>
        <p>
          Use OpenAI and Anthropic together to turn saved packages into sharper, cleaner, premium resumes.
        </p>
      </section>

      {copyMessage ? (
        <section className="card">
          <p>{copyMessage}</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {warning ? (
        <section className="card">
          <h2>Warning</h2>
          <p>{warning}</p>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <aside className="card">
          <h2>Saved Packages</h2>

          {loadingPackages ? <p>Loading packages...</p> : null}

          <div style={{ display: "grid", gap: "10px" }}>
            {packages.map((pkg) => {
              const selected = selectedPackage?.id === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => buildResume(pkg)}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "12px",
                    border: selected ? "2px solid #ff8a1f" : "1px solid #294488",
                    background: "#ffffff",
                    color: "#0b1220",
                    cursor: "pointer",
                  }}
                >
                  <strong>{pkg.job_title}</strong>
                  <div>{pkg.company}</div>
                  <div style={{ fontSize: "12px", opacity: 0.75 }}>
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
              <p>Select a package to build a premium resume.</p>
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

          {loadingResume ? (
            <section className="card">
              <p>Building resume with both brains...</p>
            </section>
          ) : null}

          {resume ? (
            <>
              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Headline</h2>
                  <button className="btn btn-secondary" onClick={() => copyText(resume.headline, "Headline")}>
                    Copy
                  </button>
                </div>
                <p>{resume.headline}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Professional Summary</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(resume.professionalSummary, "Professional summary")}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{resume.professionalSummary}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Key Skills</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText((resume.keySkills || []).join("\n"), "Key skills")}
                  >
                    Copy
                  </button>
                </div>
                <ul>
                  {(resume.keySkills || []).map((skill, i) => (
                    <li key={i}>{skill}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Experience Bullets</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText((resume.experienceBullets || []).join("\n"), "Experience bullets")}
                  >
                    Copy
                  </button>
                </div>
                <ul>
                  {(resume.experienceBullets || []).map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>ATS Keywords</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText((resume.atsKeywords || []).join(", "), "ATS keywords")}
                  >
                    Copy
                  </button>
                </div>
                <ul>
                  {(resume.atsKeywords || []).map((keyword, i) => (
                    <li key={i}>{keyword}</li>
                  ))}
                </ul>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Cover Letter Intro</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(resume.coverLetterIntro, "Cover letter intro")}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{resume.coverLetterIntro}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Resume Body</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(resume.resumeBody, "Resume body")}
                  >
                    Copy
                  </button>
                </div>
                <pre>{resume.resumeBody}</pre>
              </section>

              <section className="card">
                <h2>Final Notes</h2>
                <ul>
                  {(resume.finalNotes || []).map((note, i) => (
                    <li key={i}>{note}</li>
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
