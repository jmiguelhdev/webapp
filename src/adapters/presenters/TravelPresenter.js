// src/adapters/presenters/TravelPresenter.js
import { GetTravels } from '../../domain/usecases/GetTravels.js';
import { CalculateCategoryStats } from '../../domain/usecases/CalculateCategoryStats.js';

export class TravelPresenter {
  constructor(travelRepository, ui) {
    this.getTravelsUseCase = new GetTravels(travelRepository);
    this.calculateStatsUseCase = new CalculateCategoryStats();
    this.ui = ui;
    this.allTravels = [];
    this.state = {
      filter: 'TODOS',
      sort: 'DESC',
      page: 1,
      itemsPerPage: 5,
      selectedCategories: [], // Array of strings
      includeCommission: false,
      currentView: 'travels', // Tracks active view for reactive updates
      timeFilterType: 'all', // 'all', 'count', 'range'
      timeFilterValue: null,
      searchQuery: ''
    };
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

  async loadTravels(uid) {
    this.ui.showLoading();
    try {
      const raw = await this.getTravelsUseCase.execute({ uid, filter: 'TODOS', sort: 'DESC' });
      // Deduplicate by ID
      const seen = new Set();
      this.allTravels = raw.filter(t => {
        if (!t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      this.updateView();
    } catch (error) {
      this.ui.showError(error.message);
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
    this.state.searchQuery = query;
    this.state.page = 1;
    this.refresh();
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

  updateView() {
    this.state.currentView = 'travels';
    // 0. Extract Categories (from Buy entity directly)
    const completed = this.allTravels.filter(t => {
      const s = String(t.status || '').toUpperCase();
      return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
    });
    const categoriesSet = new Set();
    completed.forEach(t => {
      if (t.buy) {
        t.buy.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    const categoriesList = Array.from(categoriesSet).sort();
    const allCategories = ['TODOS', ...categoriesList];

    // 1. Filter & Sort
    let filtered = this._applyTimeFilter(this.allTravels);
    
    // Status Filter
    if (this.state.filter !== 'TODOS') {
      filtered = filtered.filter(t => {
        if (this.state.filter === 'ACTIVO') return t.status === 'ACTIVE' || t.status === 'COMPLETED';
        if (this.state.filter === 'BORRADOR') return t.status === 'DRAFT';
        return true;
      });
    }

    // Category Filter (Multi-select)
    if (this.state.selectedCategories.length > 0) {
      filtered = filtered.filter(t => {
        if (!t.buy) return false;
        // Check if ANY product in ANY producer matches ANY of the selected categories
        return t.buy.categories.some(cat => this.state.selectedCategories.includes(cat));
      });
    }

    // Smart Search Filter
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const truckName = (t.truck?.name || '').toLowerCase();
        const plate = (t.truck?.licensePlate || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const driverName = (t.driver?.name || '').toLowerCase();
        const agentName = (t.buy?.agent?.name || '').toLowerCase();
        const producersMatch = (t.buy?.listOfProducers || []).some(p => 
          (p.producer?.name || '').toLowerCase().includes(q) ||
          (p.producer?.cuit || '').toLowerCase().includes(q)
        );
        return truckName.includes(q) || plate.includes(q) || desc.includes(q) || 
               driverName.includes(q) || agentName.includes(q) || producersMatch;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return this.state.sort === 'DESC' ? dateB - dateA : dateA - dateB;
    });

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
      categoryStats,
      onFilter: (f) => this.setFilter(f),
      onSort: (s) => this.setSort(s),
      onPage: (p) => this.setPage(p),
      onCategoryToggle: (cat) => this.toggleCategory(cat),
      onCommissionToggle: (val) => this.toggleCommission(val),
      timeFilterType: this.state.timeFilterType,
      timeFilterValue: this.state.timeFilterValue,
      onTimeFilter: (type, val) => this.setTimeFilter(type, val),
      searchQuery: this.state.searchQuery,
      onSearch: (q) => this.setSearchQuery(q)
    });
  }

  showDashboard() {
    this.state.currentView = 'dashboard';
    // 0. Extract Categories
    const completed = this.allTravels.filter(t => {
      const s = String(t.status || '').toUpperCase();
      return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
    });
    const categoriesSet = new Set();
    completed.forEach(t => {
      if (t.buy && t.buy.categories) {
        t.buy.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    const categoriesList = Array.from(categoriesSet).sort();
    const allCategories = ['TODOS', ...categoriesList];

    // 1. Filter data by time and categories
    let filtered = this._applyTimeFilter(completed);
    if (this.state.selectedCategories.length > 0) {
      filtered = filtered.filter(t => 
        t.buy && t.buy.categories && t.buy.categories.some(cat => this.state.selectedCategories.includes(cat))
      );
    }

    // 2. Render Dashboard via UI Interface
    this.ui.renderDashboard({
      data: filtered,
      categories: allCategories,
      selectedCategories: this.state.selectedCategories,
      includeCommission: this.state.includeCommission,
      onCategoryToggle: (cat) => this.toggleCategory(cat),
      onCommissionToggle: (val) => this.toggleCommission(val),
      timeFilterType: this.state.timeFilterType,
      timeFilterValue: this.state.timeFilterValue,
      onTimeFilter: (type, val) => this.setTimeFilter(type, val)
    });
  }

  openExportOptions() {
    this.ui.renderExportModal({
      onExport: (options) => this.handleExport(options),
      onExcelExport: (options) => this.handleExcelExport(options)
    });
  }

  async handleExport(options) {
    const { type, value } = options;
    let toExport = this.allTravels
      .filter(t => {
        const s = String(t.status || '').toUpperCase();
        return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
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
        return t.isCompleted === true && s !== 'DRAFT' && s !== 'BORRADOR';
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
}
