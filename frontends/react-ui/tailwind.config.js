/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // // 比 sm 小一半的尺寸
        xs: '320px'
      }
    }
  }
};
