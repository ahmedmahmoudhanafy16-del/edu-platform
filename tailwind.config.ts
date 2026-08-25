import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Cairo', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'title':   ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body':    ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label':   ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'micro':   ['11px', { lineHeight: '16px', fontWeight: '400' }],
      },
      colors: {
        n: {
          50:  '#FAFAF7',
          100: '#F4F4F0',
          200: '#E8E8E2',
          300: '#D0D0C8',
          400: '#A8A89E',
          500: '#787870',
          600: '#58584E',
          700: '#3C3C34',
          800: '#262620',
          900: '#18180F',
        },
        accent: {
          DEFAULT: '#0E7C7B',
          light:   '#E8F5F5',
          mid:     '#0D6B6A',
          dark:    '#0A5252',
          text:    '#0A5252',
        },
        ok:   { DEFAULT: '#2D6A4F', light: '#EAF4EE' },
        warn: { DEFAULT: '#92400E', light: '#FEF3E2' },
        bad:  { DEFAULT: '#7F1D1D', light: '#FEF2F2' },
      },
      transitionDuration: { DEFAULT: '140ms' },
      transitionProperty: {
        colors: 'background-color, border-color, color',
      },
      boxShadow: {
        dropdown: '0 4px 16px 0 rgba(0,0,0,0.08)',
        modal:    '0 8px 32px 0 rgba(0,0,0,0.12)',
        toast:    '0 4px 12px 0 rgba(0,0,0,0.10)',
        none: 'none',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
};

export default config;
