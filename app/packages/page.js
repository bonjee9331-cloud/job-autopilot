'use client';

import { useEffect, useState } from 'react';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch('/api/packages');
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Server returned non-JSON response');
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to load saved packages');
        }

        setPackages(data.packages || []);
        if (data.packages?.length) {
          setSelected(data.packages[0]);
        }
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadPackages();
  }, []);

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopyMessage(`${label} copied`);
      setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage(`Could not copy ${label.toLowerCase()}`);
      setTimeout(() => setCopyMessage(''), 2000);
    }
  }

  function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString();
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Saved Application Packages</h1>
        <p>
          Every tailored package you generate is stored here so you know exactly
          which version was created for each role.
        </p>
        {copyMessage ? <p className="small">{copyMessage}</p> : null}
      </section>

      {loading ? (
        <section className="card">
          <p>Loading saved packages...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!loading && !error ? (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          <aside className="card">
            <h2>Packages</h2>
            {packages.length === 0 ? (
              <p>No saved packages yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {packages.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '10px',
                      border:
                        selected?.id === item.id
                          ? '2px solid #111'
                          : '1px solid #ccc',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <strong>{item.company || 'Unknown company'}</strong>
                    <div>{item.job_title || 'Unknown role'}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      Fit: {item.fit_score ?? '-'} | {item.application_status || 'draft'}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      {formatDate(item.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="stack">
            {selected ? (
              <>
                <section className="card">
                  <h2>
                    {selected.job_title} at {selected.company}
                  </h2>
                  <p>
                    <strong>Fit score:</strong> {selected.fit_score ?? '-'}
                  </p>
                  <p>
                    <strong>Status:</strong> {selected.application_status || 'draft'}
                  </p>
                  <p>
                    <strong>Resume version:</strong>{' '}
                    {selected.resume_version_name || 'Not named'}
                  </p>
                  <p>
                    <strong>Created:</strong> {formatDate(selected.created_at)}
                  </p>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Tailored Summary</h2>
                    <button onClick={() => copyText('Summary', selected.tailored_summary)}>
                      Copy
                    </button>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>
                    {selected.tailored_summary || ''}
                  </p>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Tailored Skills</h2>
                    <button
                      onClick={() =>
                        copyText(
                          'Skills',
                          Array.isArray(selected.tailored_skills)
                            ? selected.tailored_skills.join('\n')
                            : ''
                        )
                      }
                    >
                      Copy
                    </button>
                  </div>
                  <ul>
                    {(selected.tailored_skills || []).map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Tailored Experience Bullets</h2>
                    <button
                      onClick={() =>
                        copyText(
                          'Experience bullets',
                          Array.isArray(selected.tailored_experience_bullets)
                            ? selected.tailored_experience_bullets.join('\n')
                            : ''
                        )
                      }
                    >
                      Copy
                    </button>
                  </div>
                  <ul>
                    {(selected.tailored_experience_bullets || []).map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Resume Snapshot</h2>
                    <button onClick={() => copyText('Resume snapshot', selected.resume_snapshot)}>
                      Copy
                    </button>
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {selected.resume_snapshot || ''}
                  </pre>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Cover Letter</h2>
                    <button onClick={() => copyText('Cover letter', selected.cover_letter)}>
                      Copy
                    </button>
                  </div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {selected.cover_letter || ''}
                  </pre>
                </section>

                <section className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <h2>Keywords</h2>
                    <button
                      onClick={() =>
                        copyText(
                          'Keywords',
                          Array.isArray(selected.keywords)
                            ? selected.keywords.join('\n')
                            : ''
                        )
                      }
                    >
                      Copy
                    </button>
                  </div>
                  <ul>
                    {(selected.keywords || []).map((keyword, index) => (
                      <li key={index}>{keyword}</li>
                    ))}
                  </ul>
                </section>

                <section className="card">
                  <h2>Strengths</h2>
                  <ul>
                    {(selected.strengths || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="card">
                  <h2>Gaps</h2>
                  <ul>
                    {(selected.gaps || []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <section className="card">
                <p>Select a package to view it.</p>
              </section>
            )}
          </section>
        </section>
      ) : null}
    </main>
  );
}
