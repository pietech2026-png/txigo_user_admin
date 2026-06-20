/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f3ff',
          100: '#dbe1fc',
          200: '#bfcbfa',
          300: '#93abf6',
          400: '#6084f1',
          500: '#4f6bf5',
          600: '#3a57e8',
          700: '#2e45c7',
          800: '#2434a6',
          900: '#1d2785',
          950: '#0f1242',
        },
        orange: {
          500: '#ff9800',
          600: '#f57c00',
          700: '#ef6c00',
        }
      }
    },
  },
  plugins: [],
}
