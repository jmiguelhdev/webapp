export class MAGService {
  constructor() {
    this.cacheKey = 'mag_prices_cache';
    this.cacheExpiry = 12 * 60 * 60 * 1000; // 12 hours
  }

  async fetchPrices() {
    // 1. Check local cache first
    const cached = localStorage.getItem(this.cacheKey);
    if (cached) {
      try {
        const { timestamp, data, source } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheExpiry) {
          console.log('Serving MAG prices from localStorage cache');
          return { data, source: source || 'Cache Local' };
        }
      } catch (e) {
        console.warn('Invalid cache for MAG prices', e);
      }
    }

    // 2. Fetch from backend API
    try {
      console.log('Fetching live MAG prices from backend API...');
      const response = await fetch('/api/mag-prices');
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Build cache object
        const cacheData = {
          timestamp: Date.now(),
          data: result.data,
          source: result.source || 'API'
        };
        localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        return { data: result.data, source: result.source };
      } else {
        throw new Error(result.error || 'Failed to fetch MAG data');
      }
    } catch (error) {
      console.error('Error fetching MAG prices:', error);
      return null;
    }
  }

  // Helper function to map a detailed category to a general MAG category
  mapToMagCategory(localCategory) {
    const cat = localCategory.toLowerCase();
    if (cat.includes('novillito')) return 'Novillitos';
    if (cat.includes('novillo')) return 'Novillos';
    if (cat.includes('vaquillona')) return 'Vaquillonas';
    if (cat.includes('vaca')) return 'Vacas';
    if (cat.includes('toro')) return 'Novillos'; // generic fallback 
    return null;
  }
}

export const magService = new MAGService();
