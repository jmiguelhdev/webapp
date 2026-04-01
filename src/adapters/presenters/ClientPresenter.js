// src/adapters/presenters/ClientPresenter.js

export class ClientPresenter {
  constructor(clientRepository, ui) {
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.clients = [];
    this.selectedClient = null;
    this.transactions = [];
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

  async addPayment(amount, description) {
    if (!this.selectedClient) return;
    this.ui.showLoading();
    try {
      const transaction = {
        clientId: this.selectedClient.id,
        type: 'PAYMENT',
        amount: parseFloat(amount),
        description: description,
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

  render() {
    this.ui.renderClientAccounts({
      clients: this.clients,
      selectedClient: this.selectedClient,
      transactions: this.transactions,
      onSelectClient: this.selectClient.bind(this),
      onAddPayment: this.addPayment.bind(this),
      onBack: () => { this.selectedClient = null; this.render(); }
    });
  }
}
