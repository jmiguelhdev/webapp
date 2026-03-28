// src/api/MarketService.js

/**
 * Service to fetch MAG (Mercado Agroganadero) reference prices via the backend API.
 */
export class MarketService {
  static async getReferencePrices() {
    try {
      // 1. Check Cache (valid for 12 hours)
      const cacheKey = 'mag_prices_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
          return this.formatMagData(data);
        }
      }

      // 2. Fetch Live Data
      const response = await fetch('/api/mag-prices');
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      
      if (result.success && result.data) {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: result.data,
          source: result.source
        }));
        return this.formatMagData(result.data);
      }
    } catch (e) {
      console.warn("Error fetching MAG prices. Using fallbacks.", e);
    }

    // 3. Fallback (Static Mock Data)
    return {
      'NOVILLO': 4750.0,
      'VAQUILLONA': 4650.0,
      'VACA': 2750.0,
      'TORO': 2950.0,
      'TERNERO': 5150.0,
      'NOVILLITO': 5020.0,
      'MEJ': 4700.0
    };
  }

  /** Normalizes the array data from API to a Dict mapped to the local Categories */
  static formatMagData(data) {
    const prices = {};
    // Map Array objects back to key value pairs
    data.forEach(item => {
      if (item.category.toLowerCase().includes('novillito')) prices['NOVILLITO'] = item.avg;
      else if (item.category.toLowerCase().includes('novillo')) prices['NOVILLO'] = item.avg;
      else if (item.category.toLowerCase().includes('vaquillona')) prices['VAQUILLONA'] = item.avg;
      else if (item.category.toLowerCase().includes('vaca')) prices['VACA'] = item.avg;
    });
    
    // Add default fallbacks for missing categories in case MAG doesn't report them today
    if (!prices['NOVILLO']) prices['NOVILLO'] = 4750;
    if (!prices['TORO']) prices['TORO'] = 2950;
    if (!prices['MEJ']) prices['MEJ'] = 4700;
    
    return prices;
  }

  /** Calculate the gap between our price and market price */
  static calculateGap(ourPrice, marketPrice) {
    if (!marketPrice || marketPrice === 0) return 0;
    return ((ourPrice - marketPrice) / marketPrice) * 100;
  }
}

