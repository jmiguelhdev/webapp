// src/adapters/presenters/ConsumptionPresenter.js
import { debounce } from '../../utils.js';
import { GetStockSummary } from '../../domain/usecases/GetStockSummary.js';
import { ClientAccount } from '../../domain/entities/ClientAccount.js';


/**
 * Presenter para la gestión del stock e inventario de faena de medias reses (Consumos y Despachos).
 * Controla la lectura de códigos de barra QR/PDF, preparación de borradores de despacho y traslados de cámaras de frío.
 */
export class ConsumptionPresenter {
  /**
   * @param {Object} travelRepository - Repositorio de faena y viajes logísticos.
   * @param {Object} ui - Interfaz unificada de usuario para manipular el DOM.
   * @param {Object} clientRepository - Repositorio de clientes para precios y cuentas corrientes.
   */
  constructor(travelRepository, ui, clientRepository) {
    this.travelRepository = travelRepository;
    this.clientRepository = clientRepository;
    this.ui = ui;
    this.allFaenas = [];
    this.clients = [];
    this.categoryPrices = {};
    this.camarasList = [];
    this.achurasItems = [];
    this.userRole = null;
    
    this.state = {
      activeTab: 'STOCK', // 'STOCK' | 'DRAFTS' | 'HISTORY'
      selectedIds: new Set(),
      destinationInput: '',
      categoryPriceInputs: {}, // { 'NOVILLO': '5100', 'VACA': '3200', ... }
      sortOrder: 'asc',
      stockSearch: '',
      tropaFilter: 'ALL', // 'ALL' | specific tropa number
      categoryFilter: 'ALL',
      camaraFilter: 'ALL', // 'ALL' | specific camara name
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

    this.getStockSummary = new GetStockSummary();
  }

  setUserRole(role) {
    this.userRole = role;
  }

  async loadFaenas(uid, silent = false) {
    this.currentUid = uid;
    if (!silent) this.ui.showLoading();
    try {
      this.allFaenas = await this.travelRepository.getFaenaStock(uid);
      this.clients = await this.clientRepository.getClients();
      this.categoryPrices = await this.clientRepository.getCategoryPrices();
      this.camarasList = await this.clientRepository.getCamaras() || [];
      this.achurasItems = await this.travelRepository.fetchAchurasStock(uid);
      this.travels = await this.travelRepository.fetchTravels(uid).catch(() => []);
      
      // Sort desc by creation/faena date
      this.allFaenas.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Pre-compute basic filtered sets for better updateView performance
      this.stockCache = this.allFaenas.filter(f => f.status === 'AVAILABLE');
      this.draftCache = this.allFaenas.filter(f => f.status === 'DRAFT');
      this.historyCache = this.allFaenas.filter(f => f.status === 'DISPATCHED');
      
      this.allTropasCache = [...new Set(this.allFaenas.map(f => String(f.tropa || '')).filter(Boolean))]
        .sort((a, b) => parseInt(a) - parseInt(b));

      this.finishedTropasCache = this.allTropasCache.filter(tropa => {
        const members = this.allFaenas.filter(f => String(f.tropa || '') === tropa);
        return members.length > 0 && members.every(f => f.status === 'DISPATCHED');
      });

      this.updateView();
    } catch (e) {
      console.error("Error loading faena stock:", e);
    } finally {
      if (!silent) this.ui.hideLoading();
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

  setCamaraFilter(camara) {
    this.state.camaraFilter = camara;
    this.state.selectedIds.clear();
    this.updateView();
  }

  async moveSelectedToCamara(uid, camaraId) {
    if (this.state.selectedIds.size === 0 || !camaraId) return;
    
    this.ui.showLoading();
    try {
      const selectedItems = this.allFaenas.filter(i => this.state.selectedIds.has(i.id));
      const recordsInfo = selectedItems.map(item => ({
        id: item.id,
        fromCamaraId: item.camaraId || null
      }));

      await this.travelRepository.moveFaenasToCamara(uid, recordsInfo, camaraId);

      this.state.selectedIds.clear();
      await this.loadFaenas(uid);
    } catch (e) {
      console.error(e);
      alert(`Error al mover a cámara: ${e.message}`);
      this.ui.hideLoading();
    }
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

    if (this.userRole === 'OPERARIO') {
      if (!confirm(`¿Confirmar PREPARACIÓN (Borrador) de ${selectedItems.length} piezas a "${dest}"?\n(Un administrador deberá validarlo luego)`)) return;
      this.ui.showLoading();
      try {
        const idsArray = Array.from(this.state.selectedIds);
        const draftPrices = {};
        for (const cat of Object.keys(byCategory)) {
           draftPrices[cat] = byCategory[cat].price;
        }
        await this.travelRepository.prepareFaenas(uid, idsArray, {
          status: 'DRAFT',
          destination: dest,
          draftPrices: draftPrices,
          draftDate: Date.now()
        });
        
        this.state.selectedIds.clear();
        this.state.destinationInput = '';
        this.state.categoryPriceInputs = {};
        await this.loadFaenas(uid);
      } catch (e) {
        console.error(e);
        alert(`Error al guardar borrador: ${e.message}`);
        this.ui.hideLoading();
      }
      return;
    }

    if (!confirm(`¿Confirmar SALIDA DEFINITIVA de ${selectedItems.length} piezas a "${dest}"?\n\n${catSummary}\n\nTOTAL: $${totalDebt.toLocaleString()}`)) return;

    this.ui.showLoading();
    try {
      // 1. Fetch all dependencies in parallel to avoid multiple round-trips
      const [allClients, priceLists, rawProducts, providers] = await Promise.all([
        this.clientRepository.getClients(),
        this.clientRepository.getPriceLists(),
        this.clientRepository.getRawMaterialProducts(),
        this.clientRepository.getProviders()
      ]);

      // 2. Save / Match Client
      const matchedClient = allClients.find(c => c.name.toLowerCase() === dest.toLowerCase());
      
      if (matchedClient) {
        const txs = await this.clientRepository.getTransactions(matchedClient.id);
        const account = new ClientAccount(matchedClient, txs);
        const blockStatus = account.getBlockingStatus();
        if (blockStatus.isBlocked) {
          alert(`🚫 DESPACHO DENEGADO\n\nEl cliente "${matchedClient.name}" tiene su cuenta suspendida por superar los límites financieros establecidos.\n\nMotivo: ${blockStatus.reason}`);
          this.ui.hideLoading();
          return;
        }
      }

      let clientId = matchedClient ? matchedClient.id : `CUST_${Date.now()}`;
      const isNewClient = !matchedClient;
      let shouldLinkClient = false;

      let priceListId = matchedClient ? matchedClient.priceListId : null;
      // Auto-match price list by name/id if not linked to the client yet
      if (!priceListId) {
        const matchedPriceList = priceLists.find(pl => 
          pl.id.toLowerCase() === dest.toLowerCase() || 
          pl.name.toLowerCase() === dest.toLowerCase()
        );
        if (matchedPriceList) {
          priceListId = matchedPriceList.id;
          shouldLinkClient = true;
          console.log(`Matched destination "${dest}" with price list "${matchedPriceList.name}" (ID: ${priceListId}).`);
        }
      }

      // 3. Prepare Transactions and Raw Materials
      const breakout = selectedItems.map(item => {
        const cat = item.standardizedCategory || 'OTRO';
        const price = byCategory[cat].price;
        return { id: item.id, garron: item.garron, weight: item.kg, price, total: (item.kg || 0) * price };
      });

      const customerTransaction = {
        clientId,
        type: 'DEBT',
        amount: totalDebt,
        description: `Despacho de ${selectedItems.length} reses (${totalKg.toFixed(1)} kg) a "${dest}"`,
        breakout,
        date: Date.now()
      };

      let providerToUpdate = { id: Date.now() + Math.floor(Math.random() * 1000), balance: totalDebt }; // fallback
      let isNewProvider = true;
      let providerTransaction = null;
      const rawMaterialBatches = [];

      if (priceListId) {
        // 3.1 Resolve Provider "frigorifico pampa" scoped to this priceListId
        const matchedProvider = providers.find(p => 
          p.name.toLowerCase() === "frigorifico pampa" && p.priceListId === priceListId
        );

        let providerId;
        if (matchedProvider) {
          providerId = Number(matchedProvider.id);
          const currentBalance = parseFloat(matchedProvider.balance) || 0.0;
          const newBalance = currentBalance + totalDebt;
          providerToUpdate = {
            ...matchedProvider,
            balance: newBalance
          };
          isNewProvider = false;
        } else {
          providerId = Date.now() + Math.floor(Math.random() * 1000);
          providerToUpdate = {
            id: providerId,
            name: "frigorifico pampa",
            cuit: "30-71549281-8",
            contact: "",
            address: "",
            balance: totalDebt,
            priceListId: priceListId
          };
          isNewProvider = true;
        }

        // 3.2 Prepare provider transaction
        providerTransaction = {
          clientId: String(providerId), // provider ID (no starting with CUST_)
          type: 'DEBT',
          amount: totalDebt,
          description: `Compra por despacho de ${selectedItems.length} reses (${totalKg.toFixed(1)} kg) de Frigorífico Pampa`,
          date: Date.now(),
          priceListId: priceListId, // filtered for this carnicería
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // 3.3 Prepare RawMaterialBatch for each carcass item
        for (const item of selectedItems) {
          const cat = item.standardizedCategory || 'OTRO';
          const price = byCategory[cat].price;

          // Resolve Raw Material Product
          let rawMaterialProductId = 1781795650161; // Fallback: Media Res Vacuna
          const itemCat = (item.standardizedCategory || item.category || "").toLowerCase();
          
          if (itemCat) {
            let match = rawProducts.find(p => p.name.toLowerCase().includes(itemCat));
            if (match) {
              rawMaterialProductId = Number(match.id);
            } else if (itemCat.includes("novillo") || itemCat.includes("novillito")) {
              match = rawProducts.find(p => p.name.toLowerCase().includes("novillo"));
              if (match) rawMaterialProductId = Number(match.id);
            } else if (itemCat.includes("vaquillona") || itemCat.includes("vaq")) {
              match = rawProducts.find(p => p.name.toLowerCase().includes("vaquillona") || p.name.toLowerCase().includes("vaq"));
              if (match) rawMaterialProductId = Number(match.id);
            } else if (itemCat.includes("ternera") || itemCat.includes("ternero") || itemCat.includes("ter")) {
              match = rawProducts.find(p => p.name.toLowerCase().includes("ternera") || p.name.toLowerCase().includes("ternero"));
              if (match) rawMaterialProductId = Number(match.id);
            } else if (itemCat.includes("vaca")) {
              match = rawProducts.find(p => p.name.toLowerCase().includes("vaca") || p.name.toLowerCase().includes("vacuna"));
              if (match) rawMaterialProductId = Number(match.id);
            } else {
              match = rawProducts.find(p => p.name.toLowerCase().includes("vacuna") || p.name.toLowerCase() === "res");
              if (match) rawMaterialProductId = Number(match.id);
            }
          }

          const batchId = Date.now() + Math.floor(Math.random() * 1000);
          rawMaterialBatches.push({
            id: batchId,
            rawMaterialProductId,
            providerId,
            tropaNumber: `${item.tropa} / Garrón ${item.garron}`, // independent items
            initialWeight: item.kg,
            currentWeight: item.kg,
            costPerKg: price, // price of the dispatch
            date: Date.now(),
            priceListId: priceListId,
            isReportUploaded: false
          });
        }
      }

      // 4. Commit all writes (creation/linking of client, provider update, transactions, raw material batches, carcass status updates)
      // in a SINGLE atomic round-trip transaction.
      const carcassesToUpdate = selectedItems.map(item => {
        const cat = item.standardizedCategory || 'OTRO';
        const price = byCategory[cat].price;
        const updatedMovements = [...(item.movements || [])];
        updatedMovements.push({
          type: 'DISPATCH',
          to: dest,
          date: Date.now(),
          price: price
        });
        return {
          id: item.id,
          movements: updatedMovements
        };
      });

      await this.travelRepository.executeUnifiedDispatch(uid, {
        clientId,
        destName: dest,
        priceListId,
        isNewClient,
        shouldLinkClient,
        providerToUpdate,
        isNewProvider,
        customerTransaction,
        providerTransaction,
        rawMaterialBatches,
        carcassesToUpdate
      });

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

  async dispatchAchuras(uid, quantity, destination) {
    if (!quantity || quantity <= 0) return alert("Ingresa una cantidad válida de achuras.");
    if (!destination) return alert("Selecciona un cliente/destino.");
    
    const pricePerUnit = parseFloat(this.state.categoryPriceInputs['ACHURAS']) || 0;
    if (pricePerUnit <= 0) return alert("Debes configurar el precio de Achuras (en Configuración o ingresarlo aquí).");

    const totalAvailable = this.achurasItems.reduce((s, i) => s + (i.availableQuantity || 0), 0);
    if (quantity > totalAvailable) {
      return alert(`Stock insuficiente. Tienes ${totalAvailable} juegos disponibles.`);
    }

    const totalDebt = quantity * pricePerUnit;

    if (!confirm(`¿Confirmar SALIDA de ${quantity} juegos de achuras a "${destination}" por $${totalDebt.toLocaleString()}?`)) return;

    this.ui.showLoading();
    try {
      // 1. Consume Stock
      await this.travelRepository.consumeAchuras(uid, quantity);
      
      // 2. Generate Transaction
      const clientId = await this.clientRepository.saveClient({ name: destination });
      const transaction = {
        clientId,
        type: 'DEBT',
        amount: totalDebt,
        description: `Despacho de ${quantity} juegos de Achuras`,
        date: Date.now()
      };
      await this.clientRepository.addTransaction(transaction);

      // Refresh
      this.state.destinationInput = '';
      await this.loadFaenas(uid);
      alert("Achuras despachadas con éxito.");
    } catch (e) {
      console.error(e);
      alert(`Error al despachar achuras: ${e.message}`);
      this.ui.hideLoading();
    }
  }

  async confirmDraftGroup(groupItems, destination, draftPrices) {
    if (this.userRole !== 'ADMIN') {
       alert("Solo Administradores pueden confirmar despachos.");
       return;
    }
    this.state.selectedIds.clear();
    groupItems.forEach(i => this.state.selectedIds.add(i.id));
    this.state.destinationInput = destination || '';
    
    // Auto-set draft prices
    if (draftPrices) {
       this.state.categoryPriceInputs = { ...draftPrices };
    } else {
       this._autoSuggestPrice();
    }
    this.state.activeTab = 'STOCK';
    this.updateView();
  }

  async revertDraft(uid, id) {
    if (this.userRole !== 'ADMIN') return;
    if (!confirm("¿Revertir este despacho preparado y devolver a Stock disponible?")) return;
    this.ui.showLoading();
    try {
      await this.travelRepository.prepareFaenas(uid, [id], { status: 'AVAILABLE', destination: null, draftPrices: null, draftDate: null });
      await this.loadFaenas(uid);
    } catch(e) {
      console.error(e);
      alert(e.message);
      this.ui.hideLoading();
    }
  }

  async editCarcassCategory(id, newCategory, comment) {
    this.ui.showLoading();
    try {
      const item = this.allFaenas.find(f => f.id === id);
      if (!item) throw new Error("No se encontró el garrón seleccionado.");

      const oldCategory = item.standardizedCategory || item.category || 'OTRO';
      const commentObj = {
        date: Date.now(),
        oldCategory,
        newCategory,
        comment
      };
      
      const updatedComments = [...(item.comments || []), commentObj];

      await this.travelRepository.updateFaenaCategory(id, newCategory, updatedComments);
      await this.loadFaenas(this.currentUid);
    } catch (e) {
      console.error(e);
      alert(`Error al editar la categoría: ${e.message}`);
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

  async changeCarcassDestination(carcassId, newDestination, newPrice) {
    this.ui.showLoading();
    try {
      const allClients = await this.clientRepository.getClients();
      const matchedClient = allClients.find(c => c.name.toLowerCase() === newDestination.toLowerCase());
      
      if (matchedClient) {
        const txs = await this.clientRepository.getTransactions(matchedClient.id);
        const account = new ClientAccount(matchedClient, txs);
        const blockStatus = account.getBlockingStatus();
        if (blockStatus.isBlocked) {
          alert(`🚫 REASIGNACIÓN DENEGADA\n\nEl cliente de destino "${matchedClient.name}" tiene su cuenta suspendida por superar los límites financieros establecidos.\n\nMotivo: ${blockStatus.reason}`);
          this.ui.hideLoading();
          return;
        }
      }

      await this.travelRepository.updateCarcassDestination(this.currentUid, carcassId, newDestination, newPrice);
      await this.loadFaenas(this.currentUid);
    } catch (e) {
      console.error(e);
      alert(`Error al reasignar el destino: ${e.message}`);
      this.ui.hideLoading();
    }
  }

  updateView() {
    let stock = this.stockCache || [];
    let drafts = this.draftCache || [];
    let history = this.historyCache || [];

    const allTropas = this.allTropasCache || [];
    const finishedTropas = this.finishedTropasCache || [];

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
      drafts = drafts.filter(f => String(f.tropa || '') === this.state.tropaFilter);
      history = history.filter(f => String(f.tropa || '') === this.state.tropaFilter);
    }

    // Apply general search and sort
    stock = this._applySearchAndSort(stock, this.state.stockSearch);
    drafts = this._applySearchAndSort(drafts, this.state.stockSearch);
    history = this._applySearchAndSort(history, this.state.historyFilters.search);

    // Apply category filter
    if (this.state.categoryFilter !== 'ALL') {
      stock = stock.filter(f => f.standardizedCategory === this.state.categoryFilter);
      drafts = drafts.filter(f => f.standardizedCategory === this.state.categoryFilter);
      history = history.filter(f => f.standardizedCategory === this.state.categoryFilter);
    }

    // Apply camara filter
    if (this.state.camaraFilter !== 'ALL') {
      stock = stock.filter(f => (f.camaraId || '') === this.state.camaraFilter);
      drafts = drafts.filter(f => (f.camaraId || '') === this.state.camaraFilter);
    }

    // Calculate unassigned and camera occupancies BEFORE applying any filters so it's accurate for the total stock
    const unassignedCount = (this.stockCache || []).filter(f => !f.camaraId).length;
    const camaraOccupancy = {};
    (this.stockCache || []).forEach(f => {
      if (f.camaraId) {
        camaraOccupancy[f.camaraId] = (camaraOccupancy[f.camaraId] || 0) + 1;
      }
    });

    const faenaStockSummary = this.getStockSummary.execute({
      stockItems: stock,
      draftItems: drafts,
      achurasItems: this.achurasItems,
      selectedIds: this.state.selectedIds,
      categoryPriceInputs: this.state.categoryPriceInputs
    });

    const options = {
      state: this.state,
      stockItems: stock,
      draftItems: drafts,
      historyItems: history,
      achurasItems: this.achurasItems,
      faenaStockSummary,
      allTropas,
      finishedTropas,
      userRole: this.userRole,
      clients: this.clients,
      onTabSwitch: this.toggleTab.bind(this),
      onToggleSelection: this.toggleSelection.bind(this),
      onSelectAll: this.selectAll.bind(this),
      onClearSelection: this.clearSelection.bind(this),
      onDestinationInput: this.setDestination.bind(this),
      onDispatch: () => { this.dispatchSelected(this.currentUid); },
      onDispatchAchuras: (qty, dest) => { this.dispatchAchuras(this.currentUid, qty, dest); },
      onFilterChange: this.setHistoryFilter.bind(this),
      onToggleSort: this.toggleSort.bind(this),
      onStockSearch: this.setStockSearch.bind(this),
      onCategoryChange: this.setCategoryFilter.bind(this),
      onTropaChange: this.setTropaFilter.bind(this),
      onCategoryPriceInput: this.setCategoryPrice.bind(this),
      camarasList: this.camarasList,
      camaraOccupancy,
      unassignedCount,
      categoryPrices: this.categoryPrices,
      travels: this.travels || [],
      onCamaraChange: this.setCamaraFilter.bind(this),
      onMoveToCamara: (camaraId) => this.moveSelectedToCamara(this.currentUid, camaraId),
      onConfirmDraft: (groupItems, dest, prices) => this.confirmDraftGroup(groupItems, dest, prices),
      onRevertDraft: (id) => this.revertDraft(this.currentUid, id),
      onEditCategory: (id, newCategory, comment) => this.editCarcassCategory(id, newCategory, comment),
      onUpdateDestination: (carcassId, newDestination, newPrice) => this.changeCarcassDestination(carcassId, newDestination, newPrice),
      onSaveManualBatch: (payload) => this.saveManualStockBatch(payload)
    };

    this.ui.renderFaenaConsumption(options);
  }

  /**
   * Guarda un lote completo de medias reses ingresadas manualmente al stock.
   * @param {{ headerData: Object, items: Array<Object> }} payload 
   */
  async saveManualStockBatch(payload) {
    const { headerData, items } = payload;
    this.ui.showLoading();
    try {
      // 1. Validar si la tropa ya existe para prevenir sobreescrituras accidentales
      if (headerData.tropa) {
        const tropaExists = await this.travelRepository.checkIfTropaExists(this.currentUid, headerData.tropa);
        if (tropaExists) {
          const proceed = confirm(`⚠️ La tropa "${headerData.tropa}" ya tiene registros en el sistema. ¿Deseas continuar agregando estas medias reses?`);
          if (!proceed) {
            this.ui.hideLoading();
            return;
          }
        }
      }

      // 2. Preparar registros individuales para faenas_detalle
      const travelIdToSave = headerData.travelId || 'UNMATCHED';
      const detailRecords = items.map(item => ({
        travelId: travelIdToSave,
        isOrphan: travelIdToSave === 'UNMATCHED',
        fileName: 'MANUAL_ENTRY',
        tropa: headerData.tropa,
        garron: item.garron,
        half: item.half,
        category: item.category,
        standardizedCategory: item.category,
        kg: item.kg,
        status: 'AVAILABLE',
        camaraId: item.camaraId || null,
        producerCuit: headerData.producerCuit || '',
        producerName: headerData.producerName || 'Productor Directo',
        pdfDate: headerData.dateStr
      }));

      await this.travelRepository.saveFaenaDetalle(this.currentUid, detailRecords);

      // 3. Generar lote de achuras automáticamente si fue solicitado
      if (headerData.createAchuras && headerData.headsCount > 0) {
        await this.travelRepository.addAchurasBatch(this.currentUid, headerData.tropa, Date.now(), headerData.headsCount);
      }

      // 4. Cambiar a la pestaña de Stock Disponible y refrescar
      this.state.activeTab = 'STOCK';
      await this.loadFaenas(this.currentUid, true);
      alert(`✅ Lote de ${detailRecords.length} medias reses (Tropa ${headerData.tropa}) ingresado exitosamente a stock.`);
    } catch (e) {
      console.error("Error guardando ingreso manual:", e);
      alert("❌ Error al guardar ingreso manual de medias reses: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }
}
