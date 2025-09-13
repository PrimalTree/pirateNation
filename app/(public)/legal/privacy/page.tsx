export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-zinc-300">This MVP collects minimal data to provide core features.</p>
      <ul className="list-disc space-y-1 pl-6 text-zinc-400">
        <li>Authentication (optional): email for magic link sign‑in.</li>
        <li>Poll voting: anonymous device identifier stored locally.</li>
        <li>Crash/feedback: if you email us, your message and email are visible to us.</li>
      </ul>
      <p className="text-zinc-400">This document is a placeholder. Replace with your organization’s official policy.</p>
    </div>
  );
}

