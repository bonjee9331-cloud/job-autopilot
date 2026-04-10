import Table from '../../components/Table';
import { applications } from '../../lib/data';

export default function ApplicationsPage() {
  return (
    <main>
      <h1>Applications</h1>
      <Table rows={applications} />
    </main>
  );
}
