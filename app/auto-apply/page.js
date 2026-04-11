"use client";

import { useState } from 'react';
import SectionCard from '../../components/SectionCard';

export default function AutoApplyPage() {
  const [applyUrl, setApplyUrl] = useState('');
  const [result, setResult] = useState(null);
  async function prepare() {
    const res = await fetch('/api/auto-apply/prepare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applyUrl }) });
    const data = await res.json();
    setResult(data);
  }
  return (
    <main className="stack">
      <section className="hero"><h1>Auto Apply</h1><p>Semi-automated first. Official APIs first. Browser automation only where compliant and user-approved.</p></section>
      <SectionCard title="Preparation shell"><label className="small">Target application URL<input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://..." /></label><div className="row" style={{ marginTop: 14 }}><button className="btn btn-primary" onClick={prepare}>Prepare application</button></div></SectionCard>
      {result ? <SectionCard title="Preparation result"><pre>{JSON.stringify(result, null, 2)}</pre></SectionCard> : null}
    </main>
  );
}
