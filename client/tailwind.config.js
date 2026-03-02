/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        epiroc: {
          yellow: '#FFCD00',
          blue: '#003A70',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};
