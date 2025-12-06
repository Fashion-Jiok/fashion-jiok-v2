/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef1f9',
          100: '#fee5f4',
          200: '#ffccea',
          300: '#ffa2d9',
          400: '#ff68bd',
          500: '#f93ba0',
          600: '#e91d7e',
          700: '#ca0f60',
          800: '#a7104f',
          900: '#8b1244',
        },
      }
    },
  },
  plugins: [],
}