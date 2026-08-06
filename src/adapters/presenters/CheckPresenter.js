// src/adapters/presenters/CheckPresenter.js
import { Check } from '../../domain/entities/Check.js';
import { GetChecksSummary } from '../../domain/usecases/GetChecksSummary.js';

/**
 * Presenter para la gestión del portfolio de cheques diferidos.
 * Orquesta filtros de búsqueda, alertas por fecha de cobro y exportaciones a PDF/Excel.
 */
export class CheckPresenter {
  /**
   * @param {Object} checkRepository - Repositorio de cheques y transacciones de cartera.
   * @param {Object} ui - Interfaz unificada de usuario para manipular el DOM.
   * @param {Object} operatorRepository - Repositorio de transacciones financieras con operadores de bolsa.
   * @param {Object} clientRepository - Repositorio de clientes para registrar pasivos y pagos.
   */
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
    this.filters = {
      startDate: '',
      endDate: '',
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

  /**
   * Configura el identificador del usuario para las consultas.
   * @param {string} uid - Identificador de usuario.
   */
  setUid(uid) {
    this.currentUserUid = uid;
  }

  /**
   * Carga de forma asíncrona la lista unificada de contactos, operadores y cheques en tiempo real.
   * @returns {Promise<void>}
   */
  async loadData() {
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

      // Real Local-First: query local checks on every navigation/reload
      const checksList = await this.checkRepository.fetchChecks(this.currentUserUid);
      
      let hasChanges = false;
      if (!this.checks || this.checks.length !== checksList.length) {
        hasChanges = true;
      } else {
        const currentMap = new Map(this.checks.map(c => [c.id, c.updatedAt || c.timestamp || 0]));
        for (const fresh of checksList) {
          const currentVal = currentMap.get(fresh.id);
          if (currentVal === undefined || currentVal !== (fresh.updatedAt || fresh.timestamp || 0)) {
            hasChanges = true;
            break;
          }
        }
      }

      if (hasChanges || !this.checks) {
        this.checks = checksList;
      }
      this.ui.hideLoading();
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar cheques: " + e.message);
      this.ui.hideLoading();
    }
  }

  /**
   * Mezcla y aplica nuevos criterios de filtrado y resetea las páginas activas.
   * @param {Object} newFilters - Mapeo de filtros a combinar.
   */
  applyFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.pagination.portfolioPage = 1;
    this.pagination.historyPage = 1;
    this.render();
  }

  /**
   * Modifica la página activa de cheques en cartera y actualiza la UI.
   * @param {number} page - Índice de página.
   */
  setPortfolioPage(page) {
    this.pagination.portfolioPage = page;
    this.render();
  }

  /**
   * Modifica la página activa del historial y actualiza la UI.
   * @param {number} page - Índice de página.
   */
  setHistoryPage(page) {
    this.pagination.historyPage = page;
    this.render();
  }

  /**
   * Extrae productores únicos de un catálogo de viajes logísticos.
   * @param {Array<Object>} travels - Lista de viajes.
   * @returns {Array<Object>} Lista de productores.
   */
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

  /**
   * Filtra los cheques según los filtros activos de fecha, búsqueda y tipo de cheque.
   * @returns {Array<Object>} Lista filtrada de cheques.
   */
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

  /**
   * Exporta a Excel los cheques recibidos o cobrados dentro de un intervalo de fecha.
   * @param {string} startDate - Fecha inicial YYYY-MM-DD.
   * @param {string} endDate - Fecha final YYYY-MM-DD.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra una nueva operación financiera con cheque en Firestore y actualiza las transacciones contables.
   * @param {Object} operationData - Los datos de la operación.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un cheque por su identificador y revierte las transacciones asociadas.
   * @param {string|number} id - ID del cheque.
   * @returns {Promise<void>}
   */
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

  /**
   * Sincroniza los movimientos de cheques hacia cuentas corrientes de clientes u operadores de bolsa.
   * @param {Object} check - Operación de cheque calculada.
   * @returns {Promise<void>}
   */
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
        date: check.sellSide.date ? new Date(check.sellSide.date).getTime() : Date.now()
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

  /**
   * Elimina y remueve las vinculaciones y registros de un cheque borrado.
   * @param {string|number} checkId - ID del cheque.
   * @returns {Promise<void>}
   */
  async deleteTransactions(checkId) {
    if (!this.operatorRepository || !this.clientRepository) return;
    await this.operatorRepository.syncCheckTransaction(checkId, 'BUY', null);
    await this.operatorRepository.syncCheckTransaction(checkId, 'SELL', null);
    await this.clientRepository.syncCheckTransaction(checkId, 'SELL', null);
  }

  /**
   * Ejecuta el cálculo financiero de un cheque instanciando la entidad de dominio.
   * @param {Object} op - Atributos de entrada de la operación.
   * @returns {Object} La operación calculada de acuerdo a las fórmulas de negocio.
   */
  calculateOperation(op) {
    const check = new Check(op);
    check.calculate();
    return {
      ...op,
      isECheck: check.isECheck,
      issuerName: check.issuerName,
      issuerCuit: check.issuerCuit,
      days: check.days,
      expireAt: check.expireAt,
      buySide: check.buySide ? { ...check.buySide } : null,
      sellSide: check.sellSide ? { ...check.sellSide } : null,
      profit: check.profit
    };
  }

  /**
   * Registra una compra masiva de cheques.
   * @param {Array<Object>} operationsArray - Lote de cheques a guardar.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra la venta masiva de cheques a un comprador específico.
   * @param {Object} sellData - Atributos de venta (tasa de pesificación, interés mensual, comprador).
   * @param {Array<string>} checkIds - Lista de IDs de cheques a vender.
   * @returns {Promise<void>}
   */
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

  /**
   * Deshace una operación de venta masiva de cheques, restaurándolos a cartera y eliminando sus asientos vinculados.
   * @param {string} operationId - ID de la operación de venta masiva.
   * @returns {Promise<void>}
   */
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

  /**
   * Orquesta la ejecución del resumen de cartera e historial, y actualiza el renderizado.
   */
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
