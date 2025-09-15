export default function StartPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">Pirate Nation</h1>
        <p className="mt-2 max-w-prose text-zinc-300">
          Pirate Nation is a lightweight, fan-first web app for ECU Football.
          It brings together game-day essentials: live scores, polls, chat, UGC,
          the stadium map, and the tradition of raising the Flag during No Quarter.
        </p>
        <p className="mt-2 max-w-prose text-zinc-400">
          This MVP focuses on reliability, fast loads, and clear UX on mobile. More features roll out as data sources and partners solidify.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-semibold">Roadmap</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 font-medium text-zinc-200">Phase 1 — MVP (live)</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Raise Flag fullscreen experience</li>
              <li>Static stadium map (token-configured)</li>
              <li>Fan polls (Supabase)</li>
              <li>Players list (basic profile)</li>
              <li>Game page tabs (Feed, Polls, Chat, UGC, Map)</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Phase 2 — Engagement</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Live map overlays and routing</li>
              <li>Richer player pages + NIL links</li>
              <li>Notifications and reminders</li>
              <li>Moderated chat with reactions</li>
              <li>UGC submissions with templates</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Phase 3 — Partners</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Sponsor placements and promos</li>
              <li>Ticketing and parking integrations</li>
              <li>Official stats feeds</li>
              <li>Expanded sports coverage</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Phase 4 — Polish</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Accessibility pass</li>
              <li>Offline-friendly surfaces</li>
              <li>Performance and caching sweeps</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <p className="mt-2 text-zinc-300">Create an account or sign in to join polls, chat, and save preferences.</p>
        <div className="mt-4">
          <a href="/auth/signin" className="inline-flex items-center rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-zinc-900 hover:bg-yellow-300">Sign up / Sign in</a>
        </div>
      </section>
    </div>
  );
}

