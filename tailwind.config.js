/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#ffffff',
        surface2: '#f2f2f7',
        accent: '#007aff',
        green: { app: '#34c759' },
        orange: { app: '#ff9500' },
        red: { app: '#ff3b30' },
      },
      fontFamily: {
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
