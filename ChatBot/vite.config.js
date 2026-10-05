import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // Prevents Vite from switching ports silently
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    // If you are proxying API calls to Express on port 5000:
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});