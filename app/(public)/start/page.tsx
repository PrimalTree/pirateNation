export default function StartPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">Purple Armada</h1>
        <p className="mt-2 max-w-prose text-zinc-300">
          Purple Armada is a lightweight, fan-first web app for ECU Football. Made by Pirates, for Pirates.
          It brings together game-day essentials: live scores, polls, chat, User generated content,
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
            <div className="mb-1 font-medium text-zinc-200">Now</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Kickoff Countdown</li>
              <li>Raise the Flag on your phone during No Quarter</li>
              <li>Stadium map at a glance</li>
              <li>Fan polls you can vote in</li>
              <li>Team roster with quick links</li>
              <li>Live game hub with updates</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Next</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Better player pages and NIL info</li>
              <li>Reminders for kickoff and big moments</li>
              <li>Chat reactions and highlights</li>
              <li>Share photos and stories from game day</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Later</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Sponsor perks and fan rewards</li>
              <li>Ticket and parking info in one place</li>
              <li>Richer stats and insights</li>
            </ul>
          </div>
          <div>
            <div className="mb-1 font-medium text-zinc-200">Future</div>
            <ul className="list-disc space-y-1 pl-5 text-zinc-400">
              <li>Support for more ECU sports</li>
              <li>Faster loads and smoother offline use</li>
              <li>Accessibility improvements across the app</li>
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
