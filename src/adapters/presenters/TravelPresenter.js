// src/adapters/presenters/TravelPresenter.js
import { GetTravels } from '../../domain/usecases/GetTravels.js';
import { CalculateCategoryStats } from '../../domain/usecases/CalculateCategoryStats.js';
import { PdfFaenaService } from '../../services/PdfFaenaService.js';
import { SHARED_DATA_SOURCE_UID } from '../../config.js';

export class TravelPresenter {
  constructor(travelRepository, ui) {
    this.travelRepository = travelRepository;
    this.getTravelsUseCase = new GetTravels(travelRepository);
    this.calculateStatsUseCase = new CalculateCategoryStats();
    this.pdfService = new PdfFaenaService();
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
      onSearch: (q) => this.setSearchQuery(q),
      onPdfUpload: (file) => this.handlePdfFaenaUpload(file, SHARED_DATA_SOURCE_UID),
      onScanDirectory: (files) => this.handleScanDirectory(SHARED_DATA_SOURCE_UID, files)
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

  async handleScanDirectory(uid, filesArray) {
    if (!filesArray || filesArray.length === 0) return;

    this.ui.showLoading();
    try {
      let newCount = 0;
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

      // Find matching travel
      const match = this.allTravels.find(t => {
        // 1. Check Producer CUIT
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
        throw new Error(`[${file.name}] No se encontró un viaje para el productor con CUIT ${pdfData.producer.cuit} cerca de la fecha ${pdfData.date}.`);
      }

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

      // 2. Save detailed records (Garrones) to new collection
      const detailRecords = pdfData.items.map(item => ({
        travelId: firebaseId,
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

      if (!isBulk) {
        // 3. Refresh display only if not bulk (bulk refreshes once at the end)
        await this.loadTravels(uid);
        alert(`✅ Faena procesada con éxito: ${pdfData.totalKgFaena} kg, ${pdfData.totalHeadCount} cabezas.`);
      }
      return { success: true, fileName: file.name };

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
