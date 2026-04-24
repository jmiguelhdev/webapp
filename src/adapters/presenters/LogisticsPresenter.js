// src/adapters/presenters/LogisticsPresenter.js
import { Travel } from '../../domain/entities/LogisticsModels.js';

export class LogisticsPresenter {
  constructor(repository, ui) {
    this.repository = repository;
    this.ui = ui; // uiInterface from main.js
  }

  // --- MASTERS DELEGATION ---
  
  async loadDrivers() {
    this.ui.showLoading(true);
    try {
      const drivers = await this.repository.getDrivers();
      this.ui.renderLogisticsMaster(this, 'choferes', drivers);
    } catch (e) {
      this.ui.showError("Error loading drivers: " + e.message);
    }
  }

  async saveDriver(driverObj) {
    this.ui.showLoading(true);
    try {
      await this.repository.saveDriver(driverObj);
      await this.loadDrivers();
    } catch (e) {
      this.ui.showError("Error saving driver: " + e.message);
    }
  }

  async deleteDriver(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteDriver(id);
      await this.loadDrivers();
    } catch (e) {
      this.ui.showError("Error deleting driver: " + e.message);
    }
  }

  async loadTrailers() {
    this.ui.showLoading(true);
    try {
      const trailers = await this.repository.getTrailers();
      this.ui.renderLogisticsMaster(this, 'jaulas', trailers);
    } catch (e) {
      this.ui.showError("Error loading trailers: " + e.message);
    }
  }

  async saveTrailer(trailerObj) {
    this.ui.showLoading(true);
    try {
      await this.repository.saveTrailer(trailerObj);
      await this.loadTrailers();
    } catch (e) {
      this.ui.showError("Error saving trailer: " + e.message);
    }
  }

  async deleteTrailer(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteTrailer(id);
      await this.loadTrailers();
    } catch (e) {
      this.ui.showError("Error deleting trailer: " + e.message);
    }
  }

  async loadTrucks() {
    this.ui.showLoading(true);
    try {
      const [trucks, drivers, trailers] = await Promise.all([
        this.repository.getTrucks(),
        this.repository.getDrivers(),
        this.repository.getTrailers()
      ]);
      this.ui.renderLogisticsMaster(this, 'camiones', trucks, { drivers, trailers });
    } catch (e) {
      this.ui.showError("Error loading trucks: " + e.message);
    }
  }

  async saveTruck(truckObj) {
    this.ui.showLoading(true);
    try {
      await this.repository.saveTruck(truckObj);
      await this.loadTrucks();
    } catch (e) {
      this.ui.showError("Error saving truck: " + e.message);
    }
  }

  async deleteTruck(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteTruck(id);
      await this.loadTrucks();
    } catch (e) {
      this.ui.showError("Error deleting truck: " + e.message);
    }
  }

  // --- TRAVELS DELEGATION ---

  async loadTravelManagement() {
    this.ui.showLoading(true);
    try {
      const [travels, trucks, config] = await Promise.all([
        this.repository.getTravels(),
        this.repository.getTrucks(),
        this.repository.getAppConfig()
      ]);
      this.ui.renderTravelManagement(this, travels, { trucks, config });
    } catch (e) {
      this.ui.showError("Error loading travels: " + e.message);
    }
  }

  async saveTravel(travelObj) {
    this.ui.showLoading(true);
    try {
      // Create domain entity to ensure calculations are done if needed before saving
      const travel = new Travel(travelObj);
      
      // Auto-populate prices from config if not set
      if (!travel.driverPricePerKmSimple) {
        const config = await this.repository.getAppConfig();
        travel.driverPricePerKmSimple = config.defaultDriverPricePerKmSimple;
        travel.driverPricePerKmDouble = config.defaultDriverPricePerKmDouble;
        travel.simulationFreightPriceSimple = config.simulationFreightPriceSimple;
        travel.simulationFreightPriceDouble = config.simulationFreightPriceDouble;
        travel.fuelPrice = config.fuelPrice;
      }

      await this.repository.saveTravel(travel);
      await this.loadTravelManagement();
    } catch (e) {
      this.ui.showError("Error saving travel: " + e.message);
    }
  }

  async deleteTravel(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteTravel(id);
      await this.loadTravelManagement();
    } catch (e) {
      this.ui.showError("Error deleting travel: " + e.message);
    }
  }

  // --- LIQUIDATIONS & EFFICIENCY ---

  async loadLiquidations() {
    this.ui.showLoading(true);
    try {
      const [travels, drivers] = await Promise.all([
        this.repository.getTravels(),
        this.repository.getDrivers()
      ]);
      this.ui.renderLiquidations(this, travels, drivers);
    } catch (e) {
      this.ui.showError("Error loading liquidations: " + e.message);
    }
  }

  async loadFuelEfficiency() {
    this.ui.showLoading(true);
    try {
      const [travels, trucks] = await Promise.all([
        this.repository.getTravels(),
        this.repository.getTrucks()
      ]);
      this.ui.renderFuelEfficiency(this, travels, trucks);
    } catch (e) {
      this.ui.showError("Error loading fuel efficiency: " + e.message);
    }
  }
}
