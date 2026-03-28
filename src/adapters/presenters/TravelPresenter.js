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
      currentView: 'travels' // Tracks active view for reactive updates
    };
  }

  async loadTravels(uid) {
    this.ui.showLoading();
    try {
      this.allTravels = await this.getTravelsUseCase.execute({ uid, filter: 'TODOS', sort: 'DESC' });
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
    const completed = this.allTravels.filter(t => t.isCompleted);
    const categoriesSet = new Set();
    completed.forEach(t => {
      if (t.buy) {
        t.buy.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    const categoriesList = Array.from(categoriesSet).sort();
    const allCategories = ['TODOS', ...categoriesList];

    // 1. Stats
    const categoryStats = this.calculateStatsUseCase.execute(
      this.allTravels, 
      this.state.selectedCategories, 
      this.state.includeCommission
    );

    // 2. Filter & Sort
    let filtered = this.allTravels;
    
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

    filtered.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return this.state.sort === 'DESC' ? dateB - dateA : dateA - dateB;
    });

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
      onCommissionToggle: (val) => this.toggleCommission(val)
    });
  }

  showDashboard() {
    this.state.currentView = 'dashboard';
    // 0. Extract Categories
    const completed = this.allTravels.filter(t => t.isCompleted || t.status === 'ACTIVE' || t.status === 'COMPLETED');
    const categoriesSet = new Set();
    completed.forEach(t => {
      if (t.buy && t.buy.categories) {
        t.buy.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    const categoriesList = Array.from(categoriesSet).sort();
    const allCategories = ['TODOS', ...categoriesList];

    // 1. Filter data by categories
    let filtered = completed;
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
      onCommissionToggle: (val) => this.toggleCommission(val)
    });
  }

  openExportOptions() {
    this.ui.renderExportModal({
      onExport: (options) => this.handleExport(options)
    });
  }

  async handleExport(options) {
    const { type, value } = options;
    let toExport = [...this.allTravels].sort((a,b) => new Date(b.date) - new Date(a) - new Date(b));
    
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
}
