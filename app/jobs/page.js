"use client";

import { useMemo, useState } from "react";

const defaultTitles = [
  "Sales Manager",
  "Sales Operations Manager",
  "Sales Team Leader",
  "Contact Center Manager",
  "Contact Centre Manager",
  "Remote Sales Manager",
  "Telesales Manager",
  "Outbound Sales Manager",
  "Inside Sales Manager",
].join("\n");

const defaultExcluded = [
  "finance",
  "investment",
  "real estate",
  "car sales",
  "automotive sales",
].join("\n");

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fitBadgeClass(score) {
  if (score >= 85) return "badge badge-green";
  if (score >= 65) return "badge badge-blue";
  if (score >= 45) return "badge badge-yellow";
  return "badge badge-red";
}

export default function JobsPage() {
  const [targetTitles, setTargetTitles] = useState(defaultTitles);
  const [preferredLocations, setPreferredLocations] = useState("Australia\nNew Zealand");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("70000");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState(defaultExcluded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [debug, setDebug] = useState(null);
  const [packageLoadingId, setPackageLoadingId] = useState("");
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [sortBy, setSortBy] = useState("fit");
  const [viewMode, setViewMode] = useState("cards");
  const [showDebug, setShowDebug] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  async function runSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setJobs([]);
    setDebug(null);

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetTitles: targetTitles.split("\n").map((x) => x.trim()).filter(Boolean),
          preferredLocations: preferredLocations.split("\n").map((x) => x.trim()).filter(Boolean),
          location,
          minSalary: Number(minSalary || 0),
          remoteOnly,
          excludedKeywords: excludedKeywords.split("\n").map((x) => x.trim()).filter(Boolean),
        }),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Search failed");
      }

      setJobs(data.jobs || []);
      setDebug(data.debug || null);
      setMessage(`Loaded ${data.count || 0} relevant live jobs`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function generatePackage(job) {
    const loadingId = `${job.source}-${job.external_id}`;
    setPackageLoadingId(loadingId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/brain/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: stripHtml(job.description),
        }),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to generate package");
      }

      setMessage(`Package created for ${job.title}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate package");
    } finally {
      setPackageLoadingId("");
    }
  }

  async function updateStatus(job, status) {
    const loadingId = `${job.source}-${job.external_id}-${status}`;
    setStatusLoadingId(loadingId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/pipeline/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: job.id,
          status,
        }),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update job status");
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, pipeline_status: status } : item
        )
      );

      setMessage(`${job.title} updated to ${status}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update status");
    } finally {
      setStatusLoadingId("");
    }
  }

  const visibleJobs = useMemo(() => {
    let result = [...jobs];

    if (!showIgnored) {
      result = result.filter((job) => job.pipeline_status !== "ignored");
    }

    if (sortBy === "fit") {
      result.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
    }

    if (sortBy === "salary") {
      result.sort((a, b) => {
        const aSalary = a.salary_max || a.salary_min || 0;
        const bSalary = b.salary_max || b.salary_min || 0;
        return bSalary - aSalary;
      });
    }

    if (sortBy === "title") {
      result.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    }

    if (sortBy === "company") {
      result.sort((a, b) => String(a.company || "").localeCompare(String(b.company || "")));
    }

    return result;
  }, [jobs, sortBy, showIgnored]);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Premium Job Search</h1>
        <p>
          Search live roles, filter hard, rank intelligently, and generate tailored packages straight from the results.
        </p>
      </section>

      {message ? (
        <section className="card">
          <p>{message}</p>
        </section>
      ) : null}

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
          alignItems: "start",
        }}
      >
        <aside className="card">
          <h2>Search Filters</h2>

          <form onSubmit={runSearch} className="stack">
            <label>
              Target titles
              <textarea
                rows="8"
                value={targetTitles}
                onChange={(e) => setTargetTitles(e.target.value)}
              />
            </label>

            <label>
              Preferred locations
              <textarea
                rows="5"
                value={preferredLocations}
                onChange={(e) => setPreferredLocations(e.target.value)}
              />
            </label>

            <label>
              Specific location filter
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Leave blank for broader search"
              />
            </label>

            <label>
              Minimum salary
              <input
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="70000"
              />
            </label>

            <label>
              Excluded keywords
              <textarea
                rows="6"
                value={excludedKeywords}
                onChange={(e) => setExcludedKeywords(e.target.value)}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                style={{ width: "auto" }}
              />
              Remote only
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Searching..." : "Search live jobs"}
            </button>
          </form>
        </aside>

        <section className="stack">
          <section className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "14px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ marginBottom: "6px" }}>Results</h2>
                <p className="small">
                  {visibleJobs.length} visible job{visibleJobs.length === 1 ? "" : "s"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: "180px" }}>
                  <option value="fit">Sort by fit</option>
                  <option value="salary">Sort by salary</option>
                  <option value="title">Sort by title</option>
                  <option value="company">Sort by company</option>
                </select>

                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ width: "160px" }}>
                  <option value="cards">Card view</option>
                  <option value="compact">Compact view</option>
                </select>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowIgnored((v) => !v)}
                >
                  {showIgnored ? "Hide ignored" : "Show ignored"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDebug((v) => !v)}
                >
                  {showDebug ? "Hide debug" : "Show debug"}
                </button>
              </div>
            </div>
          </section>

          {showDebug && debug ? (
            <section className="card">
              <h2>Debug</h2>
              <p><strong>Enabled sources:</strong> {(debug.enabledSources || []).join(", ")}</p>
              <p><strong>Query clusters:</strong></p>
              <pre>{JSON.stringify(debug.queryClusters || [], null, 2)}</pre>
              <p><strong>Before dedupe:</strong></p>
              <pre>{JSON.stringify(debug.countsBeforeDedupe || {}, null, 2)}</pre>
              <p><strong>After filtering:</strong></p>
              <pre>{JSON.stringify(debug.countsAfterFiltering || {}, null, 2)}</pre>
            </section>
          ) : null}

          {!visibleJobs.length ? (
            <section className="card">
              <p>No jobs loaded yet.</p>
            </section>
          ) : null}

          {visibleJobs.length > 0 && viewMode === "cards" ? (
            <section className="stack">
              {visibleJobs.map((job) => {
                const packageId = `${job.source}-${job.external_id}`;
                const isGenerating = packageLoadingId === packageId;
                const shortlistLoading = statusLoadingId === `${job.source}-${job.external_id}-shortlisted`;
                const saveLoading = statusLoadingId === `${job.source}-${job.external_id}-saved`;
                const ignoreLoading = statusLoadingId === `${job.source}-${job.external_id}-ignored`;

                return (
                  <article
                    key={packageId}
                    className="card"
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h2 style={{ marginBottom: "8px" }}>{job.title}</h2>
                        <p className="small" style={{ marginBottom: "8px" }}>
                          {job.company} · {job.location}
                        </p>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span className={fitBadgeClass(job.fit_score)}>
                            Fit {job.fit_score ?? "-"}
                          </span>

                          <span className="badge badge-blue">{job.source}</span>

                          {job.remote ? <span className="badge badge-green">Remote</span> : null}

                          {job.pipeline_status ? (
                            <span className="badge badge-orange">{job.pipeline_status}</span>
                          ) : (
                            <span className="badge badge-orange">new</span>
                          )}

                          {job.matched_title ? (
                            <span className="badge badge-yellow">{job.matched_title}</span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: "160px" }}>
                        <p style={{ margin: 0 }}><strong>Salary</strong></p>
                        <p className="small" style={{ marginTop: "6px" }}>
                          {job.salary_text || "Not listed"}
                        </p>
                      </div>
                    </div>

                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                      {stripHtml(job.description).slice(0, 420)}
                      {stripHtml(job.description).length > 420 ? "..." : ""}
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {job.apply_url ? (
                        <a href={job.apply_url} target="_blank" rel="noreferrer" className="btn btn-secondary">
                          Open job
                        </a>
                      ) : null}

                      <button
                        onClick={() => generatePackage(job)}
                        disabled={isGenerating}
                        className="btn btn-primary"
                      >
                        {isGenerating ? "Generating..." : "Generate package"}
                      </button>

                      <button
                        onClick={() => updateStatus(job, "shortlisted")}
                        disabled={shortlistLoading}
                        className="btn btn-secondary"
                      >
                        {shortlistLoading ? "Updating..." : "⭐ Shortlist"}
                      </button>

                      <button
                        onClick={() => updateStatus(job, "saved")}
                        disabled={saveLoading}
                        className="btn btn-secondary"
                      >
                        {saveLoading ? "Updating..." : "📌 Save"}
                      </button>

                      <button
                        onClick={() => updateStatus(job, "ignored")}
                        disabled={ignoreLoading}
                        className="btn btn-secondary"
                      >
                        {ignoreLoading ? "Updating..." : "🚫 Ignore"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null}

          {visibleJobs.length > 0 && viewMode === "compact" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Source</th>
                    <th>Fit</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs.map((job) => (
                    <tr key={`${job.source}-${job.external_id}`}>
                      <td>{job.title}</td>
                      <td>{job.company}</td>
                      <td>{job.location}</td>
                      <td>{job.source}</td>
                      <td>{job.fit_score ?? "-"}</td>
                      <td>{job.salary_text || "Not listed"}</td>
                      <td>{job.pipeline_status || "new"}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => generatePackage(job)}
                          disabled={packageLoadingId === `${job.source}-${job.external_id}`}
                        >
                          Generate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
