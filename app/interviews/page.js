import Table from '../../components/Table';
import { interviews } from '../../lib/data';

export default function InterviewsPage() {
  return (
    <main>
      <h1>Interviews</h1>
      <Table rows={interviews} />
    </main>
  );
}
