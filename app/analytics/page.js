"use client";

import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { fetch('/api/analytics').then((r) => r.json()).then((d) => setMetrics(d.metrics || null)).catch(() => {}); }, []);
  return (
    <main className="stack">
      <section className="hero"><h1>Analytics</h1><p>Track conversion, response rate, time-to-interview proxies, and best-performing CV versions.</p></section>
      <section className="grid">
        <StatCard label="Application → Interview" value={`${metrics?.applicationToInterviewRate || 0}%`} helper="Conversion rate" />
        <StatCard label="Interview → Offer" value={`${metrics?.interviewToOfferRate || 0}%`} helper="Offer conversion" />
        <StatCard label="Response rate" value={`${metrics?.responseRate || 0}%`} helper="Interview + offer / total tracked" />
        <StatCard label="Applied" value={metrics?.applied || 0} helper="Submission count" />
      </section>
      <SectionCard title="Best-performing CV versions"><div className="stack">{(metrics?.bestCvVersions || []).map(([name, count]) => <div key={name} className="item-card"><strong>{name}</strong><div className="small">Used {count} time(s)</div></div>)}</div></SectionCard>
    </main>
  );
}
