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
      selectedCategory: null,
      includeCommission: false
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
    this.updateView();
  }

  setSort(sort) {
    this.state.sort = sort;
    this.updateView();
  }

  setPage(page) {
    this.state.page = page;
    this.updateView();
  }

  setCategory(category) {
    this.state.selectedCategory = category;
    this.updateView();
  }

  toggleCommission(val) {
    this.state.includeCommission = val;
    this.updateView();
  }

  updateView() {
    // 0. Extract Categories (from Buy entity directly)
    const completed = this.allTravels.filter(t => t.isCompleted);
    const categoriesSet = new Set();
    completed.forEach(t => {
      if (t.buy) {
        t.buy.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    const categoriesList = Array.from(categoriesSet).sort();
    // Add "TODOS" at the beginning
    const allCategories = ['TODOS', ...categoriesList];

    if (!this.state.selectedCategory) {
      this.state.selectedCategory = 'TODOS';
    }

    // 1. Stats
    const categoryStats = (this.state.selectedCategory && this.state.selectedCategory !== 'TODOS')
      ? this.calculateStatsUseCase.execute(this.allTravels, this.state.selectedCategory, this.state.includeCommission)
      : { avgPrice: 0, totalKg: 0, travelCount: 0 };

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

    // Category Filter
    if (this.state.selectedCategory && this.state.selectedCategory !== 'TODOS') {
      filtered = filtered.filter(t => {
        if (!t.buy) return false;
        return t.buy.categories.includes(this.state.selectedCategory);
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
      selectedCategory: this.state.selectedCategory,
      includeCommission: this.state.includeCommission,
      categoryStats,
      onFilter: (f) => this.setFilter(f),
      onSort: (s) => this.setSort(s),
      onPage: (p) => this.setPage(p),
      onCategoryChange: (cat) => this.setCategory(cat),
      onCommissionToggle: (val) => this.toggleCommission(val)
    });
  }
}
