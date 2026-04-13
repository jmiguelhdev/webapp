// src/adapters/presenters/AccountingPresenter.js

export class AccountingPresenter {
  constructor(accountingRepository, ui) {
    this.accountingRepository = accountingRepository;
    this.ui = ui;
    this.entries = [];
    this.clients = [];
    this.producers = [];
    this.currentUserUid = null;
  }

  setUid(uid) {
    this.currentUserUid = uid;
  }

  async loadData() {
    this.ui.showLoading();
    try {
      this.entries = await this.accountingRepository.fetchEntries(this.currentUserUid);
      this.clients = await this.accountingRepository.getClients();
      
      const travels = await this.accountingRepository.getTravels(this.currentUserUid);
      this.producers = this.extractUniqueProducers(travels);
      
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar datos contables: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  extractUniqueProducers(travels) {
    const producerMap = new Map();
    travels.forEach(t => {
      const producers = t.buy?.listOfProducers || [];
      producers.forEach(p => {
        // Extract CUIT and Name from either flat or nested producer object
        const cuit = String(p.cuit || p.producer?.cuit || '').replace(/\D/g, '');
        const name = p.name || p.producer?.name || 'Productor';
        if (cuit && !producerMap.has(cuit)) {
          producerMap.set(cuit, { cuit, name });
        }
      });
    });
    return Array.from(producerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async saveEntry(entryData) {
    this.ui.showLoading();
    try {
      await this.accountingRepository.saveEntry(this.currentUserUid, entryData);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al guardar movimiento: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

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

  render() {
    this.ui.renderAccounting({
      entries: this.entries,
      clients: this.clients,
      producers: this.producers,
      onSave: this.saveEntry.bind(this),
      onDelete: this.deleteEntry.bind(this),
      onRefresh: this.loadData.bind(this)
    });
  }
}
