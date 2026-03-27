// server.js
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static files from the Vite build (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// Support SPA routing (redirect all non-file requests to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving project from: ${path.join(__dirname, 'dist')}`);
});
