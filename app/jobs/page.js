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
  "Inside Sales Manager"
].join("\n");

const defaultExcluded = [
  "finance",
  "investment",
  "real estate",
  "car sales",
  "automotive sales"
].join("\n");

const savedProfilesSeed = [
  {
    id: "au-remote-sales",
    name: "AU Remote Sales",
    titles: defaultTitles,
    locations: "Australia\nNew Zealand",
    location: "",
    minSalary: "70000",
    remoteOnly: true,
    excluded: defaultExcluded
  },
  {
    id: "broad-commercial",
    name: "Broad Commercial",
    titles: [
      "Sales Manager",
      "Business Development Manager",
      "Inside Sales Manager",
      "Remote Sales Manager",
      "Revenue Operations Manager"
    ].join("\n"),
    locations: "Australia\nNew Zealand\nSingapore",
    location: "",
    minSalary: "80000",
    remoteOnly: true,
    excluded: defaultExcluded
  }
];

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fitBand(score) {
  const value = Number(score || 0);

  if (value >= 85) {
    return { label: "High Fit", className: "badge badge-green" };
  }
  if (value >= 65) {
    return { label: "Strong Fit", className: "badge badge-blue" };
  }
  if (value >= 45) {
    return { label: "Possible Fit", className: "badge badge-yellow" };
  }
  return { label: "Weak Fit", className: "badge badge-red" };
}

function fitExplanation(job) {
  const reasons = [];

  if (job?.matched_title) reasons.push(`Title match: ${job.matched_title}`);
  if (job?.remote) reasons.push("Remote-compatible role");
  if (job?.location) reasons.push(`Location signal: ${job.location}`);
  if (job?.salary_text) reasons.push(`Comp visible: ${job.salary_text}`);
  if (job?.source) reasons.push(`Source confidence from ${job.source}`);

  return reasons.length ? reasons : ["Ranked from title, location, remote fit, and commercial relevance signals."];
}

