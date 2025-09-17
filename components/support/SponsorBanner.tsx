export function SponsorBanner() {
  return (
    <div className="border-b border-ecu-purple/40 bg-black/70">
      <div className="mx-auto flex max-w-6xl items-center justify-start gap-3 px-4 py-2">
        <img src="/branding/PrimalTreeLogo.png" alt="Primal Tree" className="h-5 w-auto" />
        <div className="text-xs uppercase tracking-widest text-zinc-400">Powered by: <span className="text-ecu-gold">Primal Tree</span></div>
      </div>
    </div>
  );
}

