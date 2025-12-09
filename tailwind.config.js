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
        haley: {
          // Primary accent colors
          primary: '#6A5FA7',
          'primary-hover': '#7B70C0',
          'primary-pressed': '#584E8D',
          
          // Secondary accent colors
          secondary: '#8FB6FF',
          'secondary-dim': '#6A90D6',
          
          // Input colors
          'input-bg': '#121218',
          'input-border': '#2A2A33',
          'input-text': '#E8E8F0',
          'input-placeholder': '#7C7C90',
          
          // Text colors
          'text-title': '#EDE9FF',
          'text-body': '#D5D1E8',
          'text-subtext': '#A29FC0',
          
          // Google button
          'google-bg': '#FFFFFF',
        },
      },
      boxShadow: {
        'button-glow': '0 0 12px rgba(106, 95, 167, 0.35)',
        'soft-outer': '0 0 8px rgba(255, 255, 255, 0.08)',
        'google-button': '0 0 8px rgba(255, 255, 255, 0.08)',
        'card': '0 0 20px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        'haley': '12px',
        'haley-lg': '20px',
        'haley-xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'drift': 'drift 20s linear infinite',
        'bounce-custom': 'bounce 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        drift: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'card-blur-gradient': 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.25), rgba(0,0,0,0.35))',
      },
    },
  },
  plugins: [],
}
