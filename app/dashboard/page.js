'use client';

import { useEffect, useMemo, useState } from 'react';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
}

function dueLabel(item) {
  if (!item.follow_up_due_at) return 'No follow-up date';
  const now = new Date();
  const due = new Date(item.follow_up_due_at);
  return due <= now ? 'Due now' : 'Upcoming';
}

function Section({ title, items }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {!items.length ? (
        <p>No items.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <h3>
                {item.job_title} at {item.company}
              </h3>
              <p><strong>Fit score:</strong> {item.fit_score ?? '-'}</p>
              <p><strong>Pipeline status:</strong> {item.pipeline_status || 'new'}</p>
              <p><strong>Application status:</strong> {item.application_status || 'draft'}</p>
              <p><strong>Created:</strong> {formatDate(item.created_at)}</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a href="/packages">Open packages</a>
                {item.application_status === 'applied' ? <a href="/followups">Open follow-ups</a> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/dashboard');
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Server returned non-JSON response');
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to load dashboard');
        }

        setSummary(data.summary || null);
        setItems(data.items || []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const grouped = useMemo(() => {
    return {
      shortlisted: items.filter((x) => x.pipeline_status === 'shortlisted'),
      saved: items.filter((x) => x.pipeline_status === 'saved'),
      applied: items.filter((x) => x.application_status === 'applied'),
      followups: items.filter(
        (x) => x.application_status === 'applied' && x.follow_up_due_at
      ),
      ignored: items.filter((x) => x.pipeline_status === 'ignored')
    };
  }, [items]);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Applications Dashboard</h1>
        <p>Your pipeline control center.</p>
      </section>

      {loading ? (
        <section className="card">
          <p>Loading dashboard...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section className="grid">
            <div className="card">
              <h2>Total</h2>
              <p>{summary.total}</p>
            </div>
            <div className="card">
              <h2>Shortlisted</h2>
              <p>{summary.shortlisted}</p>
            </div>
            <div className="card">
              <h2>Saved</h2>
              <p>{summary.saved}</p>
            </div>
            <div className="card">
              <h2>Applied</h2>
              <p>{summary.applied}</p>
            </div>
            <div className="card">
              <h2>Follow-ups Due</h2>
              <p>{summary.followupsDue}</p>
            </div>
            <div className="card">
              <h2>Ignored</h2>
              <p>{summary.ignored}</p>
            </div>
          </section>

          <Section title="Shortlisted" items={grouped.shortlisted} />
          <Section title="Saved For Later" items={grouped.saved} />
          <Section title="Applied" items={grouped.applied} />

          <section className="card">
            <h2>Follow-up Queue Snapshot</h2>
            {!grouped.followups.length ? (
              <p>No follow-ups queued.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {grouped.followups.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '12px'
                    }}
                  >
                    <h3>
                      {item.job_title} at {item.company}
                    </h3>
                    <p><strong>Follow-up due:</strong> {formatDate(item.follow_up_due_at)}</p>
                    <p><strong>Status:</strong> {dueLabel(item)}</p>
                    <a href="/followups">Open follow-up queue</a>
                  </article>
                ))}
              </div>
            )}
          </section>

          <Section title="Ignored" items={grouped.ignored} />
        </>
      ) : null}
    </main>
  );
}
