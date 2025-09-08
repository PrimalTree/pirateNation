import { Button } from '@pn/ui';

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-bold text-ecu-gold">Home</h1>
      <p className="opacity-80">Welcome aboard. Use the nav above to explore.</p>
      <div>
        <Button onClick={() => alert('Ahoy!')} className="bg-ecu-purple hover:opacity-90">Call the Crew</Button>
      </div>
    </div>
  );
}
