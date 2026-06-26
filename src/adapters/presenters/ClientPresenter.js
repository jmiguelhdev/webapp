// src/adapters/presenters/ClientPresenter.js

import { ClientAccount } from '../../domain/entities/ClientAccount.js';
import { GetClientAccountSummary } from '../../domain/usecases/GetClientAccountSummary.js';

export class ClientPresenter {
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

  async loadClients() {
    this.ui.showLoading();
    try {
      this.clients = await this.clientRepository.getClients();
      const allClientTxs = await this.clientRepository.getAllTransactions();
      
      for (const client of this.clients) {
        const txs = allClientTxs.filter(t => t.clientId === client.id);
        const account = new ClientAccount(client, txs);
        client.balance = account.getBalance();
      }
      
      if (this.operatorRepository) {
        this.operators = await this.operatorRepository.getOperators();
        const allOpTxs = await this.operatorRepository.getAllTransactions();
        
        for (const op of this.operators) {
          const txs = allOpTxs.filter(t => t.operatorId === op.id);
          const account = new ClientAccount(op, txs);
          op.balance = account.getBalance();
        }
      }

      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar clientes: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

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

  async saveClient(clientData, type = 'CLIENT') {
    this.ui.showLoading();
    try {
      if (type === 'CLIENT') {
        await this.clientRepository.saveClient(clientData);
      } else {
        await this.operatorRepository.saveOperator(clientData);
      }
      await this.loadClients();
      // Optional: alert or message
    } catch (e) {
      this.ui.showError("Error al guardar cliente: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

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

  async viewSaleDetail(saleId) {
    this.ui.showLoading();
    try {
      const sale = await this.clientRepository.getSaleById(saleId);
      if (!sale) {
        alert("No se encontró la venta con ID: " + saleId);
        return;
      }
      const products = await this.clientRepository.getProducts();
      const productsMap = {};
      products.forEach(p => {
        productsMap[p.id] = p;
      });

      this.ui.renderSaleDetailModal(sale, productsMap);
    } catch (e) {
      this.ui.showError("Error al cargar detalle de venta: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }
}
