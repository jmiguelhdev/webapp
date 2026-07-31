import { markTimeLogsAsPaid } from '../api/TimeLogApi.js';
import { fetchAccountingPipeline, fetchIssuedPipeline } from '../api/AfipApi.js';

/**
 * Presenter para la gestión contable (Caja General y Caja Frigorífico).
 * Filtra, pagina y exporta asientos contables, y actualiza de forma reactiva la UI contable.
 */
export class AccountingPresenter {

  /**
   * @param {Object} accountingRepository - Repositorio contable.
   * @param {Object} clientRepository - Repositorio de clientes.
   * @param {Object} ui - Interfaz unificada de usuario.
   * @param {Object} options - Configuración adicional (db, title, syncLabel).
   */
  constructor(accountingRepository, clientRepository, ui, options = {}) {
    this.accountingRepository = accountingRepository;
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.db = options.db;
    this.title = options.title || 'Caja General';
    this.syncLabel = options.syncLabel || 'Pago Caja General';
    
    this.entries = [];
    this.clients = [];
    this.producers = [];
    this.establishments = [];
    this.extractions = [];
    this.selectedExtraction = null;
    this.extractionScreenMode = null; // null | 'control' | 'detail'
    this.salaryPaymentPayload = null;
    this.isSalaryPaymentActive = false;
    this.currentUserUid = null;
    this.currentUserRole = 'VISOR';
    this.activeTab = 'journal'; // 'journal' | 'extractions'

    
    // Pagination & Filtering state
    this.currentPage = 1;
    this.itemsPerPage = 15;
    this.filters = {
      startDate: null,
      endDate: null,
      searchTerm: ''
    };
  }

  /**
   * Establece el ID de usuario activo para las consultas a base de datos.
   * @param {string} uid - Identificador de usuario de Firebase Auth.
   */
  setUid(uid) {
    this.currentUserUid = uid;
  }

  /**
   * Establece el rol de usuario activo ('ADMIN', 'OPERARIO', 'VISOR').
   * @param {string} role 
   */
  setUserRole(role) {
    this.currentUserRole = role || 'VISOR';
  }

