"use client";

import { useEffect, useState } from 'react';
import SectionCard from '../../components/SectionCard';

export default function InterviewsPage() {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prep, setPrep] = useState(null);
  const [status, setStatus] = useState('');
  const [calendarStatus, setCalendarStatus] = useState('');

  useEffect(() => {
    fetch('/api/packages').then((r) => r.json()).then((d) => setPackages(d.packages || [])).catch(() => {});
  }, []);

  async function generatePrep(item) {
    setSelected(item);
    setStatus('Generating interview prep...');
    const res = await fetch('/api/interview-prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.ok) return setStatus(data.error || 'Failed to generate prep');
    setPrep(data.data);
    setStatus('Interview prep ready.');
  }

  async function scheduleMockInterview() {
    const res = await fetch('/api/calendar/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: `Interview prep - ${selected?.job_title || 'Role'}`, start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString(), reminders: [1440, 60] }) });
    const data = await res.json();
    setCalendarStatus(data.message || 'Calendar scheduling shell ready');
  }

  return (
    <main className="stack">
      <section className="hero"><h1>Interviews</h1><p>Role-specific questions, answer critique, mock interview shell, and calendar integration foundation.</p></section>
      {status ? <SectionCard title="Status"><p>{status}</p></SectionCard> : null}
      {calendarStatus ? <SectionCard title="Calendar"><p>{calendarStatus}</p></SectionCard> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        <aside className="mobile-panel stack">
          <h2 style={{ margin: 0 }}>Packages</h2>
          {packages.map((item) => <button key={item.id} onClick={() => generatePrep(item)} style={{ textAlign: 'left', padding: 12, borderRadius: 14, border: selected?.id === item.id ? '2px solid #ff8a1f' : '1px solid #294488', background: '#fff', color: '#08162f' }}><strong>{item.job_title}</strong><div>{item.company}</div></button>)}
        </aside>
        <section className="stack">
          {prep ? (
            <>
              <SectionCard title="60-second pitch" actions={<button className="btn btn-secondary" onClick={scheduleMockInterview}>Create prep event</button>}><p>{prep.pitch}</p></SectionCard>
              <SectionCard title="Likely interview questions"><ul>{(prep.questions || []).map((q, i) => <li key={i}>{q}</li>)}</ul></SectionCard>
              <SectionCard title="Answer critique / answer angles"><ul>{(prep.answers || []).map((a, i) => <li key={i}>{a}</li>)}</ul></SectionCard>
              <SectionCard title="Company angles"><ul>{(prep.companyAngles || []).map((x, i) => <li key={i}>{x}</li>)}</ul></SectionCard>
              <SectionCard title="Red flags"><ul>{(prep.redFlags || []).map((x, i) => <li key={i}>{x}</li>)}</ul></SectionCard>
            </>
          ) : <SectionCard title="Mock interviews"><p>Select a package to generate role-specific prep. Voice mode can be layered later without changing the data model.</p></SectionCard>}
        </section>
      </div>
    </main>
  );
}
