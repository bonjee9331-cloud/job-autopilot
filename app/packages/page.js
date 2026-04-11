"use client";

import { useEffect, useState } from 'react';
import SectionCard from '../../components/SectionCard';
import Badge from '../../components/Badge';

export default function PackagesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [coverLetterData, setCoverLetterData] = useState(null);

  useEffect(() => {
    fetch('/api/packages').then((r) => r.json()).then((data) => {
      if (!data.ok) throw new Error(data.error || 'Failed to load packages');
      setItems(data.packages || []);
      setSelected((data.packages || [])[0] || null);
    }).catch((e) => setError(e.message));
  }, []);

  async function markApplied(item) {
    setStatus('Marking applied...');
    const res = await fetch('/api/packages/mark-applied', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    const data = await res.json();
    if (!data.ok) return setError(data.error || 'Failed to mark applied');
    setItems((current) => current.map((x) => x.id === item.id ? data.package : x));
    setSelected(data.package);
    setStatus('Marked as applied and follow-up scheduled +3 days.');
  }

  async function upgradeCoverLetter(item) {
    setStatus('Upgrading cover letter...');
    const res = await fetch('/api/cover-letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.ok) return setError(data.error || 'Cover letter generation failed');
    setCoverLetterData(data.data);
    setStatus(data.warning ? `Cover letter generated with warning: ${data.warning}` : 'Cover letter generated.');
  }

  return (
    <main className="stack">
      <section className="hero"><h1>Packages</h1><p>Master-detail workspace for tailored resumes, timelines, and cover letters.</p></section>
      {error ? <SectionCard title="Error"><p>{error}</p></SectionCard> : null}
      {status ? <SectionCard title="Status"><p>{status}</p></SectionCard> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, alignItems: 'start' }}>
        <aside className="mobile-panel stack">
          <h2 style={{ margin: 0 }}>Saved packages</h2>
          {items.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} style={{ textAlign: 'left', padding: 12, borderRadius: 14, border: selected?.id === item.id ? '2px solid #ff8a1f' : '1px solid #294488', background: '#fff', color: '#09152f' }}>
              <strong>{item.job_title}</strong>
              <div>{item.company}</div>
              <div style={{ fontSize: 12, opacity: .7 }}>Fit {item.fit_score || 0}</div>
            </button>
          ))}
        </aside>
        <section className="stack">
          {selected ? (
            <>
              <SectionCard title={`${selected.job_title} at ${selected.company}`} subtitle={selected.resume_version_name || 'Unnamed package'} actions={<div className="row"><Badge tone="blue">Fit {selected.fit_score || 0}</Badge><Badge tone="orange">{selected.pipeline_status || 'new'}</Badge><Badge tone="green">{selected.application_status || 'draft'}</Badge></div>}>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => markApplied(selected)}>Mark Applied</button>
                  <button className="btn btn-secondary" onClick={() => upgradeCoverLetter(selected)}>Upgrade Cover Letter</button>
                  <a className="btn btn-secondary" href="/resume-builder">Open Resume Builder</a>
                </div>
              </SectionCard>
              <SectionCard title="Tailored Summary"><p>{selected.tailored_summary}</p></SectionCard>
              <SectionCard title="Skills"><ul>{(selected.tailored_skills || []).map((skill, i) => <li key={i}>{skill}</li>)}</ul></SectionCard>
              <SectionCard title="Experience Bullets"><ul>{(selected.tailored_experience_bullets || []).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul></SectionCard>
              <SectionCard title="Resume Snapshot"><pre>{selected.resume_snapshot}</pre></SectionCard>
              <SectionCard title="Cover Letter" subtitle="ATS-safe, timeline-consistent, human tone">
                <pre>{coverLetterData?.coverLetter || selected.cover_letter}</pre>
              </SectionCard>
            </>
          ) : <SectionCard title="Packages"><p>No package selected.</p></SectionCard>}
        </section>
      </div>
    </main>
  );
}
