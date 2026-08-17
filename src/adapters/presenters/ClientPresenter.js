// src/adapters/presenters/ClientPresenter.js
import { ClientAccount } from '../../domain/entities/ClientAccount.js';
import { GetClientAccountSummary } from '../../domain/usecases/GetClientAccountSummary.js';

/**
 * Presenter para la gestión de cuentas corrientes de Clientes y Operadores de Bolsa.
 * Coordina la carga de saldos, validación de estado de cuenta (bloqueado/activo) y análisis de precio de venta.
 */
export class ClientPresenter {
  /**
   * @param {Object} clientRepository - Repositorio para transacciones de clientes.
   * @param {Object} operatorRepository - Repositorio para transacciones de operadores.
   * @param {Object} ui - Interfaz unificada de usuario para el renderizado del DOM.
   */
  constructor(clientRepository, operatorRepository, ui) {
    this.clientRepository = clientRepository;
    this.operatorRepository = operatorRepository;
    this.ui = ui;
    this.clients = [];
    this.operators = [];
    this.selectedClient = null;
    this.selectedType = 'CLIENT'; // 'CLIENT' or 'OPERATOR'
    this.activeTab = 'CLIENTS'; // 'CLIENTS' or 'OPERATORS'
    this.transactions = [];
    this.analysisResults = null;
    this.analysisHistory = [];
    this.analysisParams = { startDate: '', endDate: '', expectedPrice: 0, totalSales: 0 };
    this.viewMode = 'accounts'; // 'accounts' or 'analysis'
    this.getClientAccountSummary = new GetClientAccountSummary();
  }

