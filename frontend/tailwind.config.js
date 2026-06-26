/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High quality premium dark theme colors
        brand: {
          50: '#fdf4f1',
          100: '#f8d4c7',
          200: '#efb099',
          300: '#e49071',
          400: '#d9734e',
          500: '#c85a32', // Primary Brand Rust/Burnt Orange
          600: '#b04c26',
          700: '#983e1c',
          800: '#7e3014',
          900: '#682711',
          950: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
