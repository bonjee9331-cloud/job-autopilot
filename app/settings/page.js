import { candidateProfile } from '../../lib/data';

export default function SettingsPage() {
  return (
    <main>
      <h1>Settings</h1>
      <pre>{JSON.stringify(candidateProfile, null, 2)}</pre>
    </main>
  );
}
