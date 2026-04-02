// src/domain/entities/Buy.js
import { resolveCategoryFromName } from '../utils/categoryResolver.js';

export class Buy {
  constructor(data = {}) {
    this.id = data.id || data.firebaseId || '';
    this.agent = data.agent || { name: '', percent: 0 };
    // KMP app stores at buy.totalReduce; web app writes buy.reduce as fallback
    this.reduce = data.totalReduce || data.reduce || 0;
    this.listOfProducers = (data.listOfProducers || []).map(p => new Producer(p, this));
  }

  get categories() {
    const cats = new Set();
    this.listOfProducers.forEach(p => {
      p.listOfProducts.forEach(pr => {
        cats.add(pr.standardizedCategory);
      });
    });
    return Array.from(cats);
  }

  get totalOperation() {
    return this.listOfProducers.reduce((sum, p) => sum + p.totalOperation, 0);
  }

  get totalKgClean() {
    return this.listOfProducers.reduce((sum, p) => sum + p.totalKgClean, 0);
  }

  get totalKgFaena() {
    return this.listOfProducers.reduce((sum, p) => sum + p.totalKgFaena, 0);
  }

  get totalQuantity() {
    return this.listOfProducers.reduce((sum, p) => sum + p.totalQuantity, 0);
  }

  get agentCommissionAmount() {
    // Solo si hay agente con porcentaje > 0
    return this.totalOperation * ((this.agent?.percent || 0) / 100);
  }

  get totalOperationWithCommission() {
    return this.totalOperation + this.agentCommissionAmount;
  }

  get amountToDistribute() {
    // Monto de achique a repartir entre productores (Achique Total - Comisión Total)
    return Math.max(0, this.reduce - this.agentCommissionAmount);
  }

  get avgPrice() {
    const kg = this.totalKgClean;
    return kg > 0 ? this.totalOperation / kg : 0;
  }

  get avgPriceWithCommission() {
    const kg = this.totalKgClean;
    return kg > 0 ? this.totalOperationWithCommission / kg : 0;
  }

  get generalYield() {
    const kgClean = this.totalKgClean;
    return kgClean > 0 ? this.totalKgFaena / kgClean : 0;
  }
}

class Producer {
  constructor(data = {}, buy = null) {
    this.buy = buy;
    // KMP app stores producer fields flat (name, cuit, cbu) directly on the object.
    // Some older data may use a nested 'producer' sub-object.
    const nested = (typeof data.producer === 'object' && data.producer !== null) ? data.producer : null;
    this.producer = {
      name: (nested?.name) || data.name || data.producerName || 'Productor',
      cuit: (nested?.cuit) || data.cuit || data.cuit_numero || '',
      cbu:  (nested?.cbu)  || data.cbu  || data.cbu_numero  || '',
    };
    this.origin = data.origin || '';
    this.manualIva = data.manualIva !== undefined ? data.manualIva : null;
    this.listOfProducts = (data.listOfProducts || []).map(pr => new Product(pr, buy));
  }

  get totalKgClean() {
    return this.listOfProducts.reduce((sum, pr) => sum + pr.kgClean, 0);
  }

  get totalOperation() {
    return this.listOfProducts.reduce((sum, pr) => sum + pr.operation, 0);
  }

  get totalQuantity() {
    return this.listOfProducts.reduce((sum, pr) => sum + (pr.quantity || 0), 0);
  }

  get totalCommission() {
    return this.listOfProducts.reduce((sum, pr) => sum + (pr.commission || 0), 0);
  }

  get totalOpPlusComm() {
    return this.totalOperation + this.totalCommission;
  }

  get achiqueStandard() {
    if (!this.buy || this.buy.totalQuantity === 0) return 0;
    return (this.totalQuantity / this.buy.totalQuantity) * this.buy.amountToDistribute;
  }

  get iva() {
    if (this.manualIva !== null) return this.manualIva;
    return this.totalFacturaStandard - this.netoStandard;
  }

  get neto() {
    if (this.manualIva !== null) return this.manualIva / 0.105;
    return this.netoStandard;
  }

  get totalFactura() {
    return this.neto + this.iva;
  }

  get totalFacturaStandard() {
    return this.totalOpPlusComm - this.achiqueStandard;
  }

  get netoStandard() {
    return this.totalFacturaStandard / 1.105;
  }

  get achiqueProrrateado() {
    // Si hay IVA manual, el achique se ajusta para que Op+Com - Achique = Factura
    if (this.manualIva !== null) {
      return this.totalOpPlusComm - this.totalFactura;
    }
    return this.achiqueStandard;
  }

  get facturaOverOpRatio() {
    return this.totalOperation > 0 ? this.totalFactura / this.totalOperation : 0;
  }

  get retencionGanancias() {
    // 2% de retención sobre el neto
    return this.neto * 0.02;
  }

  get totalAPagar() {
    return this.totalOpPlusComm - this.achiqueProrrateado - this.retencionGanancias;
  }

  get totalKgFaena() {
    return this.listOfProducts.reduce((sum, pr) => sum + (pr.kgFaena || 0), 0);
  }

  get totalIva() {
    return this.iva;
  }

  get totalGanancias() {
    return this.retencionGanancias;
  }
}

class Product {
  constructor(data = {}, buy = null) {
    this.name = data.name || '';
    this.kg = data.kg || 0;
    this.roughing = data.roughing || 0; // En porcentaje (ej: 8)
    this.price = data.price || 0;
    this.quantity = data.quantity || 0;
    this.kgFaena = data.kgFaena || 0;
    this.taxes = data.taxes || { bill: { neto: 0, iva: 0, ganancias: 0 } };
    this.agentPercent = buy?.agent?.percent || 0;
  }

  get standardizedCategory() {
    return resolveCategoryFromName(this.name);
  }

  get kgClean() {
    // Desvaste como porcentaje (10000 * (1 - 8/100) = 9200)
    // El ejemplo del usuario usa desvaste 0.92, que equivale a quita del 8%
    const factor = (this.roughing > 0 && this.roughing < 1) ? this.roughing : (1 - this.roughing / 100);
    return this.kg * factor;
  }

  get operation() {
    return this.kgClean * this.price;
  }

  get commission() {
    return this.operation * (this.agentPercent / 100);
  }

  get billFactura() {
    // Este getter histórico se mantiene para compatibilidad pero se calculará 
    // dinámicamente en el productor para el reporte de liquidación
    const bill = this.taxes.bill || { neto: 0, iva: 0 };
    return (bill.neto || 0) + (bill.iva || 0);
  }
}

