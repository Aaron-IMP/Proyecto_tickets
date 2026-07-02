/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fondo:      '#0A0A0F',
        card:       '#15151D',
        'card-alt': '#1F1F2B',
        inp:        '#2A2A35',
        acento:     '#7C3AED',
        'acento-h': '#6D28D9',
        s2:         '#A8A8B3',
        s3:         '#96969F',
        borde:      '#3A3A48',
        'borde-s':  '#2A2A35',
        exito:      '#10B981',
        warn:       '#F59E0B',
        peligro:    '#EF4444',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
