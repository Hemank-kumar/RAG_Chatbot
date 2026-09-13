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
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        baunfire: {
          bg: '#0d0d0d',
          surface: '#141414',
          card: '#161616',
          border: '#262626',
          borderHover: '#383838',
          red: '#f84525',
          redHover: '#e03819',
          muted: '#6f6f6f',
          textMuted: '#9c9c9c',
        },
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c3d5ff',
          300: '#96b4ff',
          400: '#6487ff',
          500: '#f84525',
          600: '#e03819',
          700: '#c22c10',
          800: '#9e220a',
          900: '#7e1b07',
          950: '#0d0d0d',
        },
        dark: {
          bg: '#0d0d0d',
          card: '#161616',
          border: '#262626',
          muted: '#6f6f6f'
        }
      },
      letterSpacing: {
        widest: '.2em',
        mega: '.35em',
      }
    },
  },
  plugins: [],
}
