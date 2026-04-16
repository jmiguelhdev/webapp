import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class AccountingPresenter {
  constructor(accountingRepository, clientRepository, ui, options = {}) {
    this.accountingRepository = accountingRepository;
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.title = options.title || 'Caja General';
    this.syncLabel = options.syncLabel || 'Pago Caja General';
    
    this.entries = [];
    this.clients = [];
    this.producers = [];
    this.currentUserUid = null;
    
    // Pagination & Filtering state
    this.currentPage = 1;
    this.itemsPerPage = 15;
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
      this.entries = await this.accountingRepository.fetchEntries(this.currentUserUid);
      // Sort by date descending by default
      this.entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
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

  applyFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.currentPage = 1; // Reset to first page on filter change
    this.render();
  }

  setPage(page) {
    this.currentPage = page;
    this.render();
  }

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
        await api.removeLinkedTransaction(db, entryId);
      }

      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al guardar movimiento: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

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
      entries: paginatedEntries,
      allEntries: this.entries, // Still need all for stats or I could use filtered
      filteredEntries: filteredEntries, // For stats based on selection
      clients: this.clients,
      producers: this.producers,
      pagination: {
        currentPage: this.currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        onPageChange: this.setPage.bind(this)
      },
      filters: this.filters,
      onFilterChange: this.applyFilters.bind(this),
      onSave: (data) => this.saveEntry(data),
      onDelete: (id) => this.deleteEntry(id),
      onRefresh: () => this.loadData(),
      onExport: (start, end) => this.exportData(start, end)
    });
  }
}
