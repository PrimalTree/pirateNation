export default function HelpPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold">HELP</h1>
        <p className="mt-2 text-zinc-300">We’re here to help. Find answers and ways to reach us.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-2 text-xl font-semibold">FAQ</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>
              <span className="font-medium text-zinc-100">How do I sign in?</span>
              <div>Use your email and password on the sign-in page. Verified accounts are redirected to Gameday.</div>
            </li>
            <li>
              <span className="font-medium text-zinc-100">Where can I give feedback?</span>
              <div>Visit the Feedback page from the footer links.</div>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-2 text-xl font-semibold">Contact</h2>
          <p className="text-sm text-zinc-300">Email us at <a className="text-ecu-gold underline" href="mailto:support@primal-tree.ai">support@primal-tree.ai</a>.</p>
        </div>
      </section>
    </div>
  );
}

