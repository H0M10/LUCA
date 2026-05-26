import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper / warm cream surfaces
        paper: {
          50: '#FBF8F1',
          100: '#F5F1E8',
          200: '#EDE6D5',
          300: '#E5DDD0',
          400: '#D6CCB8',
        },
        // Warm ink (replaces slate/gray)
        ink: {
          50: '#F7F4EE',
          100: '#E8E2D5',
          300: '#A89F8E',
          500: '#5E574E',
          700: '#3A332B',
          900: '#1F1A14',
          950: '#15110C',
        },
        // Forest moss (replaces generic green/brand)
        moss: {
          50: '#EEF2EC',
          100: '#D6DFD2',
          300: '#8FA589',
          500: '#5A7355',
          600: '#465D42',
          700: '#3D5240',
          800: '#2D3D2E',
          900: '#1F2A20',
        },
        // Terracotta clay accent
        clay: {
          100: '#F3DECD',
          300: '#E0A483',
          500: '#C2613A',
          600: '#A24E2C',
          700: '#7E3A1E',
        },
        // Sand gold accent
        sand: {
          100: '#F5E6C3',
          300: '#E0C58E',
          500: '#D9B679',
          600: '#B69257',
          700: '#8C6F3E',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
        widest: '0.25em',
      },
      boxShadow: {
        'paper': '0 1px 0 rgba(31,26,20,0.04), 0 4px 24px -8px rgba(31,26,20,0.08)',
        'paper-lg': '0 2px 0 rgba(31,26,20,0.04), 0 20px 50px -20px rgba(31,26,20,0.15)',
        'ink': '4px 4px 0 rgba(31,26,20,1)',
        'moss': '4px 4px 0 rgba(61,82,64,1)',
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'fade-in': 'fade-in 0.6s ease backwards',
        'draw-line': 'draw-line 1.2s cubic-bezier(0.65, 0, 0.35, 1) backwards',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'leaf-sway': 'leaf-sway 4s ease-in-out infinite',
        'toast-in': 'toast-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'slide-in': 'slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'draw-line': {
          '0%': { 'stroke-dashoffset': '500', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { 'stroke-dashoffset': '0', opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'leaf-sway': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