export default function JobsPage() {
  const [targetTitles, setTargetTitles] = useState(defaultTitles);
  const [preferredLocations, setPreferredLocations] = useState("Australia\nNew Zealand");
  const [location, setLocation] = useState("");
  const [minSalary, setMinSalary] = useState("70000");
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState(defaultExcluded);

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [debug, setDebug] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [sortBy, setSortBy] = useState("fit");
  const [viewMode, setViewMode] = useState("cards");
  const [showIgnored, setShowIgnored] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [packageLoadingId, setPackageLoadingId] = useState("");
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [savedProfiles] = useState(savedProfilesSeed);

  function applyProfile(profile) {
    setTargetTitles(profile.titles);
    setPreferredLocations(profile.locations);
    setLocation(profile.location);
    setMinSalary(profile.minSalary);
    setRemoteOnly(profile.remoteOnly);
    setExcludedKeywords(profile.excluded);
    setMessage(`Loaded profile: ${profile.name}`);
  }

  async function runSearch(event) {
    if (event) event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setDebug(null);

    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetTitles: targetTitles.split("\n").map((x) => x.trim()).filter(Boolean),
          preferredLocations: preferredLocations.split("\n").map((x) => x.trim()).filter(Boolean),
          location,
          minSalary: Number(minSalary || 0),
          remoteOnly,
          excludedKeywords: excludedKeywords.split("\n").map((x) => x.trim()).filter(Boolean)
        })
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

      const nextJobs = data.jobs || [];
      setJobs(nextJobs);
      setDebug(data.debug || null);
      setMessage(`Loaded ${data.count || 0} live targets`);
      setSelectedJobId(nextJobs[0]?.id || `${nextJobs[0]?.source}-${nextJobs[0]?.external_id}` || null);
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: stripHtml(job.description)
        })
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: job.id,
          status
        })
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, pipeline_status: status } : item
        )
      );

      setMessage(`${job.title} moved to ${status}`);
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
    } else if (sortBy === "salary") {
      result.sort((a, b) => {
        const aSalary = a.salary_max || a.salary_min || 0;
        const bSalary = b.salary_max || b.salary_min || 0;
        return bSalary - aSalary;
      });
    } else if (sortBy === "title") {
      result.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    } else if (sortBy === "company") {
      result.sort((a, b) => String(a.company || "").localeCompare(String(b.company || "")));
    } else if (sortBy === "source") {
      result.sort((a, b) => String(a.source || "").localeCompare(String(b.source || "")));
    }

    return result;
  }, [jobs, sortBy, showIgnored]);

  const selectedJob =
    visibleJobs.find((job) => job.id === selectedJobId || `${job.source}-${job.external_id}` === selectedJobId) ||
    visibleJobs[0] ||
    null;

  return (
    <main className="stack">
      <section className="hero">
        <h1>Sniper Target Acquisition</h1>
        <p>
          Run precision job searches, rank targets by fit, and move from discovery to package generation with minimal wasted motion.
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
          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error}</p>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr) 420px",
          gap: "20px",
          alignItems: "start"
        }}
      >
        <aside className="card" style={{ position: "sticky", top: "96px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
            <h2 style={{ marginBottom: 0 }}>Search Filters</h2>
            <span className="badge badge-blue">Sniper</span>
          </div>

          <div className="stack" style={{ marginTop: "16px" }}>
            <div>
              <p className="small" style={{ marginBottom: "8px" }}>Saved profiles</p>
              <div style={{ display: "grid", gap: "8px" }}>
                {savedProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => applyProfile(profile)}
                    style={{ justifyContent: "flex-start" }}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={runSearch} className="stack">
              <label>
                Target titles
                <textarea
                  rows="7"
                  value={targetTitles}
                  onChange={(e) => setTargetTitles(e.target.value)}
                />
              </label>

              <label>
                Preferred locations
                <textarea
                  rows="4"
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
                  rows="5"
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
                {loading ? "Scanning..." : "Scan Targets"}
              </button>
            </form>
          </div>
        </aside>

        <section className="stack">
          <section className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "14px",
                flexWrap: "wrap",
                alignItems: "center"
              }}
            >
              <div>
                <h2 style={{ marginBottom: "6px" }}>Target Feed</h2>
                <p className="small">
                  {visibleJobs.length} visible target{visibleJobs.length === 1 ? "" : "s"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: "160px" }}>
                  <option value="fit">Sort by fit</option>
                  <option value="salary">Sort by salary</option>
                  <option value="title">Sort by title</option>
                  <option value="company">Sort by company</option>
                  <option value="source">Sort by source</option>
                </select>

                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ width: "160px" }}>
                  <option value="cards">Card view</option>
                  <option value="compact">Compact view</option>
                  <option value="table">Table view</option>
                </select>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowIgnored((v) => !v)}
                >
                  {showIgnored ? "Hide Ignored" : "Show Ignored"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDebug((v) => !v)}
                >
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </button>
              </div>
            </div>
          </section>

          {showDebug && debug ? (
            <section className="card">
              <h2>Debug Signals</h2>
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
              <p>No targets loaded yet.</p>
            </section>
          ) : null}

          {visibleJobs.length > 0 && viewMode === "cards" ? (
            <section className="stack">
              {visibleJobs.map((job) => {
                const packageId = `${job.source}-${job.external_id}`;
                const band = fitBand(job.fit_score);
                const isSelected =
                  selectedJobId === job.id || selectedJobId === `${job.source}-${job.external_id}`;
                const isGenerating = packageLoadingId === packageId;
                const shortlistLoading = statusLoadingId === `${job.source}-${job.external_id}-shortlisted`;
                const saveLoading = statusLoadingId === `${job.source}-${job.external_id}-saved`;
                const ignoreLoading = statusLoadingId === `${job.source}-${job.external_id}-ignored`;

                return (
                  <article
                    key={packageId}
                    className="card"
                    onClick={() => setSelectedJobId(job.id || packageId)}
                    style={{
                      display: "grid",
                      gap: "14px",
                      cursor: "pointer",
                      border: isSelected ? "2px solid #ff8a1f" : undefined
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "start"
                      }}
                    >
                      <div>
                        <h2 style={{ marginBottom: "8px" }}>{job.title}</h2>
                        <p className="small" style={{ marginBottom: "8px" }}>
                          {job.company} · {job.location}
                        </p>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span className={band.className}>
                            {band.label} · {job.fit_score ?? "-"}
                          </span>

                          <span className="badge badge-blue">{job.source}</span>

                          {job.remote ? <span className="badge badge-green">Remote</span> : null}

                          <span className="badge badge-orange">
                            {job.pipeline_status || "new"}
                          </span>

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
                      {stripHtml(job.description).slice(0, 280)}
                      {stripHtml(job.description).length > 280 ? "..." : ""}
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {job.apply_url ? (
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open Target
                        </a>
                      ) : null}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generatePackage(job);
                        }}
                        disabled={isGenerating}
                        className="btn btn-primary"
                      >
                        {isGenerating ? "Generating..." : "Generate Package"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(job, "shortlisted");
                        }}
                        disabled={shortlistLoading}
                        className="btn btn-secondary"
                      >
                        {shortlistLoading ? "Updating..." : "⭐ Shortlist"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(job, "saved");
                        }}
                        disabled={saveLoading}
                        className="btn btn-secondary"
                      >
                        {saveLoading ? "Updating..." : "📌 Save"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(job, "ignored");
                        }}
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
            <section className="stack">
              {visibleJobs.map((job) => {
                const packageId = `${job.source}-${job.external_id}`;
                const band = fitBand(job.fit_score);

                return (
                  <button
                    key={packageId}
                    onClick={() => setSelectedJobId(job.id || packageId)}
                    className="card"
                    style={{
                      textAlign: "left",
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1fr 0.6fr 0.6fr",
                      gap: "10px",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong>{job.title}</strong>
                      <div className="small">{job.company}</div>
                    </div>
                    <div className="small">{job.location}</div>
                    <div>
                      <span className={band.className}>{job.fit_score ?? "-"}</span>
                    </div>
                    <div className="small">{job.pipeline_status || "new"}</div>
                  </button>
                );
              })}
            </section>
          ) : null}

          {visibleJobs.length > 0 && viewMode === "table" ? (
            <section className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Source</th>
                    <th>Fit</th>
                    <th>Status</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs.map((job) => (
                    <tr
                      key={`${job.source}-${job.external_id}`}
                      onClick={() => setSelectedJobId(job.id || `${job.source}-${job.external_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{job.title}</td>
                      <td>{job.company}</td>
                      <td>{job.location}</td>
                      <td>{job.source}</td>
                      <td>{job.fit_score ?? "-"}</td>
                      <td>{job.pipeline_status || "new"}</td>
                      <td>{job.salary_text || "Not listed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </section>

        <aside className="card" style={{ position: "sticky", top: "96px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
            <h2 style={{ marginBottom: 0 }}>Intel Panel</h2>
            {selectedJob ? (
              <span className={fitBand(selectedJob.fit_score).className}>
                {selectedJob.fit_score ?? "-"}
              </span>
            ) : null}
          </div>

          {!selectedJob ? (
            <p style={{ marginTop: "16px" }}>Select a target to view details.</p>
          ) : (
            <div className="stack" style={{ marginTop: "16px" }}>
              <div>
                <h3 style={{ marginBottom: "8px" }}>{selectedJob.title}</h3>
                <p className="small">{selectedJob.company} · {selectedJob.location}</p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge badge-blue">{selectedJob.source}</span>
                {selectedJob.remote ? <span className="badge badge-green">Remote</span> : null}
                <span className="badge badge-orange">{selectedJob.pipeline_status || "new"}</span>
                {selectedJob.matched_title ? (
                  <span className="badge badge-yellow">{selectedJob.matched_title}</span>
                ) : null}
              </div>

              <div>
                <p><strong>Salary</strong></p>
                <p className="small">{selectedJob.salary_text || "Not listed"}</p>
              </div>

              <div>
                <p><strong>Fit Explanation</strong></p>
                <ul>
                  {fitExplanation(selectedJob).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p><strong>Target Summary</strong></p>
                <p style={{ lineHeight: 1.6 }}>
                  {stripHtml(selectedJob.description).slice(0, 650)}
                  {stripHtml(selectedJob.description).length > 650 ? "..." : ""}
                </p>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {selectedJob.apply_url ? (
                  <a
                    href={selectedJob.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                  >
                    Open Live Listing
                  </a>
                ) : null}

                <button
                  className="btn btn-primary"
                  onClick={() => generatePackage(selectedJob)}
                  disabled={packageLoadingId === `${selectedJob.source}-${selectedJob.external_id}`}
                >
                  {packageLoadingId === `${selectedJob.source}-${selectedJob.external_id}`
                    ? "Generating..."
                    : "Generate Package"}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => updateStatus(selectedJob, "shortlisted")}
                  disabled={statusLoadingId === `${selectedJob.source}-${selectedJob.external_id}-shortlisted`}
                >
                  ⭐ Move To Shortlist
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => updateStatus(selectedJob, "saved")}
                  disabled={statusLoadingId === `${selectedJob.source}-${selectedJob.external_id}-saved`}
                >
                  📌 Save For Later
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => updateStatus(selectedJob, "ignored")}
                  disabled={statusLoadingId === `${selectedJob.source}-${selectedJob.external_id}-ignored`}
                >
                  🚫 Ignore Target
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