  /**
   * Carga del repositorio asientos contables, clientes, productores, establecimientos y extracciones de carnicerías.
   * Ordena cronológicamente descendente y renderiza la pantalla.
   * @returns {Promise<void>}
   */
  async loadData() {
    this.ui.showLoading();
    try {
      // 1. Fetch entries, clients, travels, establishments, and extractions in parallel
      const [entries, clients, travels, establishments, extractions] = await Promise.all([
        this.accountingRepository.fetchEntries(this.currentUserUid),
        this.accountingRepository.getClients(),
        this.accountingRepository.getTravels(this.currentUserUid),
        this.accountingRepository.getEstablishments(),
        this.accountingRepository.getCashExtractions().catch(errExt => {
          console.warn("Error cargando cash_extractions:", errExt);
          return [];
        })
      ]);

      this.entries = entries;
      // Sort by date descending by default
      this.entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      this.clients = clients;
      this.producers = this.extractUniqueProducers(travels);
      this.establishments = establishments;
      this.extractions = extractions;

      // 2. Fetch employees for all establishments in parallel
      if (this.establishments && this.establishments.length > 0) {
        await Promise.all(
          this.establishments.map(async (est) => {
            est.employees = await this.accountingRepository.getEmployees(est.id);
          })
        );
      }
      
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar datos contables: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Cambia la pestaña activa ('journal' o 'extractions').
   * @param {string} tab 
   */
  setActiveTab(tab) {
    this.activeTab = tab;
    this.selectedExtraction = null;
    this.extractionScreenMode = null;
    this.render();
  }

  /**
   * Abre la pantalla dedicada de control y recepción de extracción.
   * @param {Object} extraction 
   */
  openExtractionControlScreen(extraction) {
    this.selectedExtraction = extraction;
    this.extractionScreenMode = 'control';
    this.render();
  }

  /**
   * Abre la pantalla dedicada de visualización de extracción ingresada.
   * @param {Object} extraction 
   */
  openExtractionDetailScreen(extraction) {
    this.selectedExtraction = extraction;
    this.extractionScreenMode = 'detail';
    this.render();
  }

  /**
   * Cierra la pantalla dedicada y regresa al listado principal de la Caja General.
   */
  closeExtractionScreen() {
    this.selectedExtraction = null;
    this.extractionScreenMode = null;
    this.render();
  }

  /**
   * Abre la pantalla dedicada para registrar un Pago de Sueldo.
   * @param {Object} [payload] 
   */
  openSalaryPaymentScreen(payload = null) {
    this.salaryPaymentPayload = payload;
    this.isSalaryPaymentActive = true;
    this.render();
  }

  /**
   * Cierra la pantalla dedicada de Pago de Sueldo y regresa a la Caja General.
   */
  closeSalaryPaymentScreen() {
    this.salaryPaymentPayload = null;
    this.isSalaryPaymentActive = false;
    this.render();
  }


  /**
   * Procesa y da ingreso a una extracción de caja carnicería como asiento contable en Caja General.
   * @param {{ entryData: Object, extractionId: string }} payload 
   */
  async saveExtractionEntry({ entryData, extractionId }) {
    if (this.currentUserRole !== 'ADMIN') {
      alert("⚠️ Acción restringida a usuarios con rol ADMINISTRADOR.");
      return;
    }

    this.ui.showLoading();
    try {
      // 1. Guardar el movimiento contable tipo IN en Caja General
      const entryId = await this.accountingRepository.saveEntry(this.currentUserUid, entryData);

      // 2. Marcar la extracción como ACCEPTED y vincular el entryId
      await this.accountingRepository.updateExtractionStatus(extractionId, 'ACCEPTED', entryId);

      // 3. Regresar al listado principal y recargar datos
      this.selectedExtraction = null;
      this.extractionScreenMode = null;
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al dar ingreso a la extracción: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }


  /**
   * Aplica filtros de búsqueda/fecha al listado y resetea la paginación a la página 1.
   * @param {Object} newFilters - Mapeo de filtros a combinar.
   */
  applyFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.currentPage = 1; // Reset to first page on filter change
    this.render();
  }

  /**
   * Modifica la página activa y vuelve a renderizar.
   * @param {number} page - Índice de la nueva página.
   */
  setPage(page) {
    this.currentPage = page;
    this.render();
  }

  /**
   * Filtra la colección completa de movimientos según las directivas del filtro activo (búsqueda y rango de fechas).
   * @returns {Array<Object>} Colección filtrada de asientos contables.
   */
  getFilteredEntries() {
    return this.entries.filter(entry => {
      // Date filter
      if (this.filters.startDate) {
        const start = new Date(this.filters.startDate).setHours(0, 0, 0, 0);
        if ((entry.createdAt || 0) < start) return false;
      }
      if (this.filters.endDate) {
        const end = new Date(this.filters.endDate).setHours(23, 59, 59, 999);
        if ((entry.createdAt || 0) > end) return false;
      }

      // Search term filter (amount, description, link)
      if (this.filters.searchTerm) {
        const term = this.filters.searchTerm.toLowerCase();
        const amountStr = String(entry.amount || '');
        const desc = (entry.description || '').toLowerCase();
        const client = (entry.clientName || '').toLowerCase();
        const producer = (entry.producerName || '').toLowerCase();
        
        const matches = amountStr.includes(term) || 
                        desc.includes(term) || 
                        client.includes(term) || 
                        producer.includes(term);
        
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Helper que extrae de forma única a todos los productores con CUIT de un listado de viajes.
   * @param {Array<Object>} travels - Colección de viajes logísticos.
   * @returns {Array<Object>} Lista de productores únicos ordenados alfabéticamente.
   */
  extractUniqueProducers(travels) {
    const producerMap = new Map();
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
    return Array.from(producerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Guarda un nuevo movimiento contable, y si es un cobro a cliente, sincroniza la transacción en su cuenta corriente.
   * @param {Object} entryData - Los datos del asiento contable.
   * @returns {Promise<void>}
   */
  async saveEntry(entryData) {
    this.ui.showLoading();
    try {
      const entryId = await this.accountingRepository.saveEntry(this.currentUserUid, entryData);
      
      // SYNC: If payment for client, update client transactions
      if (entryData.type === 'IN' && entryData.clientId) {
        const transactionData = {
          clientId: entryData.clientId,
          type: 'PAYMENT',
          amount: entryData.amount,
          description: `[${this.syncLabel}] ${entryData.description || ''}`,
          date: entryData.date || Date.now()
        };
        await this.clientRepository.syncAccountingToTransaction(entryId, transactionData);
      } else {
        // If it was an IN but changed to OUT, or client was removed, cleanup
        await this.accountingRepository.removeLinkedTransaction(entryId);
      }

      // SYNC: If salary payment with selected time log IDs, mark logs as PAID in Firestore & localDb
      if (entryData.isSalary && entryData.selectedLogIds && entryData.selectedLogIds.length > 0) {
        await markTimeLogsAsPaid(this.db, entryData.selectedLogIds, entryId);
      }

      this.salaryPaymentPayload = null;
      this.isSalaryPaymentActive = false;
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al guardar movimiento: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }


  /**
   * Filtra los movimientos en base a un rango de fecha específico y dispara la exportación Excel en la UI.
   * @param {string} startDate - Fecha inicial YYYY-MM-DD.
   * @param {string} endDate - Fecha final YYYY-MM-DD.
   * @returns {Promise<void>}
   */
  async exportData(startDate, endDate) {
    const fromTime = new Date(startDate + 'T00:00:00').getTime();
    const toTime = new Date(endDate + 'T23:59:59').getTime();
    
    const filtered = this.entries.filter(e => {
      const dTime = new Date(e.createdAt).getTime();
      return dTime >= fromTime && dTime <= toTime;
    }).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (filtered.length === 0) {
      this.ui.showError("No hay movimientos en el rango seleccionado para exportar.");
      return;
    }

    this.ui.generateAccountingExcel(filtered, this.title);
  }

  /**
   * Elimina un movimiento contable por su identificador.
   * @param {string|number} id - ID del movimiento contable.
   * @returns {Promise<void>}
   */
  async deleteEntry(id) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    this.ui.showLoading();
    try {
      await this.accountingRepository.deleteEntry(id);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al eliminar: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Ejecuta el pipeline de atribución contable ARCA entre dos fechas.
   * @param {string} desde YYYY-MM-DD
   * @param {string} hasta YYYY-MM-DD
   * @returns {Promise<Array<Object>>} Lista de comprobantes enriquecidos con cuenta sugerida
   */
  async fetchArcaPipeline(desde, hasta) {
    this.ui.showLoading();
    try {
      return await fetchAccountingPipeline(desde, hasta);
    } catch (e) {
      this.ui.showError("Error al consultar comprobantes ARCA: " + e.message);
      return [];
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Guarda un conjunto de comprobantes importados de ARCA como asientos contables tipo OUT.
   * @param {Array<Object>} selectedInvoices 
   */
  async saveArcaEntries(selectedInvoices) {
    if (!selectedInvoices || selectedInvoices.length === 0) return;
    this.ui.showLoading();
    try {
      for (const inv of selectedInvoices) {
        const amount = Number(inv.importeTotal || inv.importe || inv.total || 0);
        const fecha = inv.fecha || inv.fechaEmision || new Date().toISOString().split('T')[0];
        const cuit = inv.cuitEmisor || inv.cuit || '';
        const razonSocial = inv.razonSocialEmisor || inv.razonSocial || `CUIT ${cuit}`;
        const cbteTipo = inv.tipoComprobante || 'Factura';
        const cbteNum = inv.numero || inv.numeroComprobante || '';

        const entryData = {
          type: 'OUT',
          amount: amount,
          description: `[ARCA / ${cbteTipo} N° ${cbteNum}] ${razonSocial} - ${inv.cuentaSugerida?.nombre || 'Gastos Generales'}`,
          date: fecha,
          category: inv.cuentaSugerida?.nombre || 'Gastos Generales',
          accountCode: inv.cuentaSugerida?.codigo || '5.9.99',
          cuitEmisor: cuit,
          leyendaTransparencia: inv.leyendaTransparencia || 'Régimen de Transparencia Fiscal Ley 27.743',
          source: 'ARCA_IMPORT'
        };

        await this.accountingRepository.saveEntry(this.currentUserUid, entryData);
      }
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al importar asientos contables de ARCA: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Ejecuta el pipeline de ventas / comprobantes emitidos ARCA entre dos fechas.
   * @param {string} desde YYYY-MM-DD
   * @param {string} hasta YYYY-MM-DD
   * @returns {Promise<Array<Object>>} Lista de comprobantes emitidos enriquecidos con datos de cliente y padrón
   */
  async fetchIssuedArcaPipeline(desde, hasta) {
    this.ui.showLoading();
    try {
      return await fetchIssuedPipeline(desde, hasta);
    } catch (e) {
      this.ui.showError("Error al consultar comprobantes emitidos ARCA: " + e.message);
      return [];
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Vincula opcionalmente un comprobante emitido de ARCA a la Cuenta Corriente de un Cliente sin impactar la caja física.
   * @param {{ invoice: Object, clientId: string }} params
   */
  async linkIssuedInvoiceToClient({ invoice, clientId }) {
    if (!invoice || !clientId) return;
    this.ui.showLoading();
    try {
      const amount = Number(invoice.importeTotal || invoice.importe || invoice.total || 0);
      const fecha = invoice.fecha || invoice.fechaEmision || Date.now();
      const cbteTipo = invoice.tipoComprobante || 'Factura';
      const cbteNum = invoice.numero || invoice.numeroComprobante || '';

      const transactionData = {
        clientId: clientId,
        type: 'SALE',
        amount: amount,
        description: `[Venta ARCA / ${cbteTipo} N° ${cbteNum}]`,
        date: fecha,
        arcaRef: invoice.id || cbteNum,
        cuitReceptor: invoice.cuitReceptor || ''
      };

      // Registrar débito por venta en la cuenta corriente del cliente
      await this.clientRepository.syncAccountingToTransaction(`ARCA_SALE_${Date.now()}`, transactionData);
      this.ui.showSuccess ? this.ui.showSuccess("Comprobante vinculado a la cuenta corriente del cliente.") : alert("Comprobante vinculado a la cuenta corriente del cliente.");
    } catch (e) {
      this.ui.showError("Error al vincular comprobante a cuenta corriente: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Orquesta el cálculo de paginación e invoca el renderizado de la UI contable.
   */
  render() {
    const filteredEntries = this.getFilteredEntries();
    const totalItems = filteredEntries.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    
    // Ensure current page is within bounds
    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedEntries = filteredEntries.slice(startIndex, startIndex + this.itemsPerPage);

    this.ui.renderAccounting({
      title: this.title,
      activeTab: this.activeTab,
      userRole: this.currentUserRole,
      selectedExtraction: this.selectedExtraction,
      extractionScreenMode: this.extractionScreenMode,
      isSalaryPaymentActive: this.isSalaryPaymentActive,
      salaryPaymentPayload: this.salaryPaymentPayload,
      entries: paginatedEntries,
      allEntries: this.entries,
      filteredEntries: filteredEntries,
      extractions: this.extractions,
      clients: this.clients,
      producers: this.producers,
      establishments: this.establishments,
      pagination: {
        currentPage: this.currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        onPageChange: this.setPage.bind(this)
      },
      filters: this.filters,
      onTabChange: (tab) => this.setActiveTab(tab),
      onOpenControlScreen: (ext) => this.openExtractionControlScreen(ext),
      onOpenDetailScreen: (ext) => this.openExtractionDetailScreen(ext),
      onCloseExtractionScreen: () => this.closeExtractionScreen(),
      onOpenSalaryPaymentScreen: (payload) => this.openSalaryPaymentScreen(payload),
      onCloseSalaryPaymentScreen: () => this.closeSalaryPaymentScreen(),
      onFilterChange: this.applyFilters.bind(this),
      onSave: (data) => this.saveEntry(data),
      onSaveExtractionEntry: (payload) => this.saveExtractionEntry(payload),
      onDelete: (id) => this.deleteEntry(id),
      onRefresh: () => this.loadData(),
      onExport: (start, end) => this.exportData(start, end),
      onFetchArcaPipeline: (desde, hasta) => this.fetchArcaPipeline(desde, hasta),
      onSaveArcaEntries: (invoices) => this.saveArcaEntries(invoices),
      onFetchIssuedArcaPipeline: (desde, hasta) => this.fetchIssuedArcaPipeline(desde, hasta),
      onLinkIssuedInvoiceToClient: (data) => this.linkIssuedInvoiceToClient(data)
    });


  }
}



