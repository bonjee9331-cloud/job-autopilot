"use client";

import { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import Badge from '../../components/Badge';

export default function DashboardPage() {
  const [data, setData] = useState({ summary: null, items: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData).catch((e) => setError(e.message));
  }, []);

  const grouped = useMemo(() => {
    const items = data.items || [];
    return {
      discovered: items.filter((x) => (x.pipeline_status || 'new') === 'new').slice(0, 6),
      shortlisted: items.filter((x) => x.pipeline_status === 'shortlisted').slice(0, 6),
      applied: items.filter((x) => x.application_status === 'applied').slice(0, 6),
      interviews: items.filter((x) => x.application_status === 'interview').slice(0, 6),
      overdue: items.filter((x) => x.follow_up_due_at && new Date(x.follow_up_due_at) < new Date()).slice(0, 6),
      recentPackages: items.slice(0, 5),
      topFit: [...items].sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0)).slice(0, 5)
    };
  }, [data]);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Pipeline Dashboard</h1>
        <p>Command center for targets, actions, applications, and interview momentum.</p>
      </section>

      {error ? <SectionCard title="Error"><p>{error}</p></SectionCard> : null}

      <section className="grid">
        <StatCard label="Targets tracked" value={data.summary?.total || 0} helper="All records in sniper memory" />
        <StatCard label="Shortlisted" value={data.summary?.shortlisted || 0} helper="High-priority targets" />
        <StatCard label="Applied" value={data.summary?.applied || 0} helper="Submission stage active" />
        <StatCard label="Overdue" value={data.summary?.overdue || 0} helper="Needs follow-up now" />
        <StatCard label="Interviews" value={data.summary?.interviews || 0} helper="Upcoming and in flight" />
        <StatCard label="Offers" value={data.summary?.offers || 0} helper="Conversion endgame" />
      </section>

      <section className="pipeline-grid">
        {[
          ['Discovered', grouped.discovered],
          ['Shortlisted', grouped.shortlisted],
          ['Applied', grouped.applied],
          ['Interview / Overdue', [...grouped.interviews, ...grouped.overdue].slice(0, 6)]
        ].map(([label, items]) => (
          <div key={label} className="pipeline-col">
            <h3>{label}</h3>
            {items.length ? items.map((item) => (
              <div key={item.id} className="item-card">
                <strong>{item.job_title}</strong>
                <div className="small">{item.company}</div>
                <div className="row">
                  <Badge tone="blue">Fit {item.fit_score || 0}</Badge>
                  {item.application_status ? <Badge tone="orange">{item.application_status}</Badge> : null}
                </div>
              </div>
            )) : <div className="small">No items.</div>}
          </div>
        ))}
      </section>

      <section className="grid">
        <SectionCard title="Top-fit shortlist" subtitle="Best current targets by score">
          <div className="stack">
            {grouped.topFit.map((item) => (
              <div key={item.id} className="item-card">
                <strong>{item.job_title}</strong>
                <div className="small">{item.company}</div>
                <div className="row"><Badge tone="green">Fit {item.fit_score || 0}</Badge></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Daily actions" subtitle="What to do next, fast">
          <div className="stack">
            <div className="item-card"><strong>Run sniper search</strong><div className="small">Refresh high-fit roles from all sources.</div></div>
            <div className="item-card"><strong>Send follow-ups</strong><div className="small">Work overdue items before noon.</div></div>
            <div className="item-card"><strong>Prep live interviews</strong><div className="small">Use the interview engine to sharpen answers.</div></div>
          </div>
        </SectionCard>
      </section>

      <section className="grid">
        <SectionCard title="Recent packages">
          <div className="stack">
            {grouped.recentPackages.map((item) => (
              <div key={item.id} className="item-card"><strong>{item.resume_version_name || item.job_title}</strong><div className="small">{item.company}</div></div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Overdue follow-ups">
          <div className="stack">
            {grouped.overdue.length ? grouped.overdue.map((item) => (
              <div key={item.id} className="item-card"><strong>{item.job_title}</strong><div className="small">{item.company}</div><div className="small">Due: {new Date(item.follow_up_due_at).toLocaleString()}</div></div>
            )) : <p className="small">No overdue follow-ups.</p>}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
