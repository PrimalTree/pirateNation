import { ManualScheduleUpdateButton } from './components/ManualScheduleUpdateButton';

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p>Welcome to the admin dashboard.</p>
      <div className="mt-4">
        {/* Manual schedule update */}
        {/* Uses NEXT_PUBLIC_CRON_SECRET in client to auth the request */}
        <ManualScheduleUpdateButton />
      </div>
    </div>
  );
}
