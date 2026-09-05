/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#04070d',
          900: '#0a1018',
          850: '#0f1722',
          800: '#141d2b',
          700: '#1c2738',
          600: '#283449',
        },
        pulse: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
      },
      keyframes: {
        shapGrow: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        fadeSlideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scoreFill: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(var(--fill, 1))' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 211, 238, 0.4)' },
          '50%': { boxShadow: '0 0 24px 4px rgba(34, 211, 238, 0.25)' },
        },
        winnerGlow: {
          '0%, 100%': { boxShadow: '0 0 18px 0 rgba(16, 185, 129, 0.35), inset 0 0 0 1px rgba(16,185,129,0.5)' },
          '50%': { boxShadow: '0 0 30px 6px rgba(16, 185, 129, 0.5), inset 0 0 0 1px rgba(16,185,129,0.8)' },
        },
        thinkDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        nodePulse: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.4)' },
        },
        dash: {
          '0%': { strokeDashoffset: '40' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ringSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shap: 'shapGrow 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        fadeUp: 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        fadeIn: 'fadeIn 0.6s ease forwards',
        scoreFill: 'scoreFill 1s cubic-bezier(0.22,1,0.36,1) forwards',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        winnerGlow: 'winnerGlow 2s ease-in-out infinite',
        thinkDot: 'thinkDot 1.2s ease-in-out infinite',
        nodePulse: 'nodePulse 3s ease-in-out infinite',
        dash: 'dash 1.2s linear forwards',
        shimmer: 'shimmer 2.2s linear infinite',
        ringSpin: 'ringSpin 8s linear infinite',
        scan: 'scan 2.4s ease-in-out infinite',
        floatY: 'floatY 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
