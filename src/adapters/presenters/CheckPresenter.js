// src/adapters/presenters/CheckPresenter.js

export class CheckPresenter {
  constructor(checkRepository, ui) {
    this.checkRepository = checkRepository;
    this.ui = ui;
    this.checks = [];
    this.contacts = [];
    this.currentUserUid = null;
    const _today = new Date();
    const _toISO = (d) => d.toISOString().split('T')[0];
    const _plus30 = new Date(_today); _plus30.setDate(_plus30.getDate() + 30);
    this.filters = {
      startDate: _toISO(_today),
      endDate: _toISO(_plus30),
      searchTerm: '',
      sortPortfolioAsc: true
    };
  }

  setUid(uid) {
    this.currentUserUid = uid;
  }

  async loadData() {
    this.ui.showLoading();
    // Migrate old contacts cache key (if any) to the shared 'client_clients' key
    if (localStorage.getItem('checks_contacts')) {
      localStorage.removeItem('checks_contacts');
    }
    try {
      this.checks = await this.checkRepository.fetchChecks(this.currentUserUid);
      const clients = await this.checkRepository.getContacts();
      const travels = await this.checkRepository.getTravels(this.currentUserUid);
      const producers = this.extractUniqueProducers(travels);
      
      const unifiedContactsMap = new Map();
      clients.forEach(c => unifiedContactsMap.set(c.id || c.name, c));
      producers.forEach(p => {
        const key = p.cuit || p.name;
        if (!unifiedContactsMap.has(key)) {
           unifiedContactsMap.set(key, { id: p.cuit || p.name, name: p.name, cuit: p.cuit, isProducer: true });
        }
      });
      this.contacts = Array.from(unifiedContactsMap.values()).sort((a,b) => a.name.localeCompare(b.name));

      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar cheques: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  applyFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.render();
  }

  extractUniqueProducers(travels) {
    const producerMap = new Map();
    if (!travels) return [];
    travels.forEach(t => {
      const producers = t.buy?.listOfProducers || [];
      producers.forEach(p => {
        const cuit = String(p.cuit || p.producer?.cuit || '').replace(/\D/g, '');
        const name = p.name || p.producer?.name || 'Productor';
        if (cuit && !producerMap.has(cuit)) {
          producerMap.set(cuit, { cuit, name });
        }
      });
    });
    return Array.from(producerMap.values());
  }

  getFilteredChecks() {
    return this.checks.filter(c => {
      let match = true;
      
      // Date Filter
      if (this.filters.startDate && this.filters.endDate) {
        const from = new Date(this.filters.startDate + 'T00:00:00').getTime();
        const to = new Date(this.filters.endDate + 'T23:59:59').getTime();
        const dRec = new Date(c.receptionDate).getTime();
        const dDue = new Date(c.dueDate).getTime();
        
        // Match if either reception or due date falls in range
        if ((dRec < from || dRec > to) && (dDue < from || dDue > to)) {
          match = false;
        }
      }
      
      // Text Search Filter
      if (match && this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        const bank = (c.bank || '').toLowerCase();
        const num = (c.checkNumber || '').toLowerCase();
        const val = String(c.nominalValue || '');
        const issuer = (c.issuerName || '').toLowerCase();
        const cuit = (c.issuerCuit || '').toLowerCase();
        const seller = (this.contacts.find(con => con.id === c.buySide?.contactId)?.name || '').toLowerCase();
        const buyer = (this.contacts.find(con => con.id === c.sellSide?.contactId)?.name || '').toLowerCase();
        
        if (!bank.includes(term) && !num.includes(term) && !val.includes(term) && 
            !issuer.includes(term) && !cuit.includes(term) && 
            !seller.includes(term) && !buyer.includes(term)) {
          match = false;
        }
      }
      return match;
    });
  }

  async exportData(startDate, endDate) {
    const fromTime = new Date(startDate + 'T00:00:00').getTime();
    const toTime = new Date(endDate + 'T23:59:59').getTime();
    
    const filtered = this.checks.filter(c => {
      const dRec = new Date(c.receptionDate).getTime();
      const dDue = new Date(c.dueDate).getTime();
      return (dRec >= fromTime && dRec <= toTime) || (dDue >= fromTime && dDue <= toTime);
    });

    if (filtered.length === 0) {
      this.ui.showError("No hay cheques en el rango seleccionado para exportar.");
      return;
    }

    this.ui.generateChecksExcel(filtered, this.contacts);
  }

  printList(checksToPrint) {
    if (!checksToPrint || checksToPrint.length === 0) {
      this.ui.showError("No hay cheques en esta lista para imprimir.");
      return;
    }

    let fromDate = null;
    let toDate = null;
    if (this.filters.startDate) fromDate = new Date(this.filters.startDate + 'T00:00:00');
    if (this.filters.endDate) toDate = new Date(this.filters.endDate + 'T23:59:59');

    this.ui.printChecksReport(checksToPrint, this.contacts, { fromDate, toDate });
  }

  async saveOperation(operationData) {
    this.ui.showLoading();
    try {
      // Calculate derived fields before saving if not already done by UI
      const processed = this.calculateOperation(operationData);
      await this.checkRepository.saveCheck(this.currentUserUid, processed);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al guardar operación: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async deleteOperation(id) {
    if (!confirm("¿Está seguro de eliminar esta operación?")) return;
    this.ui.showLoading();
    try {
      await this.checkRepository.deleteCheck(id);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al eliminar: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  calculateOperation(op) {
    op.nominalValue = parseFloat(op.nominalValue) || 0;
    const nominalValue = op.nominalValue;
    const reception = new Date(op.receptionDate);
    const due = new Date(op.dueDate);
    op.clearing = parseInt(op.clearing) || 0;
    const clearing = op.clearing;
    
    // Calcular TTL (210 días después de recepción)
    const ttlDate = new Date(reception);
    ttlDate.setDate(ttlDate.getDate() + 210);
    op.ttlTimestamp = ttlDate.toISOString();
    
    // Calculate days: (Due - Reception) + Clearing
    const diffTime = due.getTime() - reception.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(0, diffDays + clearing);
    
    op.days = totalDays;

    // Issue Date handling (no calculation needed, just ensures consistency)
    if (op.issueDate && !isNaN(new Date(op.issueDate).getTime())) {
      // Keep as string ISO for consistency with other dates in this app
    }

    // Buy side calculation
    if (op.buySide) {
      op.buySide.pesificacionRate = parseFloat(op.buySide.pesificacionRate) || 0;
      op.buySide.monthlyInterest = parseFloat(op.buySide.monthlyInterest) || 0;
      
      const pesificationAmount = nominalValue * (op.buySide.pesificacionRate / 100);
      const interestAmount = nominalValue * (op.buySide.monthlyInterest / 100 / 30) * totalDays;
      
      op.buySide.netAmount = nominalValue - pesificationAmount - interestAmount;
    }

    // Sell side calculation
    if (op.sellSide && op.sellSide.status === 'SOLD') {
      op.sellSide.pesificacionRate = parseFloat(op.sellSide.pesificacionRate) || 0;
      op.sellSide.monthlyInterest = parseFloat(op.sellSide.monthlyInterest) || 0;
      
      const pesificationAmount = nominalValue * (op.sellSide.pesificacionRate / 100);
      const interestAmount = nominalValue * (op.sellSide.monthlyInterest / 100 / 30) * totalDays;
      
      op.sellSide.netAmount = nominalValue - pesificationAmount - interestAmount;
      op.profit = (op.sellSide.netAmount || 0) - (op.buySide ? op.buySide.netAmount : 0);
    } else if (op.sellSide && (op.sellSide.status === 'RETURNED' || op.sellSide.status === 'REJECTED')) {
      // Dejan registro pero sin ganancia.
      op.profit = 0;
    } else {
      op.profit = 0;
    }

    return op;
  }

  async saveBatchBuy(operationsArray) {
    this.ui.showLoading();
    try {
      for (const op of operationsArray) {
        const processed = this.calculateOperation(op);
        await this.checkRepository.saveCheck(this.currentUserUid, processed);
      }
      await this.loadData();
    } catch (e) {
      this.ui.showError('Error al guardar lote de cheques: ' + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async saveBatchSell(sellData, checkIds) {
    this.ui.showLoading();
    try {
      for (const id of checkIds) {
        const check = this.checks.find(c => c.id === id);
        if (!check) continue;
        const updated = { ...check, sellSide: { ...check.sellSide, ...sellData } };
        const processed = this.calculateOperation(updated);
        await this.checkRepository.saveCheck(this.currentUserUid, processed);
      }
      await this.loadData();
    } catch (e) {
      this.ui.showError('Error al guardar venta masiva: ' + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  render() {
    this.ui.renderChecks({
      checks: this.checks,
      filteredChecks: this.getFilteredChecks(),
      filters: this.filters,
      contacts: this.contacts,
      onFilterChange: this.applyFilters.bind(this),
      onSave: this.saveOperation.bind(this),
      onDelete: this.deleteOperation.bind(this),
      onRefresh: this.loadData.bind(this),
      onExport: this.exportData.bind(this),
      onPrint: this.printList.bind(this),
      onBatchBuy: this.saveBatchBuy.bind(this),
      onBatchSell: this.saveBatchSell.bind(this)
    });
  }
}

