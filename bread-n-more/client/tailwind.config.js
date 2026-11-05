/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Bread & More colour palette - change these hex codes to re-colour the whole website
      colors: {
        bread: {
          dark: '#4a2c17',
          brown: '#8a5a2b',
          caramel: '#d4932f',
          latte: '#f1dcae',
          cream: '#fff8ea',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
