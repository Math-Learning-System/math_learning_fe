/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Source Code Pro', 'ui-monospace', 'monospace'],
      },
      colors: {
        anth: {
          parchment: '#f8fafc',
          ivory: '#ffffff',
          ink: '#0f172a',
          surface: '#1e293b',
          primary: '#0ea5e9',
          accent: '#14b8a6',
          text: '#475569',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
