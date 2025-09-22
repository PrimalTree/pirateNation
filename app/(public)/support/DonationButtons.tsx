"use client";

import React from 'react';

export function DonationButtons() {
  return (
    <>
      <button onClick={() => window.location.href = 'https://ecupirateclub.com/'}> PIRATE CLUB</button>
      <button onClick={() => window.location.href = 'https://teamboneyard.org/'}> TEAM BONEYARD</button>
    </>
  );
}
