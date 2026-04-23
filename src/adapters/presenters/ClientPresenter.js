// src/adapters/presenters/ClientPresenter.js

export class ClientPresenter {
  constructor(clientRepository, ui) {
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.clients = [];
    this.selectedClient = null;
    this.transactions = [];
    this.analysisResults = null;
    this.analysisHistory = [];
    this.analysisParams = { startDate: '', endDate: '', expectedPrice: 0, totalSales: 0 };
    this.viewMode = 'accounts'; // 'accounts' or 'analysis'
  }

  async loadClients() {
    this.ui.showLoading();
    try {
      this.clients = await this.clientRepository.getClients();
      // Calculate balances (this could also be done on the server/API side)
      for (const client of this.clients) {
        const txs = await this.clientRepository.getTransactions(client.id);
        const debt = txs.filter(t => t.type === 'DEBT').reduce((sum, t) => sum + (t.amount || 0), 0);
        const payments = txs.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + (t.amount || 0), 0);
        client.balance = debt - payments;
      }
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar clientes: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async selectClient(client) {
    this.selectedClient = client;
    this.ui.showLoading();
    try {
      this.transactions = await this.clientRepository.getTransactions(client.id);
      this.transactions.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar transacciones: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async addPayment(amount, description, receivedBy) {
    if (!this.selectedClient) return;
    this.ui.showLoading();
    try {
      const transaction = {
        clientId: this.selectedClient.id,
        type: 'PAYMENT',
        amount: parseFloat(amount),
        description: description,
        receivedBy: receivedBy,
        date: Date.now()
      };
      await this.clientRepository.addTransaction(transaction);
      await this.selectClient(this.selectedClient);
      await this.loadClients(); // Update balance in list
    } catch (e) {
      this.ui.showError("Error al registrar pago: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async addSale(amount, description) {
    if (!this.selectedClient) return;
    this.ui.showLoading();
    try {
      const transaction = {
        clientId: this.selectedClient.id,
        type: 'DEBT',
        amount: parseFloat(amount),
        description: description,
        date: Date.now()
      };
      await this.clientRepository.addTransaction(transaction);
      await this.selectClient(this.selectedClient);
      await this.loadClients(); // Update balance in list
    } catch (e) {
      this.ui.showError("Error al registrar venta: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  render() {
    this.ui.renderClientAccounts({
      clients: this.clients,
      selectedClient: this.selectedClient,
      transactions: this.transactions,
      onSelectClient: this.selectClient.bind(this),
      onAddPayment: this.addPayment.bind(this),
      onAddSale: this.addSale.bind(this),
      onAnalyzePrice: this.openPriceAnalysis.bind(this),
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

  selectHistoryAnalysis(item) {
    this.analysisParams = {
      startDate: item.startDate,
      endDate: item.endDate,
      expectedPrice: item.expectedPrice,
      totalSales: item.totalSales
    };
    this.analysisResults = item;
    // We don't re-fetch faenas/payments here to keep it simple, 
    // but we could if we wanted the detail tables to populate.
    this.analysisFaenas = []; 
    this.analysisPayments = [];
    this.render();
  }
}
