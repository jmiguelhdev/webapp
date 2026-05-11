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
        manualChunks: (id) => {
          if (id.includes('firebase/app') || id.includes('firebase/firestore') || id.includes('firebase/auth') || id.includes('firebase/analytics')) {
            return 'vendor';
          }
          if (id.includes('pdfjs-dist') || id.includes('html2canvas')) {
            return 'pdf';
          }
        }
      }
    }
  }
});
