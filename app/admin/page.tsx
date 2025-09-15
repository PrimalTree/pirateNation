import { ManualPushButton } from './components/ManualPushButton';

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-white/70">Welcome, admin. Use the nav to manage content.</p>
      <ManualPushButton />
    </div>
  );
}

