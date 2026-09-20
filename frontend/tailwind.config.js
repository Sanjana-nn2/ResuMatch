/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0F19',
          surface: '#111827',
          hover: '#1F2937',
          card: '#151D30',
        },
        border: {
          subtle: '#1E293B',
          prominent: '#334155',
        },
        accent: {
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          cyan: '#06B6D4',
          indigo: '#6366F1',
        },
        content: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
