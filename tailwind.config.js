/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#3d444d',
          850: '#1c2128',
          950: '#0d1117',
        },
        slate: {
          400: '#8b949e',
          500: '#6e7681',
          600: '#484f58',
          700: '#3d444d',
          800: '#30363d',
          900: '#21262d',
        },
        blue: {
          400: '#79c0ff',
          500: '#58a6ff',
          600: '#4c9aed',
        },
        green: {
          400: '#56d364',
          500: '#3fb950',
          600: '#2ea043',
        },
        amber: {
          400: '#e3b341',
          500: '#d29922',
          600: '#bb8009',
        },
        red: {
          400: '#ff7b72',
          500: '#f85149',
          600: '#da3633',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
