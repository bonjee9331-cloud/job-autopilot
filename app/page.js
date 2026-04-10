import StatCard from '../components/StatCard';
import Table from '../components/Table';
import { applications, candidateProfile, interviews, jobs } from '../lib/data';
import { appConfig } from '../lib/config';

export default function HomePage() {
  const matchedJobs = jobs.filter((job) => job.status === 'matched').length;
  const appliedJobs = jobs.filter(
    (job) => job.status === 'applied' || job.status === 'interview'
  ).length;

  return (
    <main className="stack">
      <section className="hero">
        <h1>Job search on autopilot</h1>
        <p>
          {appConfig.demoMode
            ? 'This starter is configured with demo data.'
            : 'Live mode is active.'}
        </p>
        <p className="small">
          Demo mode: <span className="badge">{appConfig.demoMode ? 'On' : 'Off'}</span>
        </p>
      </section>

      <section className="grid">
        <StatCard label="Target roles" value={candidateProfile.targetRoles.length} />
        <StatCard label="Matched jobs" value={matchedJobs} />
        <StatCard label="Applications" value={appliedJobs} />
        <StatCard label="Interviews" value={interviews.length} />
      </section>

      <section>
        <h2>Latest jobs</h2>
        <Table rows={jobs} />
      </section>
    </main>
  );
}
