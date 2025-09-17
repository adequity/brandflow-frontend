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
          50: '#f3f3fe',
          100: '#e8e8fd',
          200: '#d5d5fb',
          300: '#b7b7f7',
          400: '#9292f1',
          500: '#6667AB',  // Main brand color
          600: '#5a5b9a',
          700: '#4d4e88',
          800: '#404176',
          900: '#363764',
        },
        accent: {
          50: '#fafbff',
          100: '#f4f6ff',
          200: '#e8ecff',
          300: '#d4dbff',
          400: '#b8c2ff',
          500: '#9ba8ff',
          600: '#7a87f7',
          700: '#5d6ae3',
          800: '#4854cf',
          900: '#3d47bb',
        },
        neutral: {
          50: '#fafbfc',
          100: '#f4f6f8',
          200: '#e8ecf0',
          300: '#d6dce3',
          400: '#b8c2cc',
          500: '#9aa4af',
          600: '#7c8792',
          700: '#5f6b76',
          800: '#434f5a',
          900: '#2a333e',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'elegant': '0 4px 20px -2px rgba(102, 103, 171, 0.15)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
