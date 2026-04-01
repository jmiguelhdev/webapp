// src/adapters/presenters/ConsumptionPresenter.js

export class ConsumptionPresenter {
  constructor(travelRepository, ui, clientRepository) {
    this.travelRepository = travelRepository;
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.allFaenas = [];
    this.clients = [];
    this.categoryPrices = {};
    
    this.state = {
      activeTab: 'STOCK', // 'STOCK' | 'HISTORY'
      selectedIds: new Set(),
      destinationInput: '',
      priceInput: '', // Manual price input
      sortOrder: 'asc', // 'asc' or 'desc'
      stockSearch: '',
      categoryFilter: 'ALL', // 'ALL' | 'NOVILLO' | 'VACA' | 'TORO' | 'VAQUILLONA'
      historyFilters: {
        destination: '',
        date: '',
        search: ''
      }
    };
  }

  async loadFaenas(uid) {
    this.currentUid = uid;
    this.ui.showLoading();
    try {
      this.allFaenas = await this.travelRepository.getFaenaStock(uid);
      this.clients = await this.clientRepository.getClients();
      this.categoryPrices = await this.clientRepository.getCategoryPrices();
      
      // Sort desc by creation/faena date
      this.allFaenas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      this.updateView();
    } catch (e) {
      console.error("Error loading faena stock:", e);
    } finally {
      this.ui.hideLoading();
    }
  }

  toggleTab(tab) {
    this.state.activeTab = tab;
    this.state.selectedIds.clear();
    this.updateView();
  }

  toggleSelection(id) {
    if (this.state.selectedIds.has(id)) {
      this.state.selectedIds.delete(id);
    } else {
      this.state.selectedIds.add(id);
    }
    this._autoSuggestPrice();
    this.updateView();
  }

  selectAll(ids) {
    ids.forEach(id => this.state.selectedIds.add(id));
    this._autoSuggestPrice();
    this.updateView();
  }

  clearSelection() {
    this.state.selectedIds.clear();
    this.state.priceInput = '';
    this.updateView();
  }

  setDestination(val) {
    this.state.destinationInput = val;
  }

  setPrice(val) {
    this.state.priceInput = val;
  }

  _autoSuggestPrice() {
    // If only one category is present in selection, suggest price
    const selectedItems = this.allFaenas.filter(f => this.state.selectedIds.has(f.id));
    if (selectedItems.length === 0) {
      this.state.priceInput = '';
      return;
    }
    const categories = [...new Set(selectedItems.map(i => i.standardizedCategory || 'OTRO'))];
    if (categories.length === 1) {
      const cat = categories[0];
      if (this.categoryPrices[cat]) {
        this.state.priceInput = this.categoryPrices[cat].toString();
      }
    } else {
      this.state.priceInput = '';
    }
  }

  toggleSort() {
    this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
    this.updateView();
  }

  setStockSearch(val) {
    this.state.stockSearch = val.toLowerCase();
    this.updateView();
  }

  setCategoryFilter(cat) {
    this.state.categoryFilter = cat;
    // Clear selection when filters change to avoid dispatching invisible items by accident
    this.state.selectedIds.clear(); 
    this.state.priceInput = '';
    this.updateView();
  }