  /**
   * Carga de forma asíncrona todos los clientes, operadores y transacciones.
   * Calcula balances y estados de bloqueo financiero de manera reactiva.
   * @returns {Promise<void>}
   */
  async loadClients() {
    this.ui.showLoading();
    try {
      this.clients = await this.clientRepository.getClients();
      const allClientTxs = await this.clientRepository.getAllTransactions();
      
      for (const client of this.clients) {
        const txs = allClientTxs.filter(t => t.clientId === client.id);
        const account = new ClientAccount(client, txs);
        client.balance = account.getBalance();
        
        // Evaluar bloqueo financiero
        const blockStatus = account.getBlockingStatus();
        client.isBlocked = blockStatus.isBlocked;
        client.blockingReason = blockStatus.reason;

        // Metadatos del último movimiento
        const lastTx = account.getLastMovement();
        client.lastMovement = lastTx;
        client.lastMovementDate = account.getLastMovementDate();
        client.lastMovementType = lastTx?.type || null;
        client.lastMovementAmount = lastTx?.amount || 0;
        client.lastMovementDescription = lastTx?.description || '';
        client.totalDebts = account.getDebtTotal();
        client.totalPayments = account.getPaymentsTotal();
        client.movementsCount = txs.length;
      }
      
      if (this.operatorRepository) {
        this.operators = await this.operatorRepository.getOperators();
        const allOpTxs = await this.operatorRepository.getAllTransactions();
        
        for (const op of this.operators) {
          const txs = allOpTxs.filter(t => t.operatorId === op.id);
          const account = new ClientAccount(op, txs);
          op.balance = account.getBalance();
          
          const blockStatus = account.getBlockingStatus();
          op.isBlocked = blockStatus.isBlocked;
          op.blockingReason = blockStatus.reason;

          // Metadatos del último movimiento
          const lastTx = account.getLastMovement();
          op.lastMovement = lastTx;
          op.lastMovementDate = account.getLastMovementDate();
          op.lastMovementType = lastTx?.type || null;
          op.lastMovementAmount = lastTx?.amount || 0;
          op.lastMovementDescription = lastTx?.description || '';
          op.totalDebts = account.getDebtTotal();
          op.totalPayments = account.getPaymentsTotal();
          op.movementsCount = txs.length;
        }
      }


      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar clientes: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Selecciona un cliente u operador de la lista, descarga sus transacciones y actualiza la UI.
   * @param {Object} client - El cliente u operador seleccionado.
   * @param {string} [type='CLIENT'] - Tipo de entidad ('CLIENT' o 'OPERATOR').
   * @returns {Promise<void>}
   */
  async selectClient(client, type = 'CLIENT') {
    this.selectedClient = client;
    this.selectedType = type;
    this.ui.showLoading();
    try {
      if (type === 'CLIENT') {
        this.transactions = await this.clientRepository.getTransactions(client.id);
      } else {
        this.transactions = await this.operatorRepository.getTransactions(client.id);
      }
      this.transactions.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar transacciones: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Agrega un nuevo cobro (pago) a la cuenta del cliente u operador seleccionado.
   * @param {number|string} amount - Monto monetario del cobro.
   * @param {string} description - Concepto descriptivo.
   * @param {string} receivedBy - Usuario/empleado que recibe el pago.
   * @returns {Promise<void>}
   */
  async addPayment(amount, description, receivedBy) {
    if (!this.selectedClient) return;
    this.ui.showLoading();
    try {
      const transaction = {
        clientId: this.selectedClient.id,
        operatorId: this.selectedClient.id, // we save both to not break schemas
        type: 'PAYMENT',
        amount: parseFloat(amount),
        description: description,
        receivedBy: receivedBy,
        date: Date.now()
      };
      
      if (this.selectedType === 'CLIENT') {
        await this.clientRepository.addTransaction(transaction);
      } else {
        await this.operatorRepository.addTransaction(transaction);
      }
      
      await this.selectClient(this.selectedClient, this.selectedType);
      await this.loadClients(); // Update balance in list
    } catch (e) {
      this.ui.showError("Error al registrar pago: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Agrega una venta (deuda) a la cuenta corriente del cliente u operador activo.
   * @param {number|string} amount - Monto total del despacho/venta.
   * @param {string} description - Detalles o concepto de venta.
   * @returns {Promise<void>}
   */
  async addSale(amount, description) {
    if (!this.selectedClient) return;
    this.ui.showLoading();
    try {
      const transaction = {
        clientId: this.selectedClient.id,
        operatorId: this.selectedClient.id,
        type: 'DEBT',
        amount: parseFloat(amount),
        description: description,
        date: Date.now()
      };
      
      if (this.selectedType === 'CLIENT') {
        await this.clientRepository.addTransaction(transaction);
      } else {
        await this.operatorRepository.addTransaction(transaction);
      }

      await this.selectClient(this.selectedClient, this.selectedType);
      await this.loadClients(); // Update balance in list
    } catch (e) {
      this.ui.showError("Error al registrar venta: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Guarda o actualiza los datos maestros de un cliente u operador.
   * @param {Object} clientData - Atributos actualizados de la entidad.
   * @param {string} [type='CLIENT'] - Tipo ('CLIENT' o 'OPERATOR').
   * @returns {Promise<void>}
   */
  async saveClient(clientData, type = 'CLIENT') {
    this.ui.showLoading();
    try {
      if (type === 'CLIENT') {
        await this.clientRepository.saveClient(clientData);
      } else {
        await this.operatorRepository.saveOperator(clientData);
      }
      await this.loadClients();
    } catch (e) {
      this.ui.showError("Error al guardar cliente: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Orquesta la ejecución del caso de uso de cuenta y delega el renderizado de la UI.
   */
  render() {
    let accountSummary = null;
    if (this.selectedClient) {
      accountSummary = this.getClientAccountSummary.execute({
        client: this.selectedClient,
        transactions: this.transactions
      });
    }

    this.ui.renderClientAccounts({
      clients: this.clients,
      operators: this.operators,
      selectedClient: this.selectedClient,
      selectedType: this.selectedType,
      activeTab: this.activeTab,
      transactions: this.transactions,
      accountSummary: accountSummary,
      onSelectClient: this.selectClient.bind(this),
      onAddPayment: this.addPayment.bind(this),
      onAddSale: this.addSale.bind(this),
      onAnalyzePrice: this.openPriceAnalysis.bind(this),
      onSaveClient: this.saveClient.bind(this),
      onViewSaleDetail: this.viewSaleDetail.bind(this),
      onTabChange: (tab) => { this.activeTab = tab; this.render(); },
      onBack: () => { 
        if (this.viewMode === 'analysis') {
          this.viewMode = 'accounts';
          this.render();
        } else {
          this.selectedClient = null; 
          this.render(); 
        }
      }
    });

    if (this.viewMode === 'analysis') {
      this.ui.renderPriceAnalysis({
        client: this.selectedClient,
        faenas: this.analysisFaenas,
        payments: this.analysisPayments,
        history: this.analysisHistory,
        analysis: this.analysisParams,
        results: this.analysisResults,
        onRunAnalysis: this.runPriceAnalysis.bind(this),
        onSaveAnalysis: this.saveAnalysis.bind(this),
        onSelectHistory: this.selectHistoryAnalysis.bind(this),
        onBack: () => { this.viewMode = 'accounts'; this.render(); }
      });
    }
  }

  /**
   * Abre la sección del simulador y análisis financiero de precios de venta históricos.
   * @returns {Promise<void>}
   */
  async openPriceAnalysis() {
    if (!this.selectedClient) return;
    this.viewMode = 'analysis';
    this.analysisResults = null;
    this.analysisFaenas = [];
    this.analysisPayments = [];
    this.ui.showLoading();
    try {
      this.analysisHistory = await this.clientRepository.getPriceAnalyses(this.selectedClient.id);
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar historial: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Ejecuta el análisis cruzando los despachos en kilos y pagos recibidos en un rango de fechas.
   * @param {Object} params - Parámetros del análisis.
   * @returns {Promise<void>}
   */
  async runPriceAnalysis(params) {
    this.analysisParams = params;
    this.ui.showLoading();
    try {
      const [faenas, payments] = await Promise.all([
        this.clientRepository.getDispatchedFaenas(this.selectedClient.name, params.startDate, params.endDate),
        this.clientRepository.getTransactionsInRange(this.selectedClient.id, params.startDate, params.endDate)
      ]);

      const totalKg = faenas.reduce((sum, f) => sum + (f.kg || 0), 0);
      const totalPayments = payments.filter(p => p.type === 'PAYMENT').reduce((sum, p) => sum + (p.amount || 0), 0);
      const actualPrice = totalKg > 0 ? (params.totalSales / totalKg) : 0;

      this.analysisFaenas = faenas;
      this.analysisPayments = payments.filter(p => p.type === 'PAYMENT');
      this.analysisResults = {
        ...params,
        totalKg,
        totalPayments,
        actualPrice,
        clientId: this.selectedClient.id,
        clientName: this.selectedClient.name
      };
      this.render();
    } catch (e) {
      this.ui.showError("Error al ejecutar análisis: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Guarda un reporte histórico del análisis financiero de precios.
   * @param {Object} results - Resultados calculados.
   * @returns {Promise<void>}
   */
  async saveAnalysis(results) {
    this.ui.showLoading();
    try {
      await this.clientRepository.savePriceAnalysis(results);
      this.analysisHistory = await this.clientRepository.getPriceAnalyses(this.selectedClient.id);
      this.render();
      alert("Análisis guardado con éxito.");
    } catch (e) {
      this.ui.showError("Error al guardar análisis: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Selecciona un análisis financiero guardado del historial para visualizarlo.
   * @param {Object} item - Datos del análisis histórico.
   */
  selectHistoryAnalysis(item) {
    this.analysisParams = {
      startDate: item.startDate,
      endDate: item.endDate,
      expectedPrice: item.expectedPrice,
      totalSales: item.totalSales
    };
    this.analysisResults = item;
    this.analysisFaenas = []; 
    this.analysisPayments = [];
    this.render();
  }

  /**
   * Obtiene la venta en detalle y abre el modal correspondiente de impresión o visualización de garrones.
   * @param {string|number} saleId - ID del despacho/venta.
   * @param {string} concept - Descripción del movimiento.
   * @returns {Promise<void>}
   */
  async viewSaleDetail(saleId, concept) {
    document.body.style.cursor = 'wait';
    try {
      const sale = await this.clientRepository.getSaleById(saleId);
      if (!sale) {
        alert(`No se encontró el detalle de los ítems para el comprobante "${saleId}".\n\nMotivos posibles:\n1. El comprobante fue emitido desde una terminal/sucursal externa y aún no se sincronizó su desglose de productos a la base de datos central.\n2. Se trata de un movimiento asentado únicamente como saldo financiero o contable.`);
        return;
      }
      const products = await this.clientRepository.getProducts();
      const productsMap = {};
      products.forEach(p => {
        productsMap[p.id] = p;
      });

      this.ui.renderSaleDetailModal(sale, productsMap, concept);
    } catch (e) {
      alert("Error al cargar detalle de venta: " + e.message);
    } finally {
      document.body.style.cursor = 'default';
    }

  }
}
