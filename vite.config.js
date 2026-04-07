import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/analytics'],
          pdf: ['pdfjs-dist', 'html2canvas']
        }
      }
    }
  }
});
