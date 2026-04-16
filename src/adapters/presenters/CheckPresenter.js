// src/adapters/presenters/CheckPresenter.js

export class CheckPresenter {
  constructor(checkRepository, ui) {
    this.checkRepository = checkRepository;
    this.ui = ui;
    this.checks = [];
    this.contacts = [];
    this.currentUserUid = null;
    this.filters = {
      startDate: null,
      endDate: null,
      searchTerm: ''
    };
  }

  setUid(uid) {
    this.currentUserUid = uid;
  }

  async loadData() {
    this.ui.showLoading();
    try {
      this.checks = await this.checkRepository.fetchChecks(this.currentUserUid);
      this.contacts = await this.checkRepository.getContacts();
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
        const seller = (this.contacts.find(con => con.id === c.buySide?.contactId)?.name || '').toLowerCase();
        const buyer = (this.contacts.find(con => con.id === c.sellSide?.contactId)?.name || '').toLowerCase();
        
        if (!bank.includes(term) && !num.includes(term) && !val.includes(term) && !seller.includes(term) && !buyer.includes(term)) {
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
      // You could still calculate netAmount if you wanted to store it for historical reasons,
      // but profit must be canceled out.
    } else {
      op.profit = 0;
    }

    return op;
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
      onPrint: this.printList.bind(this)
    });
  }
}

