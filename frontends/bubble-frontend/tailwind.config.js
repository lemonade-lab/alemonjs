/**
 * @type {import('tailwindcss/types/config').Config}
 */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '320px' // 比 sm 小一半的尺寸
      }
    }
  }
};
