"use client";

import React from 'react';
import { Link2, ExternalLink, HandCoins } from "lucide-react";

type LinkDef = {
  label: string;
  href: string;
  hint?: string;
};

const NIL_LINKS: LinkDef[] = [
  {
    label: "Pirate Club",
    href: "https://ecupirateclub.com/",
    hint: "Official ECU Pirate Club",
  },
  {
    label: "Team Boneyard",
    href: "https://teamboneyard.org/",
    hint: "Primary ECU Football NIL collective",
  },
  {
    label: "Pirate Shop NIL",
    href: "https://shop.ecupirates.com/ecu-pirates/nil-pick-a-player/",
    hint: "Pick‑a‑Player NIL at ECU Shop",
  },
  // TODO: Add Pirate Shop NIL (awaiting exact URL)
];

export function DonationButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      {NIL_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <HandCoins className="h-4 w-4" />
          <span>{l.label}</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      ))}
    </div>
  );
}
