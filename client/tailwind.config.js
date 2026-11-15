/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep Midnight & Emerald & Champagne Gold Identity
        midnight: {
          DEFAULT: '#0B1F1A',
          dark: '#071512',
          surface: '#112923',
          border: '#1C3A32',
        },
        emerald: {
          DEFAULT: '#0F7B5F',
          dark: '#0A5C47',
          light: '#149674',
          subtle: '#0F7B5F15',
        },
        gold: {
          DEFAULT: '#D9B36C',
          hover: '#E6C98A',
          dark: '#B8924B',
          subtle: '#D9B36C20',
        },
        ivory: {
          DEFAULT: '#F7F3EA',
          dark: '#EAE4D5',
          card: '#FBF9F4',
        },
        brandMuted: '#B9C7C1',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        btn: '6px',
        panel: '10px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(11, 31, 26, 0.05), 0 1px 2px rgba(11, 31, 26, 0.03)',
        panel: '0 4px 20px -2px rgba(11, 31, 26, 0.08)',
        gold: '0 0 15px rgba(217, 179, 108, 0.25)',
      },
    },
  },
  plugins: [],
};
