/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ledger: {
          header: '#1e3a5f',
          settled: '#fce4ec',
          settledText: '#c62828',
          unsettled: '#e8f5e9',
          unsettledText: '#2e7d32',
          summary: '#fff9c4',
        },
      },
    },
  },
  plugins: [],
};
