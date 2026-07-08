import { defineConfig } from 'vite';
import { execSync } from 'child_process';

let commitHash = 'unknown';
let commitMsg = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  commitMsg = execSync('git log -1 --format=%s').toString().trim();
} catch (e) {
  console.warn("Could not retrieve git commit details", e);
}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_MESSAGE__: JSON.stringify(commitMsg)
  },
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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('pdfjs-dist') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('chart.js')) {
              return 'vendor-chart';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
