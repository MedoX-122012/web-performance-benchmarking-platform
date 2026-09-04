/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#F7F8FA',
          100: '#F1F3F5',
          200: '#E2E5E9',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#66707A',
          600: '#4B5563',
          700: '#374151',
          800: '#202327',
          850: '#1C1F23',
          900: '#17191C',
          950: '#111318',
        },
        blue: {
          50: '#EBF3FA',
          100: '#D4E4F4',
          200: '#A9C9E9',
          300: '#7EADDE',
          400: '#6F9BC8',
          500: '#3B6EA8',
          600: '#2D5A8A',
          700: '#1F466C',
        },
        green: {
          50: '#EDF7F1',
          100: '#D5EDE0',
          200: '#ABDBC1',
          300: '#81C9A2',
          400: '#68A98A',
          500: '#3E8E6B',
          600: '#2E7254',
          700: '#1E563D',
        },
        amber: {
          50: '#FDF5EB',
          100: '#FAEAD3',
          200: '#F5D5A7',
          300: '#EFC07B',
          400: '#C59A58',
          500: '#B98232',
          600: '#966826',
          700: '#734E1A',
        },
        red: {
          50: '#FDF0F0',
          100: '#FAE0E0',
          200: '#F5C1C1',
          300: '#EFA2A2',
          400: '#C97878',
          500: '#B65353',
          600: '#943E3E',
          700: '#722929',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Consolas', 'monospace'],
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
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
