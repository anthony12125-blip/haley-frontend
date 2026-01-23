/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // ==========================================================
        // HALEY OS DESIGN TOKENS
        // These map to CSS variables in globals.css for light/dark mode
        // ==========================================================
        
        // Brand colors
        'primary': 'var(--primary)',
        'accent': 'var(--accent)',
        
        // Surface colors (backgrounds)
        'panel-dark': 'var(--panel-dark)',
        'panel-medium': 'var(--panel-medium)', 
        'panel-light': 'var(--panel-light)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        
        // Border
        'border': 'var(--border)',
        
        // Feedback colors
        'error': 'var(--error)',
        'success': 'var(--success)',
        
        // Background
        'background': 'var(--background)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'shoot': 'shoot 3s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
        'portal-spin': 'portalSpin 3s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
