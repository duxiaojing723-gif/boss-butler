/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1C1C1E',
        surface2: '#2C2C2E',
        accent: '#FF6B35',
        green: { app: '#30D158' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
