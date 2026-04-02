// src/adapters/presenters/ConsumptionPresenter.js
import { debounce } from '../../utils.js';


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
      categoryPriceInputs: {}, // { 'NOVILLO': '5100', 'VACA': '3200', ... }
      sortOrder: 'asc',
      stockSearch: '',
      tropaFilter: 'ALL', // 'ALL' | specific tropa number
      categoryFilter: 'ALL',
      historyFilters: {
        destination: '',
        date: '',
        search: ''
      }
    };

    this.debouncedStockSearch = debounce((val) => {
      this.state.stockSearch = val.toLowerCase();
      this.updateView();
    }, 400);

    this.debouncedHistorySearch = debounce((val) => {
      this.state.historyFilters.search = val.toLowerCase();
      this.updateView();
    }, 400);
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
    this.state.categoryPriceInputs = {};
    this.updateView();
  }

  setDestination(val) {
    this.state.destinationInput = val;
  }

  setCategoryPrice(cat, val) {
    this.state.categoryPriceInputs = { ...this.state.categoryPriceInputs, [cat]: val };
  }

  _autoSuggestPrice() {
    // Pre-fill prices from saved categoryPrices for each selected category
    const selectedItems = this.allFaenas.filter(f => this.state.selectedIds.has(f.id));
    const newPrices = { ...this.state.categoryPriceInputs };
    selectedItems.forEach(item => {
      const cat = item.standardizedCategory || 'OTRO';
      if (!newPrices[cat] && this.categoryPrices[cat]) {
        newPrices[cat] = String(this.categoryPrices[cat]);
      }
    });
    this.state.categoryPriceInputs = newPrices;
  }

  toggleSort() {
    this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
    this.updateView();
  }

  setStockSearch(val) {
    this.state.stockSearch = val.toLowerCase();
    this.debouncedStockSearch(val);
  }

  setCategoryFilter(cat) {
    this.state.categoryFilter = cat;
    this.state.selectedIds.clear();
    this.state.priceInput = '';
    this.updateView();
  }

  setTropaFilter(tropa) {
    this.state.tropaFilter = tropa;
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

    // Build per-category breakdown
    const selectedItems = this.allFaenas.filter(i => this.state.selectedIds.has(i.id));
    const byCategory = {};
    selectedItems.forEach(item => {
      const cat = item.standardizedCategory || 'OTRO';
      if (!byCategory[cat]) byCategory[cat] = { items: [], kg: 0 };
      byCategory[cat].items.push(item);
      byCategory[cat].kg += item.kg || 0;
    });

    // Validate all categories have a price
    for (const cat of Object.keys(byCategory)) {
      const price = parseFloat(this.state.categoryPriceInputs[cat]);
      if (isNaN(price) || price <= 0) {
        alert(`Debes ingresar un precio válido para la categoría ${cat}.`);
        return;
      }
      byCategory[cat].price = price;
      byCategory[cat].subtotal = byCategory[cat].kg * price;
    }

    const totalDebt = Object.values(byCategory).reduce((s, c) => s + c.subtotal, 0);
    const totalKg = selectedItems.reduce((s, i) => s + (i.kg || 0), 0);

    const catSummary = Object.entries(byCategory)
      .map(([cat, d]) => `${cat}: ${d.kg.toFixed(1)} kg × $${d.price} = $${d.subtotal.toLocaleString()}`)
      .join('\n');

    if (!confirm(`¿Confirmar despacho de ${selectedItems.length} piezas a "${dest}"?\n\n${catSummary}\n\nTOTAL: $${totalDebt.toLocaleString()}`)) return;

    this.ui.showLoading();
    try {
      const clientId = await this.clientRepository.saveClient({ name: dest });

      const breakout = selectedItems.map(item => {
        const cat = item.standardizedCategory || 'OTRO';
        const price = byCategory[cat].price;
        return { id: item.id, garron: item.garron, weight: item.kg, price, total: (item.kg || 0) * price };
      });

      const transaction = {
        clientId,
        type: 'DEBT',
        amount: totalDebt,
        description: `Despacho de ${selectedItems.length} reses (${totalKg.toFixed(1)} kg) a "${dest}"`,
        breakout,
        date: Date.now()
      };
      await this.clientRepository.addTransaction(transaction);

      const idsArray = Array.from(this.state.selectedIds);
      await this.travelRepository.dispatchFaenas(uid, idsArray, dest);

      this.state.selectedIds.clear();
      this.state.destinationInput = '';
      this.state.categoryPriceInputs = {};

      await this.loadFaenas(uid);
    } catch (e) {
      console.error(e);
      alert(`Error al despachar: ${e.message}`);
      this.ui.hideLoading();
    }
  }

  setHistoryFilter(key, value) {
    if (key === 'search') {
      this.state.historyFilters[key] = value.toLowerCase();
      this.debouncedHistorySearch(value);
    } else {
      this.state.historyFilters[key] = value.toLowerCase();
      this.updateView();
    }
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
    let stock = this.allFaenas.filter(f => f.status === 'AVAILABLE');
    let history = this.allFaenas.filter(f => f.status === 'DISPATCHED');

    // Compute all unique tropas from ALL faenas
    const allTropas = [...new Set(this.allFaenas.map(f => String(f.tropa || '')).filter(Boolean))]
      .sort((a, b) => parseInt(a) - parseInt(b));

    // Compute finished tropas: all garrones of that tropa are DISPATCHED
    const finishedTropas = allTropas.filter(tropa => {
      const members = this.allFaenas.filter(f => String(f.tropa || '') === tropa);
      return members.length > 0 && members.every(f => f.status === 'DISPATCHED');
    });

    // Apply history filters
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

    // Apply tropa filter
    if (this.state.tropaFilter !== 'ALL') {
      stock = stock.filter(f => String(f.tropa || '') === this.state.tropaFilter);
      history = history.filter(f => String(f.tropa || '') === this.state.tropaFilter);
    }

    // Apply general search and sort
    stock = this._applySearchAndSort(stock, this.state.stockSearch);
    history = this._applySearchAndSort(history, this.state.historyFilters.search);

    // Apply category filter
    if (this.state.categoryFilter !== 'ALL') {
      stock = stock.filter(f => f.standardizedCategory === this.state.categoryFilter);
      history = history.filter(f => f.standardizedCategory === this.state.categoryFilter);
    }

    const options = {
      state: this.state,
      stockItems: stock,
      historyItems: history,
      allTropas,
      finishedTropas,
      clients: this.clients,
      onTabSwitch: this.toggleTab.bind(this),
      onToggleSelection: this.toggleSelection.bind(this),
      onSelectAll: this.selectAll.bind(this),
      onClearSelection: this.clearSelection.bind(this),
      onDestinationInput: this.setDestination.bind(this),
      onDispatch: () => { this.dispatchSelected(this.currentUid); },
      onFilterChange: this.setHistoryFilter.bind(this),
      onToggleSort: this.toggleSort.bind(this),
      onStockSearch: this.setStockSearch.bind(this),
      onCategoryChange: this.setCategoryFilter.bind(this),
      onTropaChange: this.setTropaFilter.bind(this),
      onCategoryPriceInput: this.setCategoryPrice.bind(this)
    };

    this.ui.renderFaenaConsumption(options);
  }
}
