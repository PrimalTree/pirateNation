import Image from 'next/image';

export function SponsorBanner() {
  return (
    <div className="border-b border-ecu-purple/40 bg-black/70">
      <div className="mx-auto flex max-w-6xl items-center justify-start gap-3 px-4 py-2">
        <div className="text-xs uppercase tracking-widest text-zinc-400">
          Powered by: <span className="text-ecu-gold">Primal Tree</span>
        </div>
        <Image
          src="/branding/PrimalTreeLogoNoWords.png"
          alt="Primal Tree"
          width={24}
          height={24}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
