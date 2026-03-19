/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Drug class colours from spec
        chemo: '#4A7FB5',
        targeted: '#2E7D4F',
        hormone: '#D97706',
        immunotherapy: '#7B4FBC',
        // Timeline row colours
        'dx-teal': '#0D9488',
        'progression-red': '#DC2626',
        // Biomarker sparklines
        'bio-normal': '#3B82F6',
        'bio-high': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
