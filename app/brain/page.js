'use client';

import { useState } from 'react';

export default function BrainPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/brain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data.modelOutput);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Application Brain</h1>
        <p>Paste a job description and let the system tailor your application package.</p>
      </section>

      <section className="card">
        <form onSubmit={handleAnalyze} className="form-grid">
          <label>
            Job title
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Sales Manager"
              required
            />
          </label>

          <label>
            Company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Example Company"
              required
            />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Job description
            <textarea
              rows="14"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              required
            />
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze job'}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {result ? (
        <>
          <section className="grid">
            <div className="card">
              <h2>Fit score</h2>
              <p>{result.fitScore}/100</p>
            </div>

            <div className="card">
              <h2>Keywords</h2>
              <ul>
                {result.keywords?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2>Strengths</h2>
              <ul>
                {result.strengths?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2>Gaps</h2>
              <ul>
                {result.gaps?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card">
            <h2>Tailored CV Summary</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{result.tailoredSummary}</p>
          </section>

          <section className="card">
            <h2>Cover Letter</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{result.coverLetter}</p>
          </section>
        </>
      ) : null}
    </main>
  );
}
