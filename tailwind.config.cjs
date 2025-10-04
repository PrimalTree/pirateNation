/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}'
,
  ],
  theme: {
    extend: {
      colors: {
        'ecu-gold': '#FFC72C', // ECU official gold
        'ecu-purple': '#592A8A' //ECU official purple
      },
    },
  },
  plugins: [],
};
