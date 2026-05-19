// src/domain/entities/FaenaStock.js

/**
 * Entidad de dominio que representa el estado del stock e inventario de faena, achuras y borradores.
 * Centraliza toda la lógica de negocio, reducciones matemáticas, agrupaciones de borradores
 * y cálculos financieros de despacho de manera pura y desacoplada de la UI.
 */
export class FaenaStock {
  /**
   * @param {Object} data - Parámetros de inicialización de stock.
   * @param {Array<Object>} [data.stockItems=[]] - Ítems disponibles en stock/cámaras.
   * @param {Array<Object>} [data.draftItems=[]] - Borradores pendientes de despacho.
   * @param {Array<Object>} [data.achurasItems=[]] - Lotes de achuras colgados en stock.
   * @param {Set<string>} [data.selectedIds=new Set()] - IDs de garrones seleccionados para preparación de despacho.
   * @param {Object} [data.categoryPriceInputs={}] - Inputs de precios configurados para cada categoría en la preparación.
   */
  constructor({ stockItems = [], draftItems = [], achurasItems = [], selectedIds = new Set(), categoryPriceInputs = {} } = {}) {
    this.stockItems = stockItems;
    this.draftItems = draftItems;
    this.achurasItems = achurasItems;
    this.selectedIds = selectedIds;
    this.categoryPriceInputs = categoryPriceInputs;
  }

  /**
   * Calcula los totales agregados de stock de medias reses colgadas globalmente y por categoría.
   * 
   * @returns {Object} Resumen agregado de stock.
   * @property {number} kg - Sumatoria de kilos totales colgados.
   * @property {number} count - Cantidad total de medias reses.
   * @property {Object} byCategory - Desglose de piezas y kilos acumulados por categoría estandarizada.
   */
  getStockTotals() {
    return this.stockItems.reduce((acc, item) => {
      acc.kg += item.kg || 0;
      acc.count += 1;
      const cat = item.standardizedCategory || 'OTRO';
      if (!acc.byCategory[cat]) acc.byCategory[cat] = { kg: 0, count: 0 };
      acc.byCategory[cat].kg += item.kg || 0;
      acc.byCategory[cat].count += 1;
      return acc;
    }, { kg: 0, count: 0, byCategory: {} });
  }

  /**
   * Computa el desglose del despacho actual basado en los garrones seleccionados y los precios ingresados.
   * 
   * @returns {Object} Resumen financiero del despacho estimado.
   * @property {Array<Object>} selectedItems - Lista de ítems seleccionados.
   * @property {number} selKg - Sumatoria de kilos de los ítems seleccionados.
   * @property {Object} byCategory - Detalle agrupado de cantidad y peso por categoría de los ítems seleccionados.
   * @property {Array<Array>} catEntries - Entradas de llave-valor del agrupamiento por categoría.
   * @property {boolean} multiCat - Verdadero si hay más de una categoría entre las piezas seleccionadas.
   * @property {number} grandTotal - Importe estimado total (sumatoria de peso * precio de categoría).
   */
  getDispatchSummary() {
    const selectedItems = this.stockItems.filter(i => this.selectedIds.has(i.id));
    const selKg = selectedItems.reduce((s, i) => s + (i.kg || 0), 0);

    const byCategory = {};
    selectedItems.forEach(item => {
      const cat = item.standardizedCategory || 'OTRO';
      if (!byCategory[cat]) byCategory[cat] = { kg: 0, count: 0 };
      byCategory[cat].kg += item.kg || 0;
      byCategory[cat].count += 1;
    });

    const catEntries = Object.entries(byCategory);
    let grandTotal = 0;
    catEntries.forEach(([cat, data]) => {
      const p = parseFloat(this.categoryPriceInputs?.[cat]) || 0;
      grandTotal += data.kg * p;
    });

    return {
      selectedItems,
      selKg,
      byCategory,
      catEntries,
      multiCat: catEntries.length > 1,
      grandTotal
    };
  }

  /**
   * Agrupa los borradores de preparación de despacho por destino y fecha para presentarlos agrupados en la UI.
   * 
   * @returns {Array<Object>} Lista de grupos de borradores consolidados.
   */
  getGroupedDrafts() {
    const draftsByGroup = {};
    this.draftItems.forEach(d => {
      const key = `${d.destination}_${d.draftDate}`;
      if (!draftsByGroup[key]) {
        draftsByGroup[key] = {
          destination: d.destination || 'Sin destino',
          draftDate: d.draftDate,
          draftPrices: d.draftPrices,
          items: [],
          totalKg: 0
        };
      }
      draftsByGroup[key].items.push(d);
      draftsByGroup[key].totalKg += d.kg || 0;
    });
    return Object.values(draftsByGroup);
  }

  /**
   * Calcula el total de juegos de achuras disponibles acumulados en los lotes de stock.
   * 
   * @returns {number} Suma de juegos de achuras.
   */
  getAchurasTotals() {
    return this.achurasItems.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);
  }
}
