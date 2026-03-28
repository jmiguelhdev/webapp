// src/domain/entities/Buy.js
import { resolveCategoryFromName } from '../utils/categoryResolver.js';

export class Buy {
  constructor(data = {}) {
    this.id = data.id || data.firebaseId || '';
    this.agent = data.agent || { name: '', percent: 0 };
    // Flat list of standardized categories in this buy
    this.listOfProducers = (data.listOfProducers || []).map(p => new Producer(p));
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
    return this.totalOperation * (this.agent.percent / 100);
  }

  get totalOperationWithCommission() {
    return this.totalOperation + this.agentCommissionAmount;
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
  constructor(data = {}) {
    // Handle both { producer: {name, cuit, cbu} } and { producer: "Name", cuit: "...", cbu: "..." }
    const isProdObj = typeof data.producer === 'object' && data.producer !== null;
    this.producer = {
      name: isProdObj ? data.producer.name || data.producerName || 'Productor' : data.producer || data.producerName || data.name || 'Productor',
      cuit: isProdObj ? data.producer.cuit : (data.cuit || data.cuit_numero || ''),
      cbu: isProdObj ? data.producer.cbu : (data.cbu || data.cbu_numero || ''),
    };
    this.origin = data.origin || '';
    this.listOfProducts = (data.listOfProducts || []).map(pr => new Product(pr));
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

  get totalKgFaena() {
    return this.listOfProducts.reduce((sum, pr) => sum + (pr.kgFaena || 0), 0);
  }

  get totalIva() {
    return this.listOfProducts.reduce((sum, pr) => {
      const bill = pr.taxes?.bill || {};
      return sum + (bill.iva || 0);
    }, 0);
  }

  get totalGanancias() {
    return this.listOfProducts.reduce((sum, pr) => {
      const bill = pr.taxes?.bill || {};
      return sum + (bill.ganancias || 0);
    }, 0);
  }
}

class Product {
  constructor(data = {}) {
    this.name = data.name || '';
    this.kg = data.kg || 0;
    this.roughing = data.roughing || 0;
    this.price = data.price || 0;
    this.quantity = data.quantity || 0;
    this.kgFaena = data.kgFaena || 0;
    this.taxes = data.taxes || { bill: { neto: 0, iva: 0, ganancias: 0 } };
  }

  get standardizedCategory() {
    return resolveCategoryFromName(this.name);
  }

  get kgClean() {
    return this.kg * (1 - this.roughing / 100);
  }

  get operation() {
    return this.kgClean * this.price;
  }

  get billFactura() {
    const bill = this.taxes.bill || { neto: 0, iva: 0 };
    return (bill.neto || 0) + (bill.iva || 0);
  }
}
