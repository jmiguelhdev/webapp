// src/adapters/presenters/CheckPresenter.js
import { Check } from '../../domain/entities/Check.js';
import { GetChecksSummary } from '../../domain/usecases/GetChecksSummary.js';

export class CheckPresenter {
  constructor(checkRepository, ui, operatorRepository, clientRepository) {
    this.checkRepository = checkRepository;
    this.ui = ui;
    this.operatorRepository = operatorRepository;
    this.clientRepository = clientRepository;
    this.checks = [];
    this.contacts = [];
    this.buyContacts = [];
    this.operators = [];
    this.currentUserUid = null;
    this.checksUnsubscribe = null;
    const _today = new Date();
    const _toISO = (d) => d.toISOString().split('T')[0];
    const _plus30 = new Date(_today); _plus30.setDate(_plus30.getDate() + 30);
    this.filters = {
      startDate: _toISO(_today),
      endDate: _toISO(_plus30),
      dateFilterType: 'DUE',
      searchTerm: '',
      sortPortfolioAsc: true,
      onlyNominal: false,
      historyStatusFilter: 'ALL',
      checkType: 'ALL'
    };
    this.pagination = {
      portfolioPage: 1,
      historyPage: 1,
      itemsPerPage: 50
    };
  }

  setUid(uid) {
    this.currentUserUid = uid;
  }

  async loadData() {
    if (this.checksUnsubscribe) {
      this.checksUnsubscribe();
      this.checksUnsubscribe = null;
    }
    this.ui.showLoading();
    // Migrate old contacts cache key (if any) to the shared 'client_clients' key
    if (localStorage.getItem('checks_contacts')) {
      localStorage.removeItem('checks_contacts');
    }
    try {
      const clients = await this.checkRepository.getContacts();
      const travels = await this.checkRepository.getTravels(this.currentUserUid);
      const producers = this.extractUniqueProducers(travels);
      
      let operators = [];
      if (this.operatorRepository) {
        operators = await this.operatorRepository.getOperators();
      }
      this.operators = operators.map(o => ({ ...o, isOperator: true }));
      this.buyContacts = [...this.operators].sort((a,b) => (a.name || '').localeCompare(b.name || ''));

      const unifiedContactsMap = new Map();
      clients.forEach(c => unifiedContactsMap.set(c.id || c.name, c));
      producers.forEach(p => {
        const key = p.cuit || p.name;
        if (!unifiedContactsMap.has(key)) {
           unifiedContactsMap.set(key, { id: p.cuit || p.name, name: p.name, cuit: p.cuit, isProducer: true });
        }
      });
      operators.forEach(o => {
        const key = o.cuit || o.name || o.id;
        if (!unifiedContactsMap.has(key)) {
           unifiedContactsMap.set(key, { id: o.id || o.name, name: o.name, cuit: o.cuit, isOperator: true });
        }
      });
      this.contacts = Array.from(unifiedContactsMap.values()).sort((a,b) => (a.name || '').localeCompare(b.name || ''));

      // Sintonizar la suscripción reactiva en tiempo real para cheques
      this.checksUnsubscribe = this.checkRepository.subscribeChecks(
        this.currentUserUid,
        (checksList) => {
          this.checks = checksList;
          this.ui.hideLoading();
          this.render();
        },
        (error) => {
          console.error("Checks subscription error:", error);
          this.ui.showError("Error de suscripción a cheques: " + error.message);
        }
      );
    } catch (e) {
      this.ui.showError("Error al cargar cheques: " + e.message);
      this.ui.hideLoading();
    }
  }

  applyFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.pagination.portfolioPage = 1;
    this.pagination.historyPage = 1;
    this.render();
  }

  setPortfolioPage(page) {
    this.pagination.portfolioPage = page;
    this.render();
  }

  setHistoryPage(page) {
    this.pagination.historyPage = page;
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
        const targetDateStr = this.filters.dateFilterType === 'RECEPTION' ? c.receptionDate : c.dueDate;
        if (!targetDateStr) {
          match = false;
        } else {
          const dateStr = targetDateStr.split('T')[0];
          if (dateStr < this.filters.startDate || dateStr > this.filters.endDate) {
            match = false;
          }
        }
      }

      // Check Type Filter
      if (match && this.filters.checkType && this.filters.checkType !== 'ALL') {
        const isE = !!c.isECheck;
        if (this.filters.checkType === 'ECHECK' && !isE) {
          match = false;
        } else if (this.filters.checkType === 'PAPER' && isE) {
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
    const filtered = this.checks.filter(c => {
      const dRec = c.receptionDate ? c.receptionDate.split('T')[0] : '';
      const dDue = c.dueDate ? c.dueDate.split('T')[0] : '';
      
      const recMatch = dRec >= startDate && dRec <= endDate;
      const dueMatch = dDue >= startDate && dDue <= endDate;
      
      return recMatch || dueMatch;
    });

    if (filtered.length === 0) {
      this.ui.showError("No hay cheques en el rango seleccionado para exportar.");
      return;
    }

    this.ui.generateChecksExcel(filtered, this.contacts);
  }

  /**
   * Envía una lista de cheques al servicio de impresión de reportes en el navegador.
   *
   * @param {Array<Check>} checksToPrint - Lista de entidades de cheques a imprimir.
   * @param {string|null} [customTitle=null] - Título personalizado para el encabezado del reporte.
   * @returns {void}
   */
  printList(checksToPrint, customTitle = null) {
    if (!checksToPrint || checksToPrint.length === 0) {
      this.ui.showError("No hay cheques en esta lista para imprimir.");
      return;
    }

    let fromDate = null;
    let toDate = null;
    if (this.filters.startDate) fromDate = new Date(this.filters.startDate + 'T00:00:00');
    if (this.filters.endDate) toDate = new Date(this.filters.endDate + 'T23:59:59');

    const options = { fromDate, toDate };
    if (customTitle) {
      options.title = customTitle;
      options.subtitle = 'Cheques Seleccionados';
    }

    this.ui.printChecksReport(checksToPrint, this.contacts, options);
  }

  async saveOperation(operationData) {
    this.ui.showLoading();
    try {
      const processed = this.calculateOperation(operationData);
      const checkId = await this.checkRepository.saveCheck(this.currentUserUid, processed);
      processed.id = processed.id || checkId;
      await this.syncTransactions(processed);
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
      await this.deleteTransactions(id);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al eliminar: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async syncTransactions(check) {
    if (!this.operatorRepository || !this.clientRepository) return;

    // BUY SIDE (Origen): El Operador nos da un cheque. Funciona como un PAGO (Haber) a su favor.
    if (check.buySide && check.buySide.contactId) {
      const isOperator = this.operators.some(o => o.id === check.buySide.contactId || o.name === check.buySide.contactId);
      if (isOperator) {
        const txDate = check.receptionDate ? new Date(check.receptionDate + 'T00:00:00').getTime() : Date.now();
        const txData = {
          operatorId: check.buySide.contactId,
          type: 'PAYMENT',
          amount: check.buySide.netAmount || 0,
          description: `Ingreso Cheque N°${check.checkNumber} (${check.bank})`,
          date: txDate
        };
        await this.operatorRepository.syncCheckTransaction(check.id, 'BUY', txData);
      }
    } else {
      await this.operatorRepository.syncCheckTransaction(check.id, 'BUY', null);
    }

    // SELL SIDE (Destino): Nosotros le damos un cheque. Funciona como DEUDA (Debe).
    if (check.sellSide && check.sellSide.status === 'SOLD' && check.sellSide.contactId) {
      const txData = {
        type: 'DEBT',
        amount: check.sellSide.netAmount || 0,
        description: `Salida Cheque N°${check.checkNumber} (${check.bank})`,
        date: Date.now()
      };
      
      const isOperator = this.operators.some(o => o.id === check.sellSide.contactId || o.name === check.sellSide.contactId);
      if (isOperator) {
        txData.operatorId = check.sellSide.contactId;
        await this.operatorRepository.syncCheckTransaction(check.id, 'SELL', txData);
        await this.clientRepository.syncCheckTransaction(check.id, 'SELL', null);
      } else {
        txData.clientId = check.sellSide.contactId;
        await this.clientRepository.syncCheckTransaction(check.id, 'SELL', txData);
        await this.operatorRepository.syncCheckTransaction(check.id, 'SELL', null);
      }
    } else {
      await this.clientRepository.syncCheckTransaction(check.id, 'SELL', null);
      await this.operatorRepository.syncCheckTransaction(check.id, 'SELL', null);
    }
  }

  async deleteTransactions(checkId) {
    if (!this.operatorRepository || !this.clientRepository) return;
    await this.operatorRepository.syncCheckTransaction(checkId, 'BUY', null);
    await this.operatorRepository.syncCheckTransaction(checkId, 'SELL', null);
    await this.clientRepository.syncCheckTransaction(checkId, 'SELL', null);
  }

  calculateOperation(op) {
    const check = new Check(op);
    check.calculate();
    return {
      ...op,
      isECheck: check.isECheck,
      days: check.days,
      expireAt: check.expireAt,
      buySide: check.buySide ? { ...check.buySide } : null,
      sellSide: check.sellSide ? { ...check.sellSide } : null,
      profit: check.profit
    };
  }

  async saveBatchBuy(operationsArray) {
    this.ui.showLoading();
    try {
      const buyOperationId = 'CMP-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const buyDate = new Date().toISOString();
      for (const op of operationsArray) {
        if (!op.buySide) op.buySide = {};
        op.buySide.operationId = buyOperationId;
        op.buySide.date = buyDate;
        
        const processed = this.calculateOperation(op);
        const checkId = await this.checkRepository.saveCheck(this.currentUserUid, processed);
        processed.id = processed.id || checkId;
        await this.syncTransactions(processed);
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
      const sellOperationId = 'VTA-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const sellDate = new Date().toISOString();
      for (const id of checkIds) {
        const check = this.checks.find(c => c.id === id);
        if (!check) continue;
        const updated = {
          ...check,
          sellSide: {
            ...check.sellSide,
            ...sellData,
            operationId: sellOperationId,
            date: sellDate
          }
        };
        const processed = this.calculateOperation(updated);
        const checkId = await this.checkRepository.saveCheck(this.currentUserUid, processed);
        processed.id = processed.id || checkId;
        await this.syncTransactions(processed);
      }
      await this.loadData();
    } catch (e) {
      this.ui.showError('Error al guardar venta masiva: ' + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async undoSaleOperation(operationId) {
    if (!confirm(`¿Está seguro de deshacer la venta con ID ${operationId}? Los cheques volverán a cartera y se eliminarán sus registros contables.`)) {
      return;
    }
    this.ui.showLoading();
    try {
      const checksToRevert = this.checks.filter(c => c.sellSide?.operationId === operationId);
      if (checksToRevert.length === 0) {
        throw new Error("No se encontraron cheques asociados a esta operación de venta.");
      }

      for (const check of checksToRevert) {
        const updated = {
          ...check,
          sellSide: {
            status: 'PENDING',
            contactId: '',
            pesificacionRate: 0,
            monthlyInterest: 0,
            netAmount: 0,
            backReason: '',
            operationId: '',
            date: null
          }
        };
        const processed = this.calculateOperation(updated);
        await this.checkRepository.saveCheck(this.currentUserUid, processed);
        await this.syncTransactions(processed);
      }
      await this.loadData();
      alert("Venta deshecha con éxito. Los cheques volvieron a estar en cartera.");
    } catch (e) {
      this.ui.showError("Error al deshacer la venta: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  render() {
    const getChecksSummary = new GetChecksSummary();
    const globalSummary = getChecksSummary.execute(this.checks);
    const filteredSummary = getChecksSummary.execute(this.getFilteredChecks());

    this.ui.renderChecks({
      checks: globalSummary.domainChecks,
      filteredChecks: filteredSummary.domainChecks,
      globalSummary,
      filteredSummary,
      filters: this.filters,
      pagination: this.pagination,
      contacts: this.contacts,
      buyContacts: this.buyContacts,
      onFilterChange: this.applyFilters.bind(this),
      onSave: this.saveOperation.bind(this),
      onDelete: this.deleteOperation.bind(this),
      onRefresh: this.loadData.bind(this),
      onExport: this.exportData.bind(this),
      onPrint: this.printList.bind(this),
      onBatchBuy: this.saveBatchBuy.bind(this),
      onBatchSell: this.saveBatchSell.bind(this),
      onUndoSale: this.undoSaleOperation.bind(this),
      onPortfolioPageChange: this.setPortfolioPage.bind(this),
      onHistoryPageChange: this.setHistoryPage.bind(this)
    });
  }
}

