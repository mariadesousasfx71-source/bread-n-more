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
          red: '#a1303a', // main accent: buttons and lines (same red as the name ribbon)
          reddark: '#7c1f29',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        anton: ['Anton', 'Impact', 'sans-serif'], // tall, condensed letters like the BREAD in the logo
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
