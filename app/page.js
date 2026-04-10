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
            ? 'This starter is configured for Ben Lynch with demo data.'
            : 'Live mode is active. Your system is now connected and ready.'}
        </p>
        <p className="small">
          Demo mode: <span className="badge">{appConfig.demoMode ? 'On' : 'Off'}</span>
        </p>
      </section>

      <section className="grid">
        <StatCard
          label="Target roles"
          value={candidateProfile.targetRoles.length}
          hint={candidateProfile.targetRoles.join(', ')}
        />
        <StatCard label="Matched jobs" value={matchedJobs} hint="Jobs that fit your filters" />
        <StatCard label="Applications" value={appliedJobs} hint="Applied or in progress" />
        <StatCard label="Interviews" value={interviews.length} hint="Upcoming bookings and prep" />
      </section>

      <section>
        <h2 className="section-title">Latest jobs</h2>
        <Table
          columns={[
            { key: 'title', label: 'Role' },
            { key: 'company', label: 'Company' },
            { key: 'location', label: 'Location' },
            { key: 'salary', label: 'Salary' },
            { key: 'fitScore', label: 'Fit' }
          ]}
          rows={jobs}
        />
      </section>

      <section>
        <h2 className="section-title">Upcoming interviews</h2>
        <Table
          columns={[
            { key: 'role', label: 'Role' },
            { key: 'company', label: 'Company' },
            { key: 'interviewAt', label: 'When' },
            { key: 'prepSummary', label: 'Prep summary' }
          ]}
          rows={interviews}
        />
      </section>

      <section>
        <h2 className="section-title">Application tracker</h2>
        <Table
          columns={[
            { key: 'company', label: 'Company' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' },
            { key: 'appliedAt', label: 'Applied' },
            { key: 'followUpDueAt', label: 'Follow-up due' }
          ]}
          rows={applications}
        />
      </section>
    </main>
  );
}
