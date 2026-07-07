/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#FAF8F5',
          dark: '#11100F',
          card: '#F3EFEA',
          cardDark: '#1C1B1A',
          border: '#E2DDD5',
          borderDark: '#2C2A27',
        },
        ink: {
          DEFAULT: '#1E1C19',
          light: '#54504A',
          dark: '#EBE7E0',
          darkLight: '#A39F97',
        },
        editorial: {
          ochre: '#BF8A30',
          sage: '#4A6F54',
          terracotta: '#B84A39',
        }
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
