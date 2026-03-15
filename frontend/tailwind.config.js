/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#003087',
        secondary: '#1a4b8c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        fade: 'fadeInOut 12s ease-in-out infinite',
        ticker: 'ticker 10s linear infinite',
        zoomRotate: 'zoomRotate 2s ease-in-out infinite',
        gifEntrance: 'gifEntrance 2s ease-out forwards',
        zoomIn: 'zoomIn 0.5s ease-in-out',
        zoom: 'zoom 2s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-25%)' },
          '50%': { transform: 'translateY(-50%)' },
          '75%': { transform: 'translateY(-75%)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        fadeInOut: {
          '0%, 100%': { opacity: '0' },
          '10%, 90%': { opacity: '1' },
        },
        gifEntrance: {
          '0%': { opacity: 0, transform: 'scale(0.8)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        zoom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
