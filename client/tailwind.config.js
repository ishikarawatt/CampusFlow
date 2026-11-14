/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // enable class based dark mode
  theme: {
    extend: {
      colors: {
        // Brand palette
        deepNavy: '#101D29',
        slateNavy: '#1C3444',
        iceWhite: '#EAF4F6',
        electricCyan: '#26BFD0',
        // Status colors (Tailwind defaults but explicit)
        success: '#34D399', // emerald-400
        warning: '#FBBF24', // amber-400
        danger: '#EF4444', // red-500
        info: '#60A5FA', // blue-400
        // Text and muted variants
        textPrimary: '#101D29',
        textMuted: '#6B7280', // gray-500
        border: '#E5E7EB', // gray-200
        hover: '#F3F4F6', // gray-100
      },
      fontFamily: {
        brand: ['Fraunces', 'serif'], // brand name, page titles
        heading: ['Archivo Black', 'sans-serif'], // dashboard headings, KPI numbers
        body: ['DM Sans', 'system-ui', 'sans-serif'], // body, forms, nav, tables
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'], // IDs, logs, timestamps
      },
    },
  },
  plugins: [],
};