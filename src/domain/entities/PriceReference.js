/**
 * @file PriceReference.js
 * @description Domain entity representing calculated reference prices based on category prices.
 */

export class PriceReference {
  /**
   * Creates an instance of PriceReference.
   * @param {Object.<string, string|number>} rawPrices - Object mapping category keys to their numeric/string price values.
   */
  constructor(rawPrices = {}) {
    this._prices = rawPrices;
  }

  /**
   * Returns calculated reference price for Mestizo.
   * Mestizo acts as the upper ceiling reference, set as the highest price among all categories.
   * @returns {number} The calculated Mestizo price.
   */
  get mestizoPrice() {
    const values = this._getValidNumericPrices();
    return values.length > 0 ? Math.max(...values) : 0;
  }

  /**
   * Returns calculated reference price for Overo.
   * Overo represents a secondary tier reference, typically computed as the maximum price
   * below the Mestizo ceiling. If no lower value is available, we fall back to 95% of Mestizo.
   * @returns {number} The calculated Overo price.
   */
  get overoPrice() {
    const mestizo = this.mestizoPrice;
    const values = this._getValidNumericPrices();
    const overoValues = values.filter(v => v < mestizo);
    return overoValues.length > 0 ? Math.max(...overoValues) : mestizo * 0.95;
  }

  /**
   * Returns reference price for Vaca.
   * Direct category price reference for Vaca cows.
   * @returns {number} Vaca price.
   */
  get vacaPrice() {
    return parseFloat(this._prices['VACA']) || 0;
  }

  /**
   * Returns reference price for Toro.
   * Direct category price reference for Toro bulls.
   * @returns {number} Toro price.
   */
  get toroPrice() {
    return parseFloat(this._prices['TORO']) || 0;
  }

  /**
   * Helper method to parse and filter valid numeric price values.
   * @private
   * @returns {number[]} Array of valid numeric prices.
   */
  _getValidNumericPrices() {
    return Object.values(this._prices)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
  }
}
