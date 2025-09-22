'use client';

import roster from '../../../data/public/roster.json';
import { fetchEspnTeamRoster, normalizeEspnTeamRoster } from '@pirate-nation/fetcher';
import { DonationForm } from '@components/support/DonationForm';

type Player = { id: string; name: string; position?: string; number?: number };

export default async function SupportPage() {
  let raw: Array<Player> | null = null;
  try {
    const live = await fetchEspnTeamRoster('151');
    const norm = normalizeEspnTeamRoster(live) as Array<any>;
    raw = norm.map((p) => ({ id: String(p.id), name: String(p.name), position: p.position, number: typeof p.number === 'number' ? p.number : undefined }));
  } catch { }
  if (!raw) {
    raw = (roster as any).players as Array<Player>;
  }
  // Ensure full team is shown: dedupe by id and sort by jersey number then name
  const playersMap = new Map<string, Player>();
  for (const p of raw) playersMap.set(p.id, p);
  const players = Array.from(playersMap.values()).sort((a, b) => {
    const an = typeof a.number === 'number' ? a.number : 9999;
    const bn = typeof b.number === 'number' ? b.number : 9999;
    if (an !== bn) return an - bn;
    return a.name.localeCompare(b.name);
  });
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="mt-2 text-zinc-300">Support ECU student-athletes through NIL collectives.</p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Player Roster</h2>
          <div className="text-sm text-zinc-400">{players.length} players</div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {players?.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div>
                <div className="font-medium text-zinc-100">{p.name}</div>
                <div className="text-xs text-zinc-400">{p.position || '—'}</div>
              </div>
              <div className="text-lg font-bold text-ecu-gold">{p.number ?? '—'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-xl font-semibold">Make a Donation</h2>

        <button
          onClick={() => window.open('https://ecupirateclub.com/', '_blank')}
          className="inline-block px-4 py-2 m-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          PIRATE CLUB
        </button>

        <button
          onClick={() => window.open('https://teamboneyard.org/', '_blank')}
          className="inline-block px-4 py-2 m-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          TEAM BONEYARD
        </button>

        {/* <DonationForm /> */}
        {/*<p className="mt-3 text-xs text-zinc-400">Donations support OMVP, DMVP, or the Team. Payments are processed via PayPal.</p>*/}
      </section>
    </div>
  );
}
