"use client";

import { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import SectionCard from '../../components/SectionCard';
import Badge from '../../components/Badge';

export default function BrainPage() {
  const [profiles, setProfiles] = useState([]);
  const [summary, setSummary] = useState(null);
  const [mode, setMode] = useState('balanced');
  const [automation, setAutomation] = useState({ search: true, packageAssist: true, followUpDrafts: true, autoApplyAssist: false });

  useEffect(() => {
    fetch('/api/jobs/save-profile').then((r) => r.json()).then((d) => setProfiles(d.profiles || [])).catch(() => {});
    fetch('/api/dashboard').then((r) => r.json()).then((d) => setSummary(d.summary || null)).catch(() => {});
  }, []);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Brain Dashboard</h1>
        <p>Central command for search profile, model mode, automation switches, sniper readiness, and daily run summary.</p>
      </section>
      <section className="grid">
        <StatCard label="Model mode" value={mode} helper="OpenAI primary, Anthropic refine" />
        <StatCard label="Search automation" value={automation.search ? 'ON' : 'OFF'} helper="Quiet target scanning" />
        <StatCard label="Follow-up drafts" value={automation.followUpDrafts ? 'ON' : 'OFF'} helper="3-day default post interview" />
        <StatCard label="Sniper status" value={(summary?.overdue || 0) > 0 ? 'ACTION' : 'READY'} helper="Daily run health" />
      </section>
      <section className="grid">
        <SectionCard title="Search profile"><div className="stack">{profiles.slice(0, 5).map((profile) => <div key={profile.id} className="item-card"><strong>{profile.name}</strong><div className="small">Targets: {(profile.target_titles || []).join(', ')}</div><div className="small">Locations: {(profile.preferred_locations || []).join(', ')}</div></div>)}</div></SectionCard>
        <SectionCard title="Automation switches" subtitle="User-controlled, responsible AI only">
          <div className="stack">
            {Object.entries(automation).map(([key, value]) => <label key={key} className="row item-card"><input style={{ width: 'auto' }} type="checkbox" checked={value} onChange={() => setAutomation((s) => ({ ...s, [key]: !s[key] }))} /> <strong>{key}</strong> <span className="small">{value ? 'Enabled' : 'Disabled'}</span></label>)}
          </div>
        </SectionCard>
      </section>
      <SectionCard title="Daily run summary">
        <div className="row">
          <Badge tone="blue">Targets {summary?.total || 0}</Badge>
          <Badge tone="green">Applied {summary?.applied || 0}</Badge>
          <Badge tone="orange">Overdue {summary?.overdue || 0}</Badge>
        </div>
        <p className="small">This page is the control layer for future scheduled runs, semi-automated applications, and reminder orchestration.</p>
      </SectionCard>
    </main>
  );
}
