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
        navy: {
          950: '#060911',
          900: '#0B0F19',
          850: '#101626',
          800: '#161F36',
          700: '#202C4B',
        },
        surface: {
          card: '#111827',
          hover: '#1F2937',
          border: '#1E293B',
          muted: '#334155',
        },
        brand: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