  async dispatchSelected(uid) {
    if (this.state.selectedIds.size === 0) return;
    const dest = this.state.destinationInput.trim();
    if (!dest) {
      alert("Debes ingresar un Destino / Cliente para despachar las reses.");
      return;
    }

    const price = parseFloat(this.state.priceInput);
    if (isNaN(price) || price <= 0) {
      alert("Debes ingresar un precio válido por kg.");
      return;
    }

    const selectedItems = this.allFaenas.filter(i => this.state.selectedIds.has(i.id));
    const totalKg = selectedItems.reduce((s, i) => s + (i.kg || 0), 0);
    const totalDebt = totalKg * price;

    if (!confirm(`¿Estás seguro de despachar ${this.state.selectedIds.size} medias reses a "${dest}" por un total de $${totalDebt.toFixed(2)} ($${price}/kg)?`)) {
      return;
    }

    this.ui.showLoading();
    try {
      // 1. Create/Update Client
      const clientData = { name: dest };
      const clientId = await this.clientRepository.saveClient(clientData);

      // 2. Record Debt Transaction
      const breakout = selectedItems.map(item => ({
        id: item.id,
        garron: item.garron,
        weight: item.kg,
        price: price,
        total: (item.kg || 0) * price
      }));

      const transaction = {
        clientId: clientId,
        type: 'DEBT',
        amount: totalDebt,
        description: `Despacho de ${selectedItems.length} reses (${totalKg.toFixed(1)} kg) a $${price}/kg`,
        breakout: breakout, // Detailed info
        date: Date.now()
      };
      await this.clientRepository.addTransaction(transaction);

      // 3. Mark as Dispatched
      const idsArray = Array.from(this.state.selectedIds);
      await this.travelRepository.dispatchFaenas(uid, idsArray, dest);
      
      this.state.selectedIds.clear();
      this.state.destinationInput = '';
      this.state.priceInput = '';
      
      // Reload raw data
      await this.loadFaenas(uid);
    } catch (e) {
      console.error(e);
      alert(`Error al despachar: ${e.message}`);
      this.ui.hideLoading();
    }
  }

  setHistoryFilter(key, value) {
    this.state.historyFilters[key] = value.toLowerCase();
    this.updateView();
  }

  _applySearchAndSort(list, searchStr) {
    let result = list;
    
    // Apply general search
    if (searchStr) {
      result = result.filter(f => {
        const tropa = String(f.tropa || '').toLowerCase();
        const garron = String(f.garron || '').toLowerCase();
        const kgStr = String(f.kg || '').toLowerCase();
        return tropa.includes(searchStr) || garron.includes(searchStr) || kgStr.includes(searchStr);
      });
    }

    // Apply sort by garron
    result.sort((a, b) => {
      const g1 = parseInt(a.garron) || 0;
      const g2 = parseInt(b.garron) || 0;
      return this.state.sortOrder === 'asc' ? g1 - g2 : g2 - g1;
    });

    return result;
  }

  updateView() {
    // Separate Stock vs History
    let stock = this.allFaenas.filter(f => f.status === 'AVAILABLE');
    let history = this.allFaenas.filter(f => f.status === 'DISPATCHED');

    // Apply specific History Filters
    if (this.state.historyFilters.destination) {
      const q = this.state.historyFilters.destination;
      history = history.filter(f => (f.destination || '').toLowerCase().includes(q));
    }
    if (this.state.historyFilters.date) {
      history = history.filter(f => {
        if (!f.dispatchDate) return false;
        const dateStr = new Date(f.dispatchDate).toISOString().split('T')[0];
        return dateStr === this.state.historyFilters.date;
      });
    }

    // Apply General Search and Garron Sort
    stock = this._applySearchAndSort(stock, this.state.stockSearch);
    history = this._applySearchAndSort(history, this.state.historyFilters.search);

    // Apply Global Category Filter
    if (this.state.categoryFilter !== 'ALL') {
      stock = stock.filter(f => f.standardizedCategory === this.state.categoryFilter);
      history = history.filter(f => f.standardizedCategory === this.state.categoryFilter);
    }

    const options = {
      state: this.state,
      stockItems: stock,
      historyItems: history,
      clients: this.clients, // List of suggestions
      onTabSwitch: this.toggleTab.bind(this),
      onToggleSelection: this.toggleSelection.bind(this),
      onSelectAll: this.selectAll.bind(this),
      onClearSelection: this.clearSelection.bind(this),
      onDestinationInput: this.setDestination.bind(this),
      onPriceInput: this.setPrice.bind(this),
      onDispatch: () => { this.dispatchSelected(this.currentUid); },
      onFilterChange: this.setHistoryFilter.bind(this),
      onToggleSort: this.toggleSort.bind(this),
      onStockSearch: this.setStockSearch.bind(this),
      onCategoryChange: this.setCategoryFilter.bind(this)
    };

    this.ui.renderFaenaConsumption(options);
  }
}
