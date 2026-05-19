// src/domain/usecases/GetStockSummary.js

import { FaenaStock } from '../entities/FaenaStock.js';

/**
 * Caso de uso para obtener el resumen consolidado del stock e inventario de faena, achuras y borradores.
 * Transforma los datos crudos y entradas en un modelo de dominio FaenaStock y precalcula los agregados.
 */
export class GetStockSummary {
  /**
   * Ejecuta el caso de uso consolidando las métricas de inventario de faena.
   * 
   * @param {Object} data - Datos necesarios de entrada.
   * @param {Array<Object>} data.stockItems - Ítems de stock disponibles.
   * @param {Array<Object>} data.draftItems - Borradores pendientes.
   * @param {Array<Object>} data.achurasItems - Lotes de achuras colgados.
   * @param {Set<string>} data.selectedIds - IDs de garrones seleccionados en el borrador de despacho.
   * @param {Object} data.categoryPriceInputs - Mapeo de precios configurados por categoría.
   * @returns {Object} Resumen consolidado para la UI.
   * @property {FaenaStock} faenaStock - Instancia de la entidad de dominio FaenaStock.
   * @property {Object} stockTotals - Totales de stock general y distribución por categoría.
   * @property {Object} dispatchSummary - Datos de preparación del despacho e importe total.
   * @property {Array<Object>} groupedDrafts - Borradores agrupados por destino y fecha de preparación.
   * @property {number} achurasTotals - Sumatoria total de juegos de achuras disponibles.
   */
  execute({ stockItems, draftItems, achurasItems, selectedIds, categoryPriceInputs }) {
    const faenaStock = new FaenaStock({
      stockItems,
      draftItems,
      achurasItems,
      selectedIds,
      categoryPriceInputs
    });

    return {
      faenaStock,
      stockTotals: faenaStock.getStockTotals(),
      dispatchSummary: faenaStock.getDispatchSummary(),
      groupedDrafts: faenaStock.getGroupedDrafts(),
      achurasTotals: faenaStock.getAchurasTotals()
    };
  }
}
