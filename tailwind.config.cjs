const preset = require('@pirate-nation/config/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './shared/**/*.{ts,tsx}',
    './packages/ui/**/*.{ts,tsx}'
  ],
  presets: [preset]
};

