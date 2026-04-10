import Table from '../../components/Table';
import { jobs } from '../../lib/data';

export default function JobsPage() {
  return (
    <main>
      <h1>Jobs</h1>
      <Table rows={jobs} />
    </main>
  );
}
