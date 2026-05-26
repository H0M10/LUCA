import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE controla el path base para GitHub Pages.
// Si tu repo es https://USUARIO.github.io/LUCA/, pon VITE_BASE=/LUCA/ en apps/web/.env
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_BASE || '/',
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
  };
});
