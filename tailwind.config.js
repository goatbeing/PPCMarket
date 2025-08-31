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
        // Matching main app color scheme
        primary: {
          DEFAULT: '#2997ff',
          hover: '#46abff',
          dark: '#2997ff',
          light: '#0071e3',
        },
        secondary: {
          DEFAULT: '#86868b',
          text: '#86868b',
        },
        background: {
          DEFAULT: '#000000',
          card: '#1c1c1e',
          secondary: '#2c2c2e',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.15)',
        },
        text: {
          DEFAULT: '#f5f5f7',
          secondary: '#86868b',
        },
        success: {
          DEFAULT: '#25a244',
          bg: '#0c1f0c',
          border: '#1c3a1e',
        },
        error: {
          DEFAULT: '#ff4d4d',
          bg: '#290707',
          border: '#471111',
        },
        warning: {
          DEFAULT: '#ffa33d',
          bg: '#2e200a',
          border: '#5a3c0e',
        },
      },
      fontFamily: {
        sans: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
      },
      boxShadow: {
        sm: '0 2px 6px rgba(0, 0, 0, 0.2)',
        md: '0 4px 12px rgba(0, 0, 0, 0.3)',
        lg: '0 12px 24px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
