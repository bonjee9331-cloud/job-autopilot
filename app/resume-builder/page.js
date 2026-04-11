"use client";

import { useEffect, useState } from 'react';
import SectionCard from '../../components/SectionCard';

export default function ResumeBuilderPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('');
  const [warning, setWarning] = useState('');
  const [contact, setContact] = useState({ name: 'Ben Lynch', email: '', phone: '', location: 'Hua Hin, Thailand', linkedin: '' });

  useEffect(() => {
    fetch('/api/packages').then((r) => r.json()).then((d) => setItems(d.packages || [])).catch(() => {});
  }, []);

  async function buildResume(item) {
    setSelected(item);
    setStatus('Building resume...');
    setWarning('');
    const res = await fetch('/api/resume-builder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.ok) return setStatus(data.error || 'Resume builder failed');
    setResume(data.data);
    setWarning(data.warning || '');
    setStatus('Resume ready.');
  }

  async function download(type) {
    const payload = { ...contact, headline: resume.headline, professionalSummary: resume.professionalSummary, keySkills: resume.keySkills || [], experienceBullets: resume.experienceBullets || [] };
    const res = await fetch(`/api/resume-export/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'pdf' ? 'Ben_Lynch_Resume.pdf' : 'Ben_Lynch_Resume.docx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="stack">
      <section className="hero"><h1>Resume Builder</h1><p>OpenAI drafts the factual core. Anthropic sharpens the tone if available. Export recruiter-ready CVs in Word and PDF.</p></section>
      {status ? <SectionCard title="Status"><p>{status}</p></SectionCard> : null}
      {warning ? <SectionCard title="Warning"><p>{warning}</p></SectionCard> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        <aside className="mobile-panel stack">
          <h2 style={{ margin: 0 }}>Saved packages</h2>
          {items.map((item) => <button key={item.id} onClick={() => buildResume(item)} style={{ textAlign: 'left', padding: 12, borderRadius: 14, border: selected?.id === item.id ? '2px solid #ff8a1f' : '1px solid #294488', background: '#fff', color: '#08162f' }}><strong>{item.job_title}</strong><div>{item.company}</div></button>)}
        </aside>
        <section className="stack">
          {resume ? (
            <>
              <SectionCard title="Export controls" subtitle="Complete and ready to attach to email">
                <div className="input-grid">
                  <label className="small">Name<input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} /></label>
                  <label className="small">Email<input value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} /></label>
                  <label className="small">Phone<input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} /></label>
                  <label className="small">Location<input value={contact.location} onChange={(e) => setContact((c) => ({ ...c, location: e.target.value }))} /></label>
                  <label className="small" style={{ gridColumn: '1 / -1' }}>LinkedIn<input value={contact.linkedin} onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))} /></label>
                </div>
                <div className="row" style={{ marginTop: 14 }}><button className="btn btn-primary" onClick={() => download('docx')}>Download Word</button><button className="btn btn-orange" onClick={() => download('pdf')}>Download PDF</button></div>
              </SectionCard>
              <SectionCard title="Headline"><p>{resume.headline}</p></SectionCard>
              <SectionCard title="Professional Summary"><p>{resume.professionalSummary}</p></SectionCard>
              <SectionCard title="Key Skills"><ul>{(resume.keySkills || []).map((x, i) => <li key={i}>{x}</li>)}</ul></SectionCard>
              <SectionCard title="Experience Bullets"><ul>{(resume.experienceBullets || []).map((x, i) => <li key={i}>{x}</li>)}</ul></SectionCard>
              <SectionCard title="ATS Keywords"><ul>{(resume.atsKeywords || []).map((x, i) => <li key={i}>{x}</li>)}</ul></SectionCard>
            </>
          ) : <SectionCard title="Resume builder"><p>Select a saved package to generate a polished CV.</p></SectionCard>}
        </section>
      </div>
    </main>
  );
}
