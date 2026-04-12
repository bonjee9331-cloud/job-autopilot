"use client";

import { useEffect, useState } from "react";

export default function CoverLetterPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [mode, setMode] = useState("standard");
  const [letter, setLetter] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingLetter, setLoadingLetter] = useState(false);
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

  async function generateLetter(pkg, nextMode = mode) {
    setSelectedPackage(pkg);
    setLetter(null);
    setLoadingLetter(true);
    setError("");
    setWarning("");
    setCopyMessage("");

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...pkg,
          mode: nextMode
        })
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON from cover letter API");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Cover letter generation failed");
      }

      setLetter(data.data);
      setWarning(data.warning || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Cover letter generation failed");
    } finally {
      setLoadingLetter(false);
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
        <h1>Cover Letter Engine</h1>
        <p>
          Generate sharper, more human, ATS-safe cover letters aligned to each saved package and target role.
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
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</p>
        </section>
      ) : null}

      {warning ? (
        <section className="card">
          <h2>Warning</h2>
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{warning}</p>
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

          <div style={{ display: "grid", gap: "10px" }}>
            {packages.map((pkg) => {
              const selected = selectedPackage?.id === pkg.id;

              return (
                <button
                  key={pkg.id}
                  onClick={() => generateLetter(pkg)}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "12px",
                    border: selected ? "2px solid #ff8a1f" : "1px solid #294488",
                    background: "#ffffff",
                    color: "#0b1220",
                    cursor: "pointer"
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
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ marginBottom: "6px" }}>Letter Mode</h2>
                <p className="small">Choose the style before generating or regenerating.</p>
              </div>

              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                style={{ width: "180px" }}
              >
                <option value="concise">Concise</option>
                <option value="standard">Standard</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            {selectedPackage ? (
              <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => generateLetter(selectedPackage, mode)}
                  disabled={loadingLetter}
                >
                  {loadingLetter ? "Generating..." : "Generate Cover Letter"}
                </button>

                <a href="/packages" className="btn btn-secondary">Open Packages</a>
              </div>
            ) : null}
          </section>

          {!selectedPackage ? (
            <section className="card">
              <p>Select a saved package to generate a cover letter.</p>
            </section>
          ) : null}

          {selectedPackage ? (
            <section className="card">
              <h2>
                {selectedPackage.job_title} at {selectedPackage.company}
              </h2>
              <p><strong>Fit score:</strong> {selectedPackage.fit_score ?? "-"}</p>
              <p><strong>Resume version:</strong> {selectedPackage.resume_version_name || "Not named"}</p>
              <p><strong>Current mode:</strong> {mode}</p>
            </section>
          ) : null}

          {loadingLetter ? (
            <section className="card">
              <p>Generating cover letter...</p>
            </section>
          ) : null}

          {letter ? (
            <>
              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Subject Line</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(letter.subjectLine, "Subject line")}
                  >
                    Copy
                  </button>
                </div>
                <p>{letter.subjectLine}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Opening</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(letter.opening, "Opening")}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{letter.opening}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Body</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(letter.body, "Body")}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{letter.body}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Closing</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(letter.closing, "Closing")}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{letter.closing}</p>
              </section>

              <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <h2>Full Letter</h2>
                  <button
                    className="btn btn-primary"
                    onClick={() => copyText(letter.fullLetter, "Full letter")}
                  >
                    Copy Full Letter
                  </button>
                </div>
                <pre>{letter.fullLetter}</pre>
              </section>

              <section className="card">
                <h2>Key Themes</h2>
                <ul>
                  {(letter.keyThemes || []).map((theme, i) => (
                    <li key={i}>{theme}</li>
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
