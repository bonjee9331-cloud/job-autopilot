"use client";

import { useEffect, useState } from 'react';
import SectionCard from '../../components/SectionCard';
import Badge from '../../components/Badge';

export default function FollowupsPage() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/followups').then((r) => r.json()).then((data) => {
      if (!data.ok) throw new Error(data.error || 'Failed to load followups');
      setItems(data.items || []);
      setTemplates(data.templates || []);
    }).catch((e) => setError(e.message));
  }, []);

  async function schedule(item, templateId) {
    setStatus('Scheduling follow-up draft...');
    const res = await fetch('/api/followups/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, templateId, candidateName: 'Ben Lynch' }) });
    const data = await res.json();
    if (!data.ok) return setError(data.error || 'Failed to schedule');
    setItems((current) => current.map((x) => x.id === item.id ? data.item : x));
    setStatus(`Draft scheduled: ${data.subject}`);
  }

  return (
    <main className="stack">
      <section className="hero"><h1>Follow-up Automation v1</h1><p>Editable templates, default 3-day post-interview logic, and reminder-safe drafts.</p></section>
      {status ? <SectionCard title="Status"><p>{status}</p></SectionCard> : null}
      {error ? <SectionCard title="Error"><p>{error}</p></SectionCard> : null}
      <section className="grid">
        <SectionCard title="Template library" subtitle="Editable shells for safe follow-up language">
          <div className="stack">{templates.map((template) => <div key={template.id} className="item-card"><strong>{template.name}</strong><div className="small">Trigger: {template.trigger_type} · Delay: {template.days_after} days</div><pre>{template.body_template}</pre></div>)}</div>
        </SectionCard>
        <SectionCard title="Scheduled / due items">
          <div className="stack">{items.map((item) => <div key={item.id} className="item-card"><strong>{item.job_title}</strong><div className="small">{item.company}</div><div className="row"><Badge tone={item.follow_up_due_at && new Date(item.follow_up_due_at) < new Date() ? 'red' : 'orange'}>{item.follow_up_status || 'not_scheduled'}</Badge><span className="small">Due: {item.follow_up_due_at ? new Date(item.follow_up_due_at).toLocaleString() : 'Not set'}</span></div><div className="row">{templates[0] ? <button className="btn btn-primary" onClick={() => schedule(item, templates[0].id)}>Use default template</button> : null}</div></div>)}</div>
        </SectionCard>
      </section>
    </main>
  );
}
