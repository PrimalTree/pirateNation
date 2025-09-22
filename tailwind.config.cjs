/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}'
,
  ],
  theme: {
    extend: {
      colors: {
        'ecu-gold': '#FFC72C', // ECU official gold
      },
    },
  },
  plugins: [],
};
