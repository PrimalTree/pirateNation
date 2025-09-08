/** Tailwind preset for Pirate Nation */
/** @type {import('tailwindcss').Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        pirate: {
          black: '#0b0d10',
          gold: '#d4af37',
          sea: '#0ea5e9'
        },
        ecu: {
          purple: '#592A8A',
          gold: '#FDC82F'
        },
        black: '#000000',
        white: '#ffffff'
      },
      borderRadius: {
        lg: '12px'
      }
    }
  },
  plugins: []
};

module.exports = preset;
