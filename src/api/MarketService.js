// src/api/MarketService.js

/**
 * Service to fetch or simulate MAG (Mercado Agroganadero) reference prices.
 * In a production environment, this would fetch from an API like Alphacast or MAG official.
 */
export class MarketService {
  static async getReferencePrices() {
    // Simulated real-time prices from MAG by Category
    return {
      'NOVILLO': 2150.0,
      'VAQUILLONA': 2100.0,
      'VACA': 1850.0,
      'TORO': 1750.0,
      'TERNERO': 2450.0,
      'NOVILLITO': 2250.0,
      'MEJ': 1900.0
    };
  }

  /** Calculate the gap between our price and market price */
  static calculateGap(ourPrice, marketPrice) {
    if (!marketPrice || marketPrice === 0) return 0;
    return ((ourPrice - marketPrice) / marketPrice) * 100;
  }
}
