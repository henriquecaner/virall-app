/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6fc',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0A66C2', // LinkedIn Blue (Primary Brand Color)
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        urgency: {
          500: '#FF6B35', // Orange for alerts/scarcity/CTAs
          600: '#e85d2e',
        },
        success: {
          500: '#00C853', // Green for checks/guarantees/social proof
          600: '#00a844',
        },
        dark: {
          900: '#1E1E1E', // Premium Black (Backgrounds/Headings)
          800: '#333333', // Secondary Black
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'progress-bar-stripes': {
          '0%': { backgroundPosition: '1rem 0' },
          '100%': { backgroundPosition: '0 0' },
        }
      }
    },
  },
  plugins: [],
}