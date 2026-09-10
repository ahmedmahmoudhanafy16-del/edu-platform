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
          50:  'var(--n-50)',
          100: 'var(--n-100)',
          200: 'var(--n-200)',
          300: 'var(--n-300)',
          400: 'var(--n-400)',
          500: 'var(--n-500)',
          600: 'var(--n-600)',
          700: 'var(--n-700)',
          800: 'var(--n-800)',
          900: 'var(--n-900)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light:   'var(--accent-light)',
          mid:     'var(--accent-mid)',
          dark:    'var(--accent-dark)',
          text:    'var(--accent-text)',
        },
        ok:   { DEFAULT: 'var(--ok)', light: 'var(--ok-light)' },
        warn: { DEFAULT: 'var(--warn)', light: 'var(--warn-light)' },
        bad:  { DEFAULT: 'var(--bad)', light: 'var(--bad-light)' },
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
