import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let commitHash = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD', { cwd: path.resolve(__dirname, '..') }).toString().trim();
} catch {
  commitHash = 'local';
}

export default defineConfig({
  root: path.resolve(__dirname),
  base: '/fletes/',
  envDir: path.resolve(__dirname, '..'),
  publicDir: path.resolve(__dirname, 'public'),
  define: {
    __FLETES_COMMIT_HASH__: JSON.stringify(commitHash)
  },
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    port: 5174,
    open: '/fletes/'
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/fletes'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    }
  }
});
