/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4fb4ff',
        'accent': '#7fd4ff',
        'panel-dark': '#111418',
        'panel-medium': '#1a1e22',
        'panel-light': '#22262b',
        'text-primary': '#e5f2ff',
        'text-secondary': '#a7b7c9',
        'border': '#2c3339',
        'error': '#ff6b6b',
        'success': '#4fe0b0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'shoot': 'shoot 3s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'portal-spin': 'portalSpin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
