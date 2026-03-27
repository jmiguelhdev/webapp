// src/domain/entities/Buy.js

export class Buy {
  constructor(data = {}) {
    this.id = data.id || data.firebaseId || '';
    this.category = data.category || ''; // As requested: use buy-level category
    this.agent = data.agent || { name: '', percent: 0 };
    this.listOfProducers = (data.listOfProducers || []).map(p => new Producer(p));
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
    this.producer = data.producer || { name: '' };
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
