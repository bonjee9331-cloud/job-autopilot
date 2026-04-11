"use client";

import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import SectionCard from '../../components/SectionCard';

const defaults = {
  targetTitles: ['Sales Manager', 'Sales Operations Manager', 'Sales Team Leader', 'Remote Sales Manager', 'Contact Center Manager'],
  preferredLocations: ['Australia', 'New Zealand'],
  location: '',
  minSalary: 70000,
  remoteOnly: true,
  excludedKeywords: ['finance', 'investment', 'real estate', 'car sales'],
  strictMode: false,
  sourcePreferences: []
};

function fitTone(score) {
  if (score >= 85) return 'green';
  if (score >= 65) return 'blue';
  if (score >= 45) return 'yellow';
  return 'red';
}

export default function JobsPage() {
  const [filters, setFilters] = useState(defaults);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('fit');
  const [viewMode, setViewMode] = useState('cards');
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('AU leadership sniper');

  useEffect(() => {
    fetch('/api/jobs/save-profile').then((r) => r.json()).then((data) => setProfiles(data.profiles || [])).catch(() => {});
  }, []);

  async function runSearch() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Search failed');
      setJobs(data.jobs || []);
      setSelectedJob((data.jobs || [])[0] || null);
      setMessage(`Loaded ${data.count || 0} targets into sniper view.`);
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      const response = await fetch('/api/jobs/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, name: profileName })
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save profile');
      setProfiles((current) => [data.profile, ...current]);
      setMessage(`Saved profile: ${data.profile.name}`);
    } catch (e) {
      setError(e.message || 'Failed to save profile');
    }
  }

  async function generatePackage(job) {
    try {
      setError('');
      setMessage('Generating package...');
      const response = await fetch('/api/brain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          source: job.source,
          applyUrl: job.apply_url,
          location: job.location,
          salaryText: job.salary_text,
          remote: job.remote,
          fitScore: job.fit_score,
          matchedTitle: job.matched_title
        })
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to generate package');
      setMessage(`Package created and stored for ${job.title}.`);
    } catch (e) {
      setError(e.message || 'Failed to generate package');
    }
  }

  const visibleJobs = useMemo(() => {
    const copy = [...jobs];
    if (sortBy === 'fit') copy.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
    if (sortBy === 'salary') copy.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    if (sortBy === 'company') copy.sort((a, b) => String(a.company || '').localeCompare(String(b.company || '')));
    return copy;
  }, [jobs, sortBy]);

  return (
    <main className="stack">
      <section className="hero">
        <h1>Jobs V2 Sniper UI</h1>
        <p>Military-grade targeting layout with fast triage, fit breakdown, saved profile shell, and one-click package generation.</p>
      </section>

      {message ? <SectionCard title="Status"><p>{message}</p></SectionCard> : null}
      {error ? <SectionCard title="Error"><p>{error}</p></SectionCard> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 420px', gap: 18, alignItems: 'start' }}>
        <aside className="mobile-panel filter-rail">
          <div className="command-bar">
            <h2 style={{ margin: 0 }}>Search Profile</h2>
            <Badge tone={filters.strictMode ? 'orange' : 'blue'}>{filters.strictMode ? 'Sniper strict' : 'Sniper broad'}</Badge>
          </div>
          <div className="filter-block">
            <h3>Target roles</h3>
            <textarea rows="6" value={filters.targetTitles.join('\n')} onChange={(e) => setFilters((f) => ({ ...f, targetTitles: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) }))} />
          </div>
          <div className="filter-block">
            <h3>Preferred locations</h3>
            <textarea rows="4" value={filters.preferredLocations.join('\n')} onChange={(e) => setFilters((f) => ({ ...f, preferredLocations: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) }))} />
          </div>
          <div className="input-grid" style={{ gridTemplateColumns: '1fr' }}>
            <label className="small">Specific location<input value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))} /></label>
            <label className="small">Minimum salary<input value={filters.minSalary} onChange={(e) => setFilters((f) => ({ ...f, minSalary: Number(e.target.value || 0) }))} /></label>
            <label className="small">Avoid list<textarea rows="4" value={filters.excludedKeywords.join('\n')} onChange={(e) => setFilters((f) => ({ ...f, excludedKeywords: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) }))} /></label>
            <label className="row"><input style={{ width: 'auto' }} type="checkbox" checked={filters.remoteOnly} onChange={(e) => setFilters((f) => ({ ...f, remoteOnly: e.target.checked }))} /> Remote only</label>
            <label className="row"><input style={{ width: 'auto' }} type="checkbox" checked={filters.strictMode} onChange={(e) => setFilters((f) => ({ ...f, strictMode: e.target.checked }))} /> Sniper mode strict</label>
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={runSearch}>{loading ? 'Scanning...' : 'Scan Targets'}</button>
            <button className="btn btn-secondary" onClick={() => setFilters(defaults)}>Reset</button>
          </div>
          <div className="filter-block">
            <h3>Saved search profile shell</h3>
            <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Profile name" />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={saveProfile}>Save Profile</button>
            </div>
            <div className="stack" style={{ marginTop: 10 }}>
              {profiles.slice(0, 4).map((profile) => <div key={profile.id} className="item-card"><strong>{profile.name}</strong><div className="small">{(profile.target_titles || []).slice(0, 2).join(', ')}</div></div>)}
            </div>
          </div>
        </aside>

        <section className="stack">
          <SectionCard title="Command Bar" subtitle="Sort, switch views, and work the queue fast" actions={<div className="row"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 150 }}><option value="fit">Sort by fit</option><option value="salary">Sort by salary</option><option value="company">Sort by company</option></select><select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ width: 140 }}><option value="cards">Card view</option><option value="compact">Compact view</option><option value="table">Table view</option></select></div>}>
            <div className="row">
              <Badge tone="blue">Targets {visibleJobs.length}</Badge>
              <Badge tone="orange">Precise</Badge>
              <span className="small">Use the drawer to inspect fit breakdown before you commit.</span>
            </div>
          </SectionCard>

          {viewMode !== 'table' ? (
            <div className="result-list">
              {visibleJobs.map((job) => (
                <button key={job.id} className="job-card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSelectedJob(job)}>
                  <div className="kpi-line"><strong>{job.title}</strong><Badge tone={fitTone(job.fit_score)}>Fit {job.fit_score || 0}</Badge></div>
                  <div className="small">{job.company} · {job.location}</div>
                  <div className="row">
                    <Badge tone="blue">{job.source}</Badge>
                    {job.remote ? <Badge tone="green">Remote</Badge> : null}
                    {job.matched_title ? <Badge tone="yellow">{job.matched_title}</Badge> : null}
                  </div>
                  {viewMode === 'cards' ? <div className="small">{String(job.description || '').slice(0, 180)}...</div> : null}
                  <div className="row"><span className="small">{job.salary_text || 'Not listed'}</span></div>
                </button>
              ))}
              {!visibleJobs.length ? <div className="small">No targets loaded yet.</div> : null}
            </div>
          ) : (
            <SectionCard title="Table View">
              <div className="table-wrap"><table><thead><tr><th>Role</th><th>Company</th><th>Location</th><th>Source</th><th>Fit</th></tr></thead><tbody>{visibleJobs.map((job) => <tr key={job.id} onClick={() => setSelectedJob(job)}><td>{job.title}</td><td>{job.company}</td><td>{job.location}</td><td>{job.source}</td><td>{job.fit_score || 0}</td></tr>)}</tbody></table></div>
            </SectionCard>
          )}
        </section>

        <aside className="intel-panel">
          {!selectedJob ? <p>Select a target to view intel.</p> : (
            <div className="stack">
              <div>
                <h2 style={{ marginTop: 0 }}>{selectedJob.title}</h2>
                <p className="small">{selectedJob.company} · {selectedJob.location}</p>
              </div>
              <div className="row">
                <Badge tone={fitTone(selectedJob.fit_score)}>Fit {selectedJob.fit_score || 0}</Badge>
                <Badge tone="blue">{selectedJob.source}</Badge>
                {selectedJob.remote ? <Badge tone="green">Remote</Badge> : null}
              </div>
              <div className="drawer-section">
                <div className="item-card">
                  <strong>Fit score explanation</strong>
                  <div className="small">Title match: {selectedJob.fit_breakdown?.titleMatch || 0} · Skill alignment: {selectedJob.fit_breakdown?.skillAlignment || 0} · Location fit: {selectedJob.fit_breakdown?.locationFit || 0} · Remote fit: {selectedJob.fit_breakdown?.remoteFit || 0} · Comp fit: {selectedJob.fit_breakdown?.compFit || 0}</div>
                </div>
                <div className="item-card">
                  <strong>Role brief</strong>
                  <div className="small">{String(selectedJob.description || '').slice(0, 650)}...</div>
                </div>
                <div className="item-card">
                  <strong>Action rail</strong>
                  <div className="row">
                    {selectedJob.apply_url ? <a className="btn btn-secondary" href={selectedJob.apply_url} target="_blank">Open role</a> : null}
                    <button className="btn btn-primary" onClick={() => generatePackage(selectedJob)}>Generate package</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
