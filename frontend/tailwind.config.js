/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        met: {
          dark: '#0B1120',
          card: '#111827',
          surface: '#1E293B',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
          accent: '#38BDF8',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          bust: '#DC2626'
        }
      }
    },
  },
  plugins: [],
}
