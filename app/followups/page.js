'use client';

import { useEffect, useMemo, useState } from 'react';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString();
}

function getFollowUpStatus(item) {
  if (!item.follow_up_due_at) return 'No follow-up date';

  const now = new Date();
  const due = new Date(item.follow_up_due_at);

  if (due.getTime() < now.getTime()) return 'Overdue';
  return 'Due';
}

function daysFromNow(value) {
  if (!value) return null;
  const now = new Date();
  const due = new Date(value);
  const ms = due.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function FollowupsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    async function loadFollowups() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/followups');
        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Server returned non-JSON response');
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Failed to load follow-up queue');
        }

        setItems(data.items || []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadFollowups();
  }, []);

  const summary = useMemo(() => {
    const overdue = items.filter((item) => getFollowUpStatus(item) === 'Overdue').length;
    const due = items.filter((item) => getFollowUpStatus(item) === 'Due').length;
    return {
      total: items.length,
      overdue,
      due
    };
  }, [items]);

  async function copyFollowUpMessage(item) {
    const text = `Hi ${item.company || 'there'},

I wanted to follow up on my application for the ${item.job_title || 'role'} position.

I remain very interested in the opportunity and believe my background in remote sales leadership, performance coaching, KPI management, and sales operations would allow me to add value quickly.

Please let me know if there is any update on the process.

Best regards,
Ben Lynch`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('Follow-up message copied');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage('Could not copy follow-up message');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Follow-up Queue</h1>
        <p>See which applied roles need chasing and which ones are overdue.</p>
        {copyMessage ? <p className="small">{copyMessage}</p> : null}
      </section>

      <section className="grid">
        <div className="card">
          <h2>Total applied</h2>
          <p>{summary.total}</p>
        </div>
        <div className="card">
          <h2>Due</h2>
          <p>{summary.due}</p>
        </div>
        <div className="card">
          <h2>Overdue</h2>
          <p>{summary.overdue}</p>
        </div>
      </section>

      {loading ? (
        <section className="card">
          <p>Loading follow-up queue...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="card">
          <h2>Queue</h2>

          {items.length === 0 ? (
            <p>No follow-ups queued yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {items.map((item) => {
                const status = getFollowUpStatus(item);
                const days = daysFromNow(item.follow_up_due_at);

                return (
                  <article
                    key={item.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      padding: '14px'
                    }}
                  >
                    <h3>
                      {item.job_title} at {item.company}
                    </h3>

                    <p><strong>Status:</strong> {item.application_status || 'Unknown'}</p>
                    <p><strong>Applied at:</strong> {formatDate(item.applied_at)}</p>
                    <p><strong>Follow-up due:</strong> {formatDate(item.follow_up_due_at)}</p>
                    <p><strong>Queue status:</strong> {status}</p>
                    <p>
                      <strong>Day position:</strong>{' '}
                      {days == null ? 'Unknown' : days < 0 ? `${Math.abs(days)} day(s) overdue` : `${days} day(s) remaining`}
                    </p>
                    <p><strong>Fit score:</strong> {item.fit_score ?? '-'}</p>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={() => copyFollowUpMessage(item)}>
                        Copy follow-up message
                      </button>

                      <a href="/packages">
                        Open packages
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
