import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces — blancos y grises claros (BioTech / HealthTech)
        paper: {
          50: '#FFFFFF',  // blanco puro — tarjetas y formularios
          100: '#F2F2F2', // gris fondo general
          200: '#E8EBEF',
          300: '#D9DDE3', // gris UI — bordes, líneas
          400: '#C4CAD3', // borde medio
        },
        // Azul petróleo — texto, títulos, header/footer
        ink: {
          50: '#EAF1F4',
          100: '#CBDCE3',
          300: '#7796A3', // texto atenuado
          500: '#3F6A7B', // texto secundario
          700: '#1C5266', // oscuro
          900: '#123F52', // azul petróleo principal
          950: '#0C2A37', // más oscuro
        },
        // Turquesa — botones, interacción, logo (acento primario)
        moss: {
          50: '#E6F5F4',
          100: '#C2E7E6',
          300: '#86CFCD',
          500: '#54B5B3',
          600: '#48ACAA',
          700: '#42A7A5', // turquesa principal
          800: '#34807F',
          900: '#265E5D',
        },
        // Coral suave — acciones destructivas / errores (la paleta no tiene rojo)
        clay: {
          100: '#FBE3DE',
          300: '#F0A99F',
          500: '#E0685A',
          600: '#CB5446',
          700: '#A53F33',
        },
        // Verde hoja — ADN, ilustraciones, elementos orgánicos
        sand: {
          100: '#E9F2DE',
          300: '#C2DBA3',
          500: '#8AB96B', // verde hoja principal
          600: '#74A356',
          700: '#5C8443',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        // Bordes muy redondeados en toda la app (estilo HealthTech)
        none: '0',
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
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
        // Sombras muy ligeras y difuminadas (flat design)
        'paper': '0 1px 2px rgba(18,63,82,0.04), 0 6px 20px -8px rgba(18,63,82,0.10)',
        'paper-lg': '0 2px 4px rgba(18,63,82,0.05), 0 24px 50px -20px rgba(18,63,82,0.16)',
        'ink': '0 8px 24px -8px rgba(18,63,82,0.35)',
        'moss': '0 8px 22px -6px rgba(66,167,165,0.45)',
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
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'grow-in': 'grow-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'breath': 'breath 4s ease-in-out infinite',
        'draw-path': 'draw-path 1.4s cubic-bezier(0.65, 0, 0.35, 1) backwards',
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
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(66, 167, 165, 0.30)' },
          '50%': { boxShadow: '0 0 0 8px rgba(66, 167, 165, 0)' },
        },
        'grow-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.85)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        breath: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(66, 167, 165, 0.45)' },
          '50%': { boxShadow: '0 0 0 12px rgba(66, 167, 165, 0)' },
        },
        'draw-path': {
          '0%': { strokeDashoffset: '1000', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
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
