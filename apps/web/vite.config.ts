import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE controla el path base para GitHub Pages.
// Si tu repo se llama "genograma" en https://USUARIO.github.io/genograma/,
// pon VITE_BASE=/genograma/ al hacer build (lo hace el workflow automáticamente).
export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
}));
