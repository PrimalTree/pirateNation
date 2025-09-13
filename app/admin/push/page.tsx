export default function PushComposerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Push Composer</h1>
      <p className="text-white/70">Stub composer. Coming soon.</p>
      <form className="space-y-2">
        <input className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="Title" />
        <textarea className="w-full rounded border border-white/10 bg-black px-3 py-2" placeholder="Message" rows={4} />
        <button className="rounded bg-ecu-gold px-3 py-1.5 text-black">Send Test</button>
      </form>
    </div>
  );
}

