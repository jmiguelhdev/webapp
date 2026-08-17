// src/adapters/presenters/TravelPresenter.js
import { GetTravels } from '../../domain/usecases/GetTravels.js';
import { CalculateCategoryStats } from '../../domain/usecases/CalculateCategoryStats.js';
import { GetStockSummary } from '../../domain/usecases/GetStockSummary.js';
import { PdfFaenaService } from '../../frameworks/services/PdfFaenaService.js';
import { SHARED_DATA_SOURCE_UID } from '../../config.js';
import { debounce } from '../../utils.js';
import { Travel } from '../../domain/entities/LogisticsModels.js';
import { Travel as CoreTravel } from '../../domain/entities/Travel.js';
import { localDb } from '../../frameworks/db/localDb.js';

/**
 * Presenter principal para la gestión de Viajes comerciales de Hacienda.
 * Coordina la visualización en tiempo real del listado, cálculo de estadísticas agregadas de rinde y simulación de márgenes.
 */
export class TravelPresenter {
  /**
   * @param {Object} travelRepository - Repositorio de viajes en Firestore.
   * @param {Object} ui - Interfaz unificada de usuario para el renderizado del DOM.
   * @param {Object} logisticsRepository - Repositorio de choferes, camiones y configuraciones logísticas.
   * @param {Object} clientRepository - Repositorio de clientes para precios y transacciones.
   */
  constructor(travelRepository, ui, logisticsRepository, clientRepository) {
    this.travelRepository = travelRepository;
    this.logisticsRepository = logisticsRepository;
    this.clientRepository = clientRepository;
    this.getTravelsUseCase = new GetTravels(travelRepository);
    this.calculateStatsUseCase = new CalculateCategoryStats();
    this.getStockSummaryUseCase = new GetStockSummary();
    this.pdfService = new PdfFaenaService();
    this.ui = ui;
    this.allTravels = [];
    this.travelsUnsubscribe = null;
    
    // Performance optimization cache for dashboard Firebase queries
    this.stockItemsCache = null;
    this.historyItemsCache = null;
    this.clientsCache = null;
    this.categoryPricesCache = null;
    // Default: last month range
    const _today = new Date();
    const _oneMonthAgo = new Date(_today);
    _oneMonthAgo.setMonth(_oneMonthAgo.getMonth() - 1);
    const _defaultStart = _oneMonthAgo.toISOString().split('T')[0];
    const _defaultEnd = _today.toISOString().split('T')[0];

    this.state = {
      filter: 'TODOS',
      sort: 'DESC',
      page: 1,
      itemsPerPage: 5,
      selectedCategories: [], // Array of strings
      includeCommission: false,
      selectedAgents: [], // Multi-select array of agent names
      selectedProducers: [], // Multi-select array of producer names
      selectedAgent: '', // backward compatibility
      selectedProducer: '', // backward compatibility
      currentView: 'dashboard', // Tracks active view for reactive updates
      timeFilterType: 'all',
      timeFilterValue: 'all',
      searchQuery: '',
      dashHistoryFilters: {
        destination: '',
        date: _today.toISOString().split('T')[0] // Default to today
      }
    };
    
    // Debounce search to prevent focus loss and flickers on every keystroke
    this.debouncedSearch = debounce((query) => {
      this.state.searchQuery = query;
      this.state.page = 1;
      this.refresh();
    }, 300);
  }

  setTimeFilter(type, value) {
    this.state.timeFilterType = type;
    this.state.timeFilterValue = value;
    this.state.page = 1;
    this.refresh();
  }

  _applyTimeFilter(travels) {
    if (this.state.timeFilterType === 'count' && this.state.timeFilterValue) {
      const sorted = [...travels].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      return sorted.slice(0, parseInt(this.state.timeFilterValue, 10) || 0);
    } else if (this.state.timeFilterType === 'range' && this.state.timeFilterValue) {
      const { start, end } = this.state.timeFilterValue;
      if (start && end) {
        return travels.filter(t => {
          const d = new Date(t.date);
          return d >= new Date(start) && d <= new Date(end);
        });
      }
    }
    return travels;
  }

  invalidateDashboardCache() {
    this.stockItemsCache = null;
    this.historyItemsCache = null;
    this.clientsCache = null;
    this.categoryPricesCache = null;
  }

