/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bh: {
          bg: '#EAF2FF',
          surface: '#F4F8FF',
          ink: '#0A1936',
          navy: '#132956',
          wave: '#1E3E7A',
          royal: '#2563EB',
          sky: '#7CC4FA',
          ice: '#DBEAFE',
          aqua: '#5EEAD4',
          coral: '#FDA4AF',
        },
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #0A1936',
        'neo': '4px 4px 0px #0A1936',
        'neo-lg': '6px 6px 0px #0A1936',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
