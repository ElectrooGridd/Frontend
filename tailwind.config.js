/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#0d9488',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F9FAFB',
        card: '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
      },
      borderRadius: {
        card: '12px',
        'card-lg': '20px',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      spacing: {
        4.5: '18px',
      },
    },
  },
  plugins: [],
}
