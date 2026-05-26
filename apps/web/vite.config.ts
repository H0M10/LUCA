import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// El sitio se publica en https://h0m10.github.io/LUCA/, así que en producción
// el base path es /LUCA/. En dev local queda en '/'.
// Se puede sobreescribir con VITE_BASE en .env si en algún momento cambias el path.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || (mode === 'production' ? '/LUCA/' : '/');
  return {
    plugins: [react()],
    base,
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
