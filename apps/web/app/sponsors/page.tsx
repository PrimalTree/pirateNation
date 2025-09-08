import { createSupabaseServer } from '../../lib/supabase-server';

export default async function SponsorsPage() {
  const supabase = createSupabaseServer();
  const { data: sponsors } = await supabase.from('sponsors').select('id, name, website_url, logo_url').limit(20);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Sponsors</h1>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sponsors?.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded border border-white/10 p-3">
            <div className="h-8 w-8 rounded bg-white/10" aria-hidden />
            <div className="flex-1">
              <div className="font-medium">{s.name}</div>
              {s.website_url && (
                <a className="text-sm text-ecu-gold underline" href={s.website_url} target="_blank">Visit</a>
              )}
            </div>
          </li>
        )) || <li className="text-white/70">No sponsors yet.</li>}
      </ul>
    </div>
  );
}

