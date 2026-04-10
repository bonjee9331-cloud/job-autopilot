import Table from '../../components/Table';
import { jobs } from '../../lib/data';

export default function JobsPage() {
  return (
    <main className="stack">
      <section className="hero">
        <h1>Matched jobs</h1>
        <p>These are the roles that fit your current profile and filters.</p>
      </section>
      <Table
        columns={[
          { key: 'title', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'location', label: 'Location' },
          { key: 'salary', label: 'Salary' },
          { key: 'fitScore', label: 'Fit score' },
          { key: 'status', label: 'Status' }
        ]}
        rows={jobs}
      />
    </main>
  );
}
