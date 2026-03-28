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

// API Endpoint for MAG Prices
app.get('/api/mag-prices', async (req, res) => {
  try {
    // Dynamic import to avoid CommonJS issues if needed, but package.json is type module
    const cheerio = await import('cheerio');
    
    // In a real production app without headless-browser proxy, you might hit Cloudflare.
    // We try to fetch from a known portal like Agrofy or De Frente Al Campo, 
    // or provide the latest known stable fallback to avoid breaking the dashboard.
    // Given the Cloudflare protections of the official MAG site, we use a structured fallback
    // that mimics the data we would parse, ensuring the UI always works.
    // You could replace `fetchUrl` with a BrightData or ScrapingBee endpoint.
    
    const magData = [
      { category: 'Novillos', min: 4200, max: 5100, avg: 4750 },
      { category: 'Novillitos', min: 4500, max: 5500, avg: 5020 },
      { category: 'Vaquillonas', min: 4000, max: 5300, avg: 4650 },
      { category: 'Vacas', min: 2000, max: 3500, avg: 2750 },
    ];
    
    // Simulate network delay to test loading states
    setTimeout(() => {
        res.json({ success: true, timestamp: Date.now(), source: 'MAG (Mock/Fallback)', data: magData });
    }, 800);

  } catch (error) {
    console.error("Error fetching MAG prices:", error);
    res.status(500).json({ success: false, error: 'Hubo un error obteniendo los precios MAG' });
  }
});

// Support SPA routing (redirect all non-file requests to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving project from: ${path.join(__dirname, 'dist')}`);
});
