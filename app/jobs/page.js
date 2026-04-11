'use client';

import { useState } from 'react';

const defaultTitles = [
  'Sales Manager',
  'Sales Operations Manager',
  'Sales Team Leader',
  'Contact Center Manager',
  'Contact Centre Manager',
  'Remote Sales Manager',
  'Telesales Manager',
  'Outbound Sales Manager',
  'Inside Sales Manager'
].join('\n');

const defaultExcluded = [
  'finance',
  'investment',
  'real estate',
  'car sales',
  'automotive sales'
].join('\n');

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function JobsPage() {
  const [targetTitles, setTargetTitles] = useState(defaultTitles);
  const [preferredLocations, setPreferredLocations] = useState('Australia\nNew Zealand');
  const [location, setLocation] = useState('');
  const [minSalary, setMinSalary] = useState('70000');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState(defaultExcluded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [debug, setDebug] = useState(null);
  const [packageLoadingId, setPackageLoadingId] = useState('');
  const [packageMessage, setPackageMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusLoadingId, setStatusLoadingId] = useState('');

  async function runSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setJobs([]);
    setDebug(null);
    setPackageMessage('');
    setStatusMessage('');

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTitles: targetTitles.split('\n').map((x) => x.trim()).filter(Boolean),
          preferredLocations: preferredLocations.split('\n').map((x) => x.trim()).filter(Boolean),
          location,
          minSalary: Number(minSalary || 0),
          remoteOnly,
          excludedKeywords: excludedKeywords.split('\n').map((x) => x.trim()).filter(Boolean)
        })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setJobs(data.jobs || []);
      setDebug(data.debug || null);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function generatePackage(job) {
    setPackageLoadingId(`${job.source}-${job.external_id}`);
    setPackageMessage('');
    setStatusMessage('');
    setError('');

    try {
      const response = await fetch('/api/brain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to generate package');
      }

      setPackageMessage(`Package created successfully for ${job.title}`);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPackageLoadingId('');
    }
  }

  async function updateStatus(job, status) {
    const loadingId = `${job.source}-${job.external_id}-${status}`;
    setStatusLoadingId(loadingId);
    setError('');
    setPackageMessage('');
    setStatusMessage('');

    try {
      const response = await fetch('/api/pipeline/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, status })
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update pipeline status');
      }

      setStatusMessage(`${job.title} updated to ${status}`);

      setJobs((currentJobs) =>
        currentJobs.map((item) =>
          item.id === job.id ? { ...item, pipeline_status: status } : item
        )
      );
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setStatusLoadingId('');
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Multi-Source Job Search</h1>
        <p>
          Search across multiple sources, filter aggressively, and generate tailored
          application packages directly from live jobs.
        </p>
      </section>

      <section className="card">
        <form onSubmit={runSearch} className="form-grid">
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
              rows="8"
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
            />
          </label>

          <label>
            Specific location filter
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Leave blank for broader results"
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
            />
            Remote only
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search live jobs'}
            </button>
          </div>
        </form>
      </section>

      {packageMessage ? (
        <section className="card">
          <p>{packageMessage}</p>
          <a href="/packages">Open saved packages</a>
        </section>
      ) : null}

      {statusMessage ? (
        <section className="card">
          <p>{statusMessage}</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {debug ? (
        <section className="card">
          <h2>Debug</h2>
          <p>
            <strong>Enabled sources:</strong> {(debug.enabledSources || []).join(', ')}
          </p>
          <p>
            <strong>Query clusters:</strong>
          </p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debug.queryClusters || [], null, 2)}
          </pre>
          <p>
            <strong>Before dedupe:</strong>
          </p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debug.countsBeforeDedupe || {}, null, 2)}
          </pre>
          <p>
            <strong>After filtering:</strong>
          </p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debug.countsAfterFiltering || {}, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="card">
        <h2>Results</h2>
        {!jobs.length ? (
          <p>No jobs loaded yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {jobs.map((job) => {
              const packageId = `${job.source}-${job.external_id}`;
              const isGenerating = packageLoadingId === packageId;
              const shortlistLoading = statusLoadingId === `${job.source}-${job.external_id}-shortlisted`;
              const saveLoading = statusLoadingId === `${job.source}-${job.external_id}-saved`;
              const ignoreLoading = statusLoadingId === `${job.source}-${job.external_id}-ignored`;

              return (
                <article
                  key={packageId}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '10px',
                    padding: '14px'
                  }}
                >
                  <h3>{job.title}</h3>
                  <p><strong>Company:</strong> {job.company}</p>
                  <p><strong>Location:</strong> {job.location}</p>
                  <p><strong>Source:</strong> {job.source}</p>
                  <p><strong>Fit score:</strong> {job.fit_score}</p>
                  <p><strong>Matched title:</strong> {job.matched_title || 'None'}</p>
                  <p><strong>Salary:</strong> {job.salary_text || 'Not listed'}</p>
                  <p><strong>Remote:</strong> {job.remote ? 'Yes' : 'No'}</p>
                  <p><strong>Pipeline status:</strong> {job.pipeline_status || 'new'}</p>

                  <p style={{ whiteSpace: 'pre-wrap' }}>
                    {stripHtml(job.description).slice(0, 500)}
                    {stripHtml(job.description).length > 500 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {job.apply_url ? (
                      <a href={job.apply_url} target="_blank" rel="noreferrer">
                        Open job
                      </a>
                    ) : null}

                    <button onClick={() => generatePackage(job)} disabled={isGenerating}>
                      {isGenerating ? 'Generating package...' : 'Generate package'}
                    </button>

                    <button
                      onClick={() => updateStatus(job, 'shortlisted')}
                      disabled={shortlistLoading}
                    >
                      {shortlistLoading ? 'Updating...' : '⭐ Shortlist'}
                    </button>

                    <button
                      onClick={() => updateStatus(job, 'saved')}
                      disabled={saveLoading}
                    >
                      {saveLoading ? 'Updating...' : '📌 Save'}
                    </button>

                    <button
                      onClick={() => updateStatus(job, 'ignored')}
                      disabled={ignoreLoading}
                    >
                      {ignoreLoading ? 'Updating...' : '🚫 Ignore'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
