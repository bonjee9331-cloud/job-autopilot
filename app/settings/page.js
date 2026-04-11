"use client";

import { useState } from 'react';
import SectionCard from '../../components/SectionCard';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ primaryModel: 'OpenAI', secondaryModel: 'Anthropic', strictFacts: true, humanTone: true, autoApplyAssist: false, calendarReminders: '24h + 1h' });
  return (
    <main className="stack">
      <section className="hero"><h1>Settings</h1><p>Model selection, automation defaults, and recruiter-safe writing controls.</p></section>
      <SectionCard title="Model configuration"><div className="input-grid"><label className="small">Primary model<input value={settings.primaryModel} onChange={(e) => setSettings((s) => ({ ...s, primaryModel: e.target.value }))} /></label><label className="small">Secondary model<input value={settings.secondaryModel} onChange={(e) => setSettings((s) => ({ ...s, secondaryModel: e.target.value }))} /></label></div></SectionCard>
      <SectionCard title="Safety controls"><div className="stack">{Object.entries(settings).filter(([k]) => ['strictFacts','humanTone','autoApplyAssist'].includes(k)).map(([key, value]) => <label key={key} className="row item-card"><input style={{ width: 'auto' }} type="checkbox" checked={Boolean(value)} onChange={() => setSettings((s) => ({ ...s, [key]: !s[key] }))} /> <strong>{key}</strong></label>)}</div></SectionCard>
      <SectionCard title="Reminder defaults"><label className="small">Calendar reminders<input value={settings.calendarReminders} onChange={(e) => setSettings((s) => ({ ...s, calendarReminders: e.target.value }))} /></label></SectionCard>
    </main>
  );
}
