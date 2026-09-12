/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c3d5ff',
          300: '#96b4ff',
          400: '#6487ff',
          500: '#3b5bf6',
          600: '#253ea8',
          700: '#1d2f83',
          800: '#1c296b',
          900: '#1b2559',
          950: '#0f1434',
        },
        dark: {
          bg: '#0b0f19',
          card: '#111827',
          border: '#1f2937',
          muted: '#374151'
        }
      },
    },
  },
  plugins: [],
}
