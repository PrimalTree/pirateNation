export default function TermsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="text-zinc-300">By using this MVP, you agree to basic usage rules.</p>
      <ul className="list-disc space-y-1 pl-6 text-zinc-400">
        <li>Use the app responsibly; no abusive content in chat or uploads.</li>
        <li>Content and scores are provided without warranty; may be delayed.</li>
        <li>We may update these terms as features evolve.</li>
      </ul>
      <p className="text-zinc-400">This document is a placeholder. Replace with official terms before production.</p>
    </div>
  );
}

