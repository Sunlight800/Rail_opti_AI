/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railnavy: {
          950: '#060a14',
          900: '#0b1329',
          850: '#0e1833',
          800: '#121f42',
          700: '#1a2c5c',
          600: '#253d7e',
          500: '#3454ab',
        },
        electric: {
          cyan: '#00f0ff',
          blue: '#3b82f6',
          purple: '#a855f7',
        }
      }
    },
  },
  plugins: [],
}
