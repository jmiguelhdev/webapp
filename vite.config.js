import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function serveFletesDistPlugin() {
  const fletesDistDir = path.resolve(process.cwd(), 'dist', 'fletes');
  return {
    name: 'serve-fletes-dist-in-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '/';
        const [pathname, qs] = rawUrl.split('?');
        if (pathname === '/fletes') {
          res.statusCode = 301;
          res.setHeader('Location', '/fletes/' + (qs ? `?${qs}` : ''));
          res.end();
          return;
        }
        if (!pathname.startsWith('/fletes/')) {
          return next();
        }
        const rel = pathname.slice('/fletes/'.length) || 'index.html';
        const candidate = path.resolve(fletesDistDir, rel);
        if (!candidate.startsWith(fletesDistDir)) {
          return next();
        }
        let target = candidate;
        if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
          target = path.join(fletesDistDir, 'index.html');
        }
        if (!fs.existsSync(target)) {
          return next();
        }
        const ext = path.extname(target).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        fs.createReadStream(target).pipe(res);
      });
    },
  };
}

let commitHash = 'unknown';
let commitMsg = 'unknown';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  commitMsg = execSync('git log -1 --format=%s').toString().trim();
} catch (e) {
  console.warn("Could not retrieve git commit details", e);
}

export default defineConfig({
  plugins: [serveFletesDistPlugin()],
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