  processTravelEntities(travels) {
    this.invalidateDashboardCache();
    
    // Deduplicate by ID and instantiate core Travel entities
    const seen = new Set();
    this.allTravels = travels.map(t => t instanceof CoreTravel ? t : new CoreTravel(t)).filter(t => {
      if (!t || !t.id || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    // Cache completed travels and their categories to prevent recalculation on every filter change
    this.completedTravelsCache = this.allTravels.filter(t => {
      const s = String(t.status || '').toUpperCase();
      const isComp = t.isCompleted === true || s === 'COMPLETED' || s === 'FINALIZADO' || s === 'ACTIVE' || s === 'ACTIVO';
      return isComp && s !== 'DRAFT' && s !== 'BORRADOR';
    });

    const categoriesSet = new Set();
    this.completedTravelsCache.forEach(t => {
      if (t.buy && t.buy.categories) {
        t.buy.categories.forEach(cat => {
          if (cat) categoriesSet.add(cat);
        });
      }
    });
    this.allCategoriesCache = ['TODOS', ...Array.from(categoriesSet).sort()];
  }

  // Backwards compatibility shim
  processRawTravels(raw) {
    this.processTravelEntities(raw);
  }

  async loadTravels(uid) {
    this.ui.showLoading();
    try {
      this.invalidateDashboardCache();
      
      // 1. Initial Local Read from IndexedDB via Clean Architecture Use Case (Local-First fast boot)
      const travels = await this.getTravelsUseCase.execute({
        uid,
        filter: 'TODOS',
        sort: this.state.sort
      });
      this.processTravelEntities(travels);
      this.ui.hideLoading();
      this.refresh();
    } catch (error) {
      console.error("Critical error in loadTravels setup:", error);
      this.ui.showError(error.message);
      this.ui.hideLoading();
    }
  }

  setFilter(filter) {
    this.state.filter = filter;
    this.state.page = 1;
    this.refresh();
  }

  setSort(sort) {
    this.state.sort = sort;
    this.refresh();
  }

  setPage(page) {
    this.state.page = page;
    this.refresh();
  }

  setSearchQuery(query) {
    // Immediate update for the UI input value (to avoid lag) but debounced refresh
    this.state.searchQuery = query; 
    this.debouncedSearch(query);
  }

  setAgentsFilter(agents) {
    this.state.selectedAgents = Array.isArray(agents) ? agents.filter(Boolean) : (agents ? [agents] : []);
    this.state.selectedAgent = this.state.selectedAgents[0] || '';
    this._validateAndCleanProducers();
    this.state.page = 1;
    this.refresh();
  }

  toggleAgentFilter(agent) {
    if (!agent || agent === 'ALL') {
      this.state.selectedAgents = [];
    } else {
      const idx = this.state.selectedAgents.indexOf(agent);
      if (idx === -1) {
        this.state.selectedAgents.push(agent);
      } else {
        this.state.selectedAgents.splice(idx, 1);
      }
    }
    this.state.selectedAgent = this.state.selectedAgents[0] || '';
    this._validateAndCleanProducers();
    this.state.page = 1;
    this.refresh();
  }

  setProducersFilter(producers) {
    this.state.selectedProducers = Array.isArray(producers) ? producers.filter(Boolean) : (producers ? [producers] : []);
    this.state.selectedProducer = this.state.selectedProducers[0] || '';
    this.state.page = 1;
    this.refresh();
  }

  toggleProducerFilter(producer) {
    if (!producer || producer === 'ALL') {
      this.state.selectedProducers = [];
    } else {
      const idx = this.state.selectedProducers.indexOf(producer);
      if (idx === -1) {
        this.state.selectedProducers.push(producer);
      } else {
        this.state.selectedProducers.splice(idx, 1);
      }
    }
    this.state.selectedProducer = this.state.selectedProducers[0] || '';
    this.state.page = 1;
    this.refresh();
  }

  setAgentFilter(agent) {
    if (!agent || agent === 'ALL') {
      this.state.selectedAgents = [];
    } else {
      this.state.selectedAgents = [agent];
    }
    this.state.selectedAgent = agent || '';
    this._validateAndCleanProducers();
    this.state.page = 1;
    this.refresh();
  }

  setProducerFilter(producer) {
    if (!producer || producer === 'ALL') {
      this.state.selectedProducers = [];
    } else {
      this.state.selectedProducers = [producer];
    }
    this.state.selectedProducer = producer || '';
    this.state.page = 1;
    this.refresh();
  }

  _validateAndCleanProducers() {
    if (this.state.selectedAgents.length > 0 && this.state.selectedProducers.length > 0) {
      const activeAgentsLower = this.state.selectedAgents.map(a => a.trim().toLowerCase());
      this.state.selectedProducers = this.state.selectedProducers.filter(prodName => {
        const prodLower = prodName.trim().toLowerCase();
        return this.allTravels.some(t => {
          const ag = (t.buy?.agent?.name || '').trim().toLowerCase();
          if (!activeAgentsLower.includes(ag)) return false;
          return (t.buy?.listOfProducers || []).some(p => {
            const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
            const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
            return pName === prodLower || pCuit === prodLower;
          });
        });
      });
      this.state.selectedProducer = this.state.selectedProducers[0] || '';
    }
  }

  toggleCategory(category) {
    if (category === 'TODOS') {
      this.state.selectedCategories = [];
    } else {
      const index = this.state.selectedCategories.indexOf(category);
      if (index === -1) {
        this.state.selectedCategories.push(category);
      } else {
        this.state.selectedCategories.splice(index, 1);
      }
    }
    this.state.page = 1;
    this.refresh();
  }

  toggleCommission(val) {
    this.state.includeCommission = val;
    this.refresh();
  }

  refresh() {
    if (this.state.currentView === 'dashboard') {
      this.showDashboard();
    } else {
      this.updateView();
    }
  }

  showTravelDetail(travelId) {
    this.state.filter = 'TODOS';
    this.state.selectedCategories = [];
    this.state.selectedAgent = '';
    this.state.selectedProducer = '';
    this.state.searchQuery = String(travelId);
    this.state.page = 1;
    this.state.currentView = 'travels';
    
    const sidebar = document.getElementById('kmp-sidebar');
    if (sidebar) {
      sidebar.setAttribute('active', 'travels');
    }
    
    if (this.ui && typeof this.ui.navigateTo === 'function') {
      this.ui.navigateTo('travels');
    } else {
      this.updateView();
    }
  }

  async updateView() {
    this.state.currentView = 'travels';
    
    const allCategories = this.allCategoriesCache || ['TODOS'];

    // 1. Filter & Sort via Clean Architecture Use Case
    let filtered = await this.getTravelsUseCase.execute({
      uid: SHARED_DATA_SOURCE_UID,
      filter: this.state.filter,
      sort: this.state.sort
    });
    
    // Apply time filter
    filtered = this._applyTimeFilter(filtered);

    // Category Filter (Multi-select)
    if (this.state.selectedCategories.length > 0) {
      filtered = filtered.filter(t => {
        if (!t.buy) return false;
        // Check if ANY product in ANY producer matches ANY of the selected categories
        return t.buy.categories.some(cat => this.state.selectedCategories.includes(cat));
      });
    }

    // Filter by Comisionistas / Agentes (Multi-select)
    if (this.state.selectedAgents && this.state.selectedAgents.length > 0) {
      const activeAgentsLower = this.state.selectedAgents.map(a => a.trim().toLowerCase());
      filtered = filtered.filter(t => activeAgentsLower.includes((t.buy?.agent?.name || '').trim().toLowerCase()));
    } else if (this.state.selectedAgent && this.state.selectedAgent !== 'ALL') {
      const targetAgent = this.state.selectedAgent.trim().toLowerCase();
      filtered = filtered.filter(t => (t.buy?.agent?.name || '').trim().toLowerCase() === targetAgent);
    }

    // Filter by Productores (Multi-select)
    if (this.state.selectedProducers && this.state.selectedProducers.length > 0) {
      const activeProdsLower = this.state.selectedProducers.map(p => p.trim().toLowerCase());
      const activeProdsDigits = activeProdsLower.map(p => p.replace(/\D/g, '')).filter(d => d.length > 3);
      filtered = filtered.filter(t => (t.buy?.listOfProducers || []).some(p => {
        const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
        const pCuitDigits = pCuit.replace(/\D/g, '');
        return activeProdsLower.includes(pName) || activeProdsLower.includes(pCuit) || 
               activeProdsDigits.some(d => pCuitDigits.includes(d));
      }));
    } else if (this.state.selectedProducer && this.state.selectedProducer !== 'ALL') {
      const targetProd = this.state.selectedProducer.trim().toLowerCase();
      const targetProdDigits = targetProd.replace(/\D/g, '');
      filtered = filtered.filter(t => (t.buy?.listOfProducers || []).some(p => {
        const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
        const pCuitDigits = pCuit.replace(/\D/g, '');
        return pName === targetProd || (targetProdDigits.length > 3 && pCuitDigits.includes(targetProdDigits)) || pCuit === targetProd;
      }));
    }

    // Smart Universal Search Filter
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      filtered = filtered.filter(t => {
        const travelId = String(t.id).toLowerCase();
        if (travelId === q || travelId.includes(q)) return true;

        const truckName = (t.truck?.name || '').toLowerCase();
        const plate = (t.truck?.licensePlate || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const driverName = (t.truck?.driver?.name || t.driver?.name || '').toLowerCase();
        const agentName = (t.buy?.agent?.name || '').toLowerCase();
        const tropa = String(t.tropa || t.buy?.tropa || '').toLowerCase();
        const producersMatch = (t.buy?.listOfProducers || []).some(p => {
          const pName = (p.producer?.name || p.name || '').toLowerCase();
          const pCuit = String(p.producer?.cuit || p.cuit || '').toLowerCase();
          const pOrigin = (p.origin || '').toLowerCase();
          return pName.includes(q) || pCuit.includes(q) || (qDigits.length > 3 && pCuit.replace(/\D/g, '').includes(qDigits)) || pOrigin.includes(q);
        });

        return truckName.includes(q) || plate.includes(q) || desc.includes(q) || 
               driverName.includes(q) || agentName.includes(q) || tropa.includes(q) || producersMatch;
      });
    }

    // Compilar listas únicas de comisionistas y productores (en cascada según los comisionistas seleccionados)
    const agentsMap = new Map();
    const producersMap = new Map();
    const activeAgentsLower = (this.state.selectedAgents || []).map(a => a.trim().toLowerCase());
    if (activeAgentsLower.length === 0 && this.state.selectedAgent && this.state.selectedAgent !== 'ALL') {
      activeAgentsLower.push(this.state.selectedAgent.trim().toLowerCase());
    }

    this.allTravels.forEach(t => {
      const agentName = (t.buy?.agent?.name || '').trim();
      if (agentName) {
        agentsMap.set(agentName, (agentsMap.get(agentName) || 0) + 1);
      }

      const matchesSelectedAgents = activeAgentsLower.length === 0 || 
        activeAgentsLower.includes(agentName.toLowerCase());

      if (matchesSelectedAgents) {
        (t.buy?.listOfProducers || []).forEach(p => {
          const pName = (p.producer?.name || p.name || '').trim();
          const pCuit = String(p.producer?.cuit || p.cuit || '').trim();
          if (pName) {
            producersMap.set(pName, { name: pName, cuit: pCuit });
          }
        });
      }
    });

    const uniqueAgents = Array.from(agentsMap.keys()).sort((a, b) => a.localeCompare(b));
    const uniqueProducers = Array.from(producersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // KPIs consolidados del conjunto de viajes filtrados
    const totalHeads = filtered.reduce((sum, t) => sum + (t.buy?.totalQuantity || 0), 0);
    const totalKgClean = filtered.reduce((sum, t) => sum + (t.buy?.totalKgClean || 0), 0);
    const totalKgFaena = filtered.reduce((sum, t) => sum + (t.buy?.totalKgFaena || 0), 0);
    const totalOperation = filtered.reduce((sum, t) => sum + (t.buy?.totalOperation || 0), 0);
    const totalOperationWithComm = filtered.reduce((sum, t) => sum + (t.buy?.totalOperationWithCommission || 0), 0);
    const avgYield = totalKgClean > 0 ? (totalKgFaena / totalKgClean) : 0;

    const summaryStats = {
      totalTravels: filtered.length,
      totalHeads,
      totalKgClean,
      totalKgFaena,
      totalOperation,
      totalOperationWithComm,
      avgYield
    };

    // 2. Stats
    const categoryStats = this.calculateStatsUseCase.execute(
      filtered, 
      this.state.selectedCategories, 
      this.state.includeCommission
    );

    // 3. Paginate
    const totalItems = filtered.length;
    const start = (this.state.page - 1) * this.state.itemsPerPage;
    const paginated = filtered.slice(start, start + this.state.itemsPerPage);

    this.ui.renderTravels({
      data: paginated,
      totalItems,
      currentPage: this.state.page,
      itemsPerPage: this.state.itemsPerPage,
      currentFilter: this.state.filter,
      currentSort: this.state.sort,
      categories: allCategories,
      selectedCategories: this.state.selectedCategories,
      includeCommission: this.state.includeCommission,
      
      // Entity Filters & Handlers
      agents: uniqueAgents,
      producers: uniqueProducers,
      selectedAgent: this.state.selectedAgent,
      selectedProducer: this.state.selectedProducer,
      selectedAgents: this.state.selectedAgents,
      selectedProducers: this.state.selectedProducers,
      summaryStats,
      categoryStats,
      onFilter: (f) => this.setFilter(f),
      onSort: (s) => this.setSort(s),
      onPage: (p) => this.setPage(p),
      onCategoryToggle: (cat) => this.toggleCategory(cat),
      onCommissionToggle: (val) => this.toggleCommission(val),
      onAgentChange: (agent) => this.setAgentFilter(agent),
      onProducerChange: (producer) => this.setProducerFilter(producer),
      timeFilterType: this.state.timeFilterType,
      timeFilterValue: this.state.timeFilterValue,
      onTimeFilter: (type, val) => this.setTimeFilter(type, val),
      searchQuery: this.state.searchQuery,
      onSearch: (q) => this.setSearchQuery(q),
      onPdfUpload: (file) => this.handlePdfFaenaUpload(file, SHARED_DATA_SOURCE_UID),
      onScanDirectory: (files) => this.handleScanDirectory(SHARED_DATA_SOURCE_UID, files),
      onReduceUpdate: (id, val) => this.handleReduceUpdate(SHARED_DATA_SOURCE_UID, id, val),
      onProducerSettlement: (travel, producer) => this.handleProducerSettlement(travel, producer),
      onAddTravel: () => this.openTravelModal(),
      onEditTravel: (travel) => this.openTravelModal(travel),
      onDeleteTravel: (id) => this.handleDeleteTravel(id)
    });
  }

  async openTravelModal(travel = null) {
    try {
      this.ui.showLoading();
      // Load trucks, producers and agents in parallel for the multi-tab editor
      const [rawTrucks, rawProducers, rawAgents] = await Promise.all([
        this.logisticsRepository.getTrucks(),
        this.logisticsRepository.getProducers(),
        this.logisticsRepository.getAgents()
      ]);
      this.ui.hideLoading();
      
      this.ui.showTravelModal(travel, {
        trucks: rawTrucks,
        producers: rawProducers,
        agents: rawAgents,
        onSaveTravel: (payload) => this.handleSaveTravel(payload),
        onCancel: () => this.updateView()
      });
    } catch (e) {
      this.ui.hideLoading();
      this.ui.showError("Error al cargar datos del formulario: " + e.message);
    }
  }

  async handleSaveTravel(payload) {
    try {
      this.ui.showLoading();
      
      const travel = new Travel(payload);

      if (!travel.driverPricePerKmSimple) {
        const config = await this.logisticsRepository.getAppConfig();
        travel.driverPricePerKmSimple = config.defaultDriverPricePerKmSimple || 0;
        travel.driverPricePerKmDouble = config.defaultDriverPricePerKmDouble || 0;
        travel.simulationFreightPriceSimple = config.simulationFreightPriceSimple || 0;
        travel.simulationFreightPriceDouble = config.simulationFreightPriceDouble || 0;
        travel.fuelPrice = config.fuelPrice || 0;
      }

      await this.travelRepository.saveTravel(SHARED_DATA_SOURCE_UID, travel);
      
      // Local reload for 0ms visual updates
      const travels = await this.getTravelsUseCase.execute({
        uid: SHARED_DATA_SOURCE_UID,
        filter: 'TODOS',
        sort: this.state.sort
      });
      this.processTravelEntities(travels);
      this.refresh();
      this.ui.hideLoading();
    } catch (e) {
      this.ui.hideLoading();
      this.ui.showError("Error al guardar viaje: " + e.message);
    }
  }

  async handleDeleteTravel(id) {
    try {
      this.ui.showLoading();
      await this.travelRepository.deleteTravel(SHARED_DATA_SOURCE_UID, id);
      
      // Local reload for 0ms visual updates
      const travels = await this.getTravelsUseCase.execute({
        uid: SHARED_DATA_SOURCE_UID,
        filter: 'TODOS',
        sort: this.state.sort
      });
      this.processTravelEntities(travels);
      this.refresh();
      this.ui.hideLoading();
    } catch (e) {
      this.ui.hideLoading();
      this.ui.showError("Error al eliminar viaje: " + e.message);
    }
  }

  async handleReduceUpdate(uid, travelId, newValue) {
    const travel = this.allTravels.find(t => t.id === travelId);
    if (!travel) return;
    
    // Update local state
    if (!travel.buy) travel.buy = {};
    travel.buy.reduce = newValue;
    
    // Persist to Firebase
    try {
      const updatedRaw = JSON.parse(JSON.stringify(travel._raw || travel));
      if (!updatedRaw.buy) updatedRaw.buy = {};
      updatedRaw.buy.reduce = newValue;
      updatedRaw.reduce = newValue; // Picked up by updated Travel.js constructor 
      
      await this.travelRepository.updateTravel(uid, travelId, updatedRaw);
      
      // Local reload for 0ms visual updates
      const travels = await this.getTravelsUseCase.execute({
        uid,
        filter: 'TODOS',
        sort: this.state.sort
      });
      this.processTravelEntities(travels);
      this.refresh();
    } catch (error) {
      this.ui.showError("Error al actualizar achique: " + error.message);
    }
  }

  handleProducerSettlement(travel, producer) {
    // Open the modal via UI
    this.ui.renderSettlementModal(travel, producer, {
      onUpdateSettlement: (tid, pCuit, updates, mIva) => this.handleSettlementUpdate(SHARED_DATA_SOURCE_UID, tid, pCuit, updates, mIva)
    });
  }

  async handleSettlementUpdate(uid, travelId, producerCuit, productUpdates, manualIvaValue) {
    this.ui.showLoading();
    try {
      const travel = this.allTravels.find(t => t.id === travelId);
      if (!travel) throw new Error("Viaje no encontrado");
      
      const updatedRaw = JSON.parse(JSON.stringify(travel._raw || travel));
      const rawProducers = updatedRaw.buy?.listOfProducers || [];
      const targetCuit = String(producerCuit || '').replace(/\D/g, '');
      const producer = rawProducers.find(p => {
        // KMP stores cuit directly on producer (p.cuit), possibly as a number
        // Web app legacy stores it nested (p.producer.cuit)
        const pCuit = String(p.cuit || p.producer?.cuit || '').replace(/\D/g, '');
        return pCuit === targetCuit && targetCuit.length > 0;
      });
      
      if (!producer) throw new Error("Productor no encontrado en el viaje");
      
      productUpdates.forEach(upd => {
        const pr = producer.listOfProducts[upd.index];
        if (pr) {
          pr.price = upd.price;
          pr.roughing = upd.roughing;
        }
      });

      producer.manualIva = manualIvaValue;
      
      await this.travelRepository.updateTravel(uid, travelId, updatedRaw);
      
      // Local reload for 0ms visual updates
      const travels = await this.getTravelsUseCase.execute({
        uid,
        filter: 'TODOS',
        sort: this.state.sort
      });
      this.processTravelEntities(travels);
      this.refresh();
      this.ui.showLoading(false);
    } catch (error) {
      this.ui.showError("Error al guardar liquidación: " + error.message);
      this.ui.hideLoading();
    }
  }

  async showDashboard() {
    this.state.currentView = 'dashboard';
    
    const completed = this.completedTravelsCache || [];
    const allCategories = this.allCategoriesCache || ['TODOS'];

    // 1. Load Stock and Dispatch data first with lazy memory caching to resolve filter lag
    if (!this.stockItemsCache || !this.categoryPricesCache || !this.clientsCache) {
      try {
        const [allFaenaData, catsRes] = await Promise.all([
          this.travelRepository.getFaenaStock(SHARED_DATA_SOURCE_UID),
          this.clientRepository.getCategoryPrices()
        ]);
        this.categoryPricesCache = catsRes || {};
        this.stockItemsCache = allFaenaData.filter(f => f.status === 'AVAILABLE');
        this.historyItemsCache = allFaenaData.filter(f => f.status === 'DISPATCHED');
        this.clientsCache = await this.clientRepository.getClients();
      } catch (e) {
        console.error("Error loading dashboard extended data:", e);
      }
    }

    const stockItems = this.stockItemsCache || [];
    const historyItems = this.historyItemsCache || [];
    const clients = this.clientsCache || [];
    const categoryPrices = this.categoryPricesCache || {};

    // 2. Filter travels data by time, categories, agents, producers, and search query
    let filtered = this._applyTimeFilter(completed);
    
    if (this.state.selectedCategories.length > 0) {
      filtered = filtered.filter(t => 
        t.buy && t.buy.categories && t.buy.categories.some(cat => this.state.selectedCategories.includes(cat))
      );
    }

    // Filter by Comisionistas / Agentes (Multi-select)
    if (this.state.selectedAgents && this.state.selectedAgents.length > 0) {
      const activeAgentsLower = this.state.selectedAgents.map(a => a.trim().toLowerCase());
      filtered = filtered.filter(t => activeAgentsLower.includes((t.buy?.agent?.name || '').trim().toLowerCase()));
    } else if (this.state.selectedAgent && this.state.selectedAgent !== 'ALL') {
      const targetAgent = this.state.selectedAgent.trim().toLowerCase();
      filtered = filtered.filter(t => (t.buy?.agent?.name || '').trim().toLowerCase() === targetAgent);
    }

    // Filter by Productores (Multi-select)
    if (this.state.selectedProducers && this.state.selectedProducers.length > 0) {
      const activeProdsLower = this.state.selectedProducers.map(p => p.trim().toLowerCase());
      const activeProdsDigits = activeProdsLower.map(p => p.replace(/\D/g, '')).filter(d => d.length > 3);
      filtered = filtered.filter(t => (t.buy?.listOfProducers || []).some(p => {
        const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
        const pCuitDigits = pCuit.replace(/\D/g, '');
        return activeProdsLower.includes(pName) || activeProdsLower.includes(pCuit) || 
               activeProdsDigits.some(d => pCuitDigits.includes(d));
      }));
    } else if (this.state.selectedProducer && this.state.selectedProducer !== 'ALL') {
      const targetProd = this.state.selectedProducer.trim().toLowerCase();
      const targetProdDigits = targetProd.replace(/\D/g, '');
      filtered = filtered.filter(t => (t.buy?.listOfProducers || []).some(p => {
        const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
        const pCuitDigits = pCuit.replace(/\D/g, '');
        return pName === targetProd || (targetProdDigits.length > 3 && pCuitDigits.includes(targetProdDigits)) || pCuit === targetProd;
      }));
    }

    // Smart Search Query Filter
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');
      filtered = filtered.filter(t => {
        const travelId = String(t.id).toLowerCase();
        if (travelId === q || travelId.includes(q)) return true;

        const truckName = (t.truck?.name || '').toLowerCase();
        const plate = (t.truck?.licensePlate || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const driverName = (t.truck?.driver?.name || t.driver?.name || '').toLowerCase();
        const agentName = (t.buy?.agent?.name || '').toLowerCase();
        const tropa = String(t.tropa || t.buy?.tropa || '').toLowerCase();
        const producersMatch = (t.buy?.listOfProducers || []).some(p => {
          const pName = (p.producer?.name || p.name || '').toLowerCase();
          const pCuit = String(p.producer?.cuit || p.cuit || '').toLowerCase();
          const pOrigin = (p.origin || '').toLowerCase();
          return pName.includes(q) || pCuit.includes(q) || (qDigits.length > 3 && pCuit.replace(/\D/g, '').includes(qDigits)) || pOrigin.includes(q);
        });

        return truckName.includes(q) || plate.includes(q) || desc.includes(q) || 
               driverName.includes(q) || agentName.includes(q) || tropa.includes(q) || producersMatch;
      });
    }

    // Compilar listas de agentes y productores (en cascada según comisionistas seleccionados)
    const agentsMap = new Map();
    const producersMap = new Map();
    const activeAgentsLower = (this.state.selectedAgents || []).map(a => a.trim().toLowerCase());
    if (activeAgentsLower.length === 0 && this.state.selectedAgent && this.state.selectedAgent !== 'ALL') {
      activeAgentsLower.push(this.state.selectedAgent.trim().toLowerCase());
    }

    this.allTravels.forEach(t => {
      const agentName = (t.buy?.agent?.name || '').trim();
      if (agentName) {
        agentsMap.set(agentName, (agentsMap.get(agentName) || 0) + 1);
      }

      const matchesSelectedAgents = activeAgentsLower.length === 0 || 
        activeAgentsLower.includes(agentName.toLowerCase());

      if (matchesSelectedAgents) {
        (t.buy?.listOfProducers || []).forEach(p => {
          const pName = (p.producer?.name || p.name || '').trim();
          const pCuit = String(p.producer?.cuit || p.cuit || '').trim();
          if (pName) {
            producersMap.set(pName, { name: pName, cuit: pCuit });
          }
        });
      }
    });
    const uniqueAgents = Array.from(agentsMap.keys()).sort((a, b) => a.localeCompare(b));
    const uniqueProducers = Array.from(producersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // 3. Calculate KPI stats with categoryPrices
    const categoryStats = this.calculateStatsUseCase.execute(
      filtered,
      this.state.selectedCategories,
      this.state.includeCommission,
      categoryPrices
    );

    // 4. Calculate stock totals using domain GetStockSummary
    const stockSummary = this.getStockSummaryUseCase.execute({
      stockItems,
      draftItems: [],
      achurasItems: [],
      selectedIds: new Set(),
      categoryPriceInputs: {}
    });

    // 5. Render Dashboard via UI Interface
    this.ui.renderDashboard({
      data: filtered,
      categories: allCategories,
      selectedCategories: this.state.selectedCategories,
      includeCommission: this.state.includeCommission,
      categoryStats,
      
      // Stock & Dispatch data
      stockTotals: stockSummary.stockTotals,
      historyItems,
      clients,
      categoryPrices,
      dashHistoryFilters: this.state.dashHistoryFilters,

      // Filter state & handlers
      agents: uniqueAgents,
      producers: uniqueProducers,
      selectedAgent: this.state.selectedAgent,
      selectedProducer: this.state.selectedProducer,
      selectedAgents: this.state.selectedAgents,
      selectedProducers: this.state.selectedProducers,
      searchQuery: this.state.searchQuery,
      onAgentChange: (agent) => this.setAgentFilter(agent),
      onProducerChange: (producer) => this.setProducerFilter(producer),
      onAgentToggle: (agent) => this.toggleAgentFilter(agent),
      onProducerToggle: (producer) => this.toggleProducerFilter(producer),
      onAgentsChange: (agents) => this.setAgentsFilter(agents),
      onProducersChange: (producers) => this.setProducersFilter(producers),
      onSearch: (q) => this.setSearchQuery(q),

      onCategoryToggle: (cat) => this.toggleCategory(cat),
      onCommissionToggle: (val) => this.toggleCommission(val),
      onShowTravelDetail: (travelId) => this.showTravelDetail(travelId),
      timeFilterType: this.state.timeFilterType,
      timeFilterValue: this.state.timeFilterValue,
      onTimeFilter: (type, val) => this.setTimeFilter(type, val),
      
      // Dashboard-specific handlers
      onDashHistoryFilter: (key, val) => {
        this.state.dashHistoryFilters[key] = val;
        this.showDashboard(); // Re-render
      }
    });
  }

  openExportOptions() {
    this.ui.renderExportModal({
      onExport: (options) => this.handleExport(options),
      onExcelExport: (options) => this.handleExcelExport(options)
    });
  }

  async handleScanDirectory(uid, filesArray) {
    if (!filesArray || filesArray.length === 0) return;

    this.ui.showLoading();
    try {
      let newCount = 0;
      let matchedCount = 0;
      let unmatchedCount = 0;
      let existCount = 0;
      let errorCount = 0;
      let errorMessages = [];

      for (const file of filesArray) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          try {
            const result = await this.handlePdfFaenaUpload(file, uid, true);
            if (result.skipped) {
              existCount++;
            } else {
              newCount++;
              if (result.matched) matchedCount++;
              else unmatchedCount++;
            }
          } catch (e) {
            console.error(`Error procesando ${file.name}:`, e);
            errorMessages.push(`- ${file.name}: ${e.stack || e.message}`);
            errorCount++;
          }
        }
      }

      await this.loadTravels(uid);
      
      this.ui.renderScanResultsModal({
        newCount,
        matchedCount,
        unmatchedCount,
        existCount,
        errorCount,
        errorMessages
      });

    } catch (e) {
      console.error(e);
    } finally {
      this.updateView();
    }
  }

  async handleExport(options) {
    const { type, value } = options;
    let toExport = this.allTravels
      .filter(t => {
        const s = String(t.status || '').toUpperCase();
        const isComp = t.isCompleted === true || s === 'COMPLETED' || s === 'FINALIZADO' || s === 'ACTIVE' || s === 'ACTIVO';
        return isComp && s !== 'DRAFT' && s !== 'BORRADOR';
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (type === 'count') {
      toExport = toExport.slice(0, parseInt(value));
    } else if (type === 'range') {
      const { start, end } = value;
      toExport = toExport.filter(t => {
        const d = new Date(t.date);
        return d >= new Date(start) && d <= new Date(end);
      });
    }

    this.ui.generateTravelReport(toExport);
  }

  async handleExcelExport(options) {
    const { type, value } = options;
    let toExport = this.allTravels
      .filter(t => {
        const s = String(t.status || '').toUpperCase();
        const isComp = t.isCompleted === true || s === 'COMPLETED' || s === 'FINALIZADO' || s === 'ACTIVE' || s === 'ACTIVO';
        return isComp && s !== 'DRAFT' && s !== 'BORRADOR';
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (type === 'count') {
      toExport = toExport.slice(0, parseInt(value));
    } else if (type === 'range') {
      const { start, end } = value;
      toExport = toExport.filter(t => {
        const d = new Date(t.date);
        return d >= new Date(start) && d <= new Date(end);
      });
    }

    this.ui.generateExcelReport(toExport);
  }

  async handlePdfFaenaUpload(file, uid, isBulk = false) {
    if (!isBulk) this.ui.showLoading();
    try {
      // 1. Check for duplicates early using the file name
      const alreadyExists = await this.travelRepository.checkIfFaenaExists(uid, file.name);
      if (alreadyExists) {
        if (!isBulk) {
          alert(`⚠️ El archivo "${file.name}" ya fue procesado anteriormente.`);
          this.updateView();
        }
        return { skipped: true, fileName: file.name };
      }

      const pdfData = await this.pdfService.parse(file);
      console.log("PDF Data Extracted:", pdfData);

      if (!pdfData.producer.cuit) {
        throw new Error(`[${file.name}] No se pudo encontrar el CUIT del productor en el PDF.`);
      }

      // Convert PDF date (dd/mm/yyyy) to Date object
      const [d, m, y] = pdfData.date.split('/');
      const pdfDate = new Date(`${y}-${m}-${d}`);

      // 2. Extra Validation: Deep check using Tropa number to prevent duplicates reliably
      if (pdfData.tropa) {
        const tropaExists = await this.travelRepository.checkIfTropaExists(uid, pdfData.tropa);
        if (tropaExists) {
          if (!isBulk) {
            alert(`⚠️ La tropa "${pdfData.tropa}" ya fue procesada anteriormente.`);
            this.updateView();
          }
          return { skipped: true, fileName: file.name };
        }
      }

      // Find matching travel
      const match = this.allTravels.find(t => {
        // A. Prioritize matching by Tropa number if both exist
        if (t.tropa && pdfData.tropa && String(t.tropa).trim() === String(pdfData.tropa).trim()) {
          return true;
        }

        // B. If both have tropa numbers but they are different, they do NOT match (no fallback)
        if (t.tropa && pdfData.tropa && String(t.tropa).trim() !== String(pdfData.tropa).trim()) {
          return false;
        }

        // B. Fallback to CUIT + Date range matching (+/- 7 days)
        const hasProducer = (t.buy?.listOfProducers || []).some(p => {
          const pCuit = (p.producer?.cuit || '').replace(/\D/g, '');
          const targetCuit = pdfData.producer.cuit.replace(/\D/g, '');
          return pCuit === targetCuit;
        });

        if (!hasProducer) return false;

        // 2. Check Date Range (+/- 7 days)
        const tDate = new Date(t.date);
        const diffTime = Math.abs(pdfDate - tDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 7;
      });

      if (!match) {
        console.warn(`[${file.name}] No se encontró un viaje para el productor con CUIT ${pdfData.producer.cuit} cerca de la fecha ${pdfData.date}. Guardando como faena huérfana.`);
      } else {
        console.log("Matching Travel Found:", match);
        // Create a deep copy to modify using the RAW backend data to prevent dropping fields
        const updatedTravel = JSON.parse(JSON.stringify(match._raw || match));
        const firebaseId = String(updatedTravel.id || updatedTravel.firebaseId || match.id);
        delete updatedTravel.firebaseId; // Metadata cleanup

        // Update kgFaena in the matching producer
        const producer = updatedTravel.buy.listOfProducers.find(p => {
          const pCuit = (p.producer?.cuit || '').replace(/\D/g, '');
          const targetCuit = pdfData.producer.cuit.replace(/\D/g, '');
          return pCuit === targetCuit;
        });

        if (producer) {
          // Update individual products if categories match
          producer.listOfProducts.forEach(pr => {
            const categoryMatchedItems = pdfData.items.filter(item => item.standardizedCategory === pr.standardizedCategory);
            if (categoryMatchedItems.length > 0) {
              const totalCatKg = categoryMatchedItems.reduce((sum, item) => sum + item.kg, 0);
              pr.kgFaena = totalCatKg;
            }
          });

          // Update summaries
          updatedTravel.buy.kgFaenaGlobal = pdfData.totalKgFaena;
          updatedTravel.kgFaenaTotal = pdfData.totalKgFaena;
        }

        // 1. Save updated travel
        await this.travelRepository.updateTravel(uid, firebaseId, updatedTravel);
      }

      // 2. Save detailed records (Garrones) to new collection
      const travelIdToSave = match ? String(match.id || match.firebaseId || match._raw?.id || '') : 'UNMATCHED';
      const detailRecords = pdfData.items.map(item => ({
        travelId: travelIdToSave,
        isOrphan: !match,
        fileName: file.name, // Save for deduplication
        tropa: pdfData.tropa,
        garron: item.garron,
        half: item.half,
        category: item.category,
        standardizedCategory: item.standardizedCategory,
        kg: item.kg,
        status: 'AVAILABLE', // Default logic for Stock
        producerCuit: pdfData.producer.cuit,
        producerName: pdfData.producer.name,
        pdfDate: pdfData.date
      }));
      await this.travelRepository.saveFaenaDetalle(uid, detailRecords);

      // Generate Achuras Stock based on head count
      if (pdfData.totalHeadCount > 0) {
        await this.travelRepository.addAchurasBatch(uid, pdfData.tropa, Date.now(), pdfData.totalHeadCount);
      }

      if (!isBulk) {
        // 3. Refresh display only if not bulk (bulk refreshes once at the end)
        await this.loadTravels(uid);
        if (!match) {
          alert(`⚠️ Faena procesada: ${pdfData.totalKgFaena} kg. SIN VIAJE ASIGNADO (Huérfana).`);
        } else {
          alert(`✅ Faena procesada con éxito: ${pdfData.totalKgFaena} kg, ${pdfData.totalHeadCount} cabezas.`);
        }
      }
      return { success: true, matched: !!match, fileName: file.name };

    } catch (error) {
      console.error(error);
      if (!isBulk) {
        alert(`❌ Error al procesar PDF: ${error.message}`);
        this.updateView();
      }
      throw error;
    }
  }
}
