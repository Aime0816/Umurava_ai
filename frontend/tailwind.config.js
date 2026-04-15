/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef3ff',
          100: '#dce7ff',
          200: '#b9d0ff',
          300: '#8ab3ff',
          400: '#7cb9ff',
          500: '#4f8ef7',
          600: '#3a7ef0',
          700: '#2563eb',
          800: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface: {
          primary:   '#0f1117',
          secondary: '#0a0c13',
          card:      'rgba(255,255,255,0.04)',
          border:    'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono:  ['DM Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'fade-in':   'fadeIn 0.2s ease',
        'slide-up':  'slideUp 0.25s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
