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
      drivers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
      this.ui.renderLogisticsMaster(this, 'choferes', drivers);
    } catch (e) {
      this.ui.showError("Error loading drivers: " + e.message);
    }
  }

  async saveDriver(driverObj) {
    this.ui.showLoading(true);
    try {
      const list = await this.repository.getDrivers();
      const targetDni = String(driverObj.dni || '').replace(/\D/g, '');
      const isDup = list.some(item => 
        String(item.id) !== String(driverObj.id) && 
        String(item.dni || '').replace(/\D/g, '') === targetDni && 
        targetDni.length > 0
      );
      if (isDup) {
        this.ui.hideLoading();
        this.ui.showError(`❌ Ya existe un chofer registrado con el DNI ${driverObj.dni}.`);
        return;
      }
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
      trailers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
      this.ui.renderLogisticsMaster(this, 'jaulas', trailers);
    } catch (e) {
      this.ui.showError("Error loading trailers: " + e.message);
    }
  }

  async saveTrailer(trailerObj) {
    this.ui.showLoading(true);
    try {
      const list = await this.repository.getTrailers();
      const targetPlate = String(trailerObj.licensePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const isDup = list.some(item => 
        String(item.id) !== String(trailerObj.id) && 
        String(item.licensePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === targetPlate && 
        targetPlate.length > 0
      );
      if (isDup) {
        this.ui.hideLoading();
        this.ui.showError(`❌ Ya existe una jaula registrada con la patente ${trailerObj.licensePlate}.`);
        return;
      }
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
      trucks.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
      this.ui.renderLogisticsMaster(this, 'camiones', trucks, { drivers, trailers });
    } catch (e) {
      this.ui.showError("Error loading trucks: " + e.message);
    }
  }

  async saveTruck(truckObj) {
    this.ui.showLoading(true);
    try {
      const list = await this.repository.getTrucks();
      const targetPlate = String(truckObj.licensePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const isDup = list.some(item => 
        String(item.id) !== String(truckObj.id) && 
        String(item.licensePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === targetPlate && 
        targetPlate.length > 0
      );
      if (isDup) {
        this.ui.hideLoading();
        this.ui.showError(`❌ Ya existe un camión registrado con la patente ${truckObj.licensePlate}.`);
        return;
      }
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

  // --- PRODUCERS ---
  async loadProducers() {
    this.ui.showLoading(true);
    try {
      const producers = await this.repository.getProducers();
      producers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
      this.ui.renderLogisticsMaster(this, 'productores', producers);
    } catch (e) {
      this.ui.showError("Error loading producers: " + e.message);
    }
  }

  async saveProducer(producerObj) {
    this.ui.showLoading(true);
    try {
      const list = await this.repository.getProducers();
      const targetCuit = String(producerObj.cuit || '').replace(/\D/g, '');
      const isDup = list.some(item => 
        String(item.id) !== String(producerObj.id) && 
        String(item.cuit || '').replace(/\D/g, '') === targetCuit && 
        targetCuit.length > 0
      );
      if (isDup) {
        this.ui.hideLoading();
        this.ui.showError(`❌ Ya existe un productor registrado con el CUIT ${producerObj.cuit}.`);
        return;
      }
      await this.repository.saveProducer(producerObj);
      await this.loadProducers();
    } catch (e) {
      this.ui.showError("Error saving producer: " + e.message);
    }
  }

  async deleteProducer(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteProducer(id);
      await this.loadProducers();
    } catch (e) {
      this.ui.showError("Error deleting producer: " + e.message);
    }
  }

  // --- AGENTS ---
  async loadAgents() {
    this.ui.showLoading(true);
    try {
      const agents = await this.repository.getAgents();
      agents.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
      this.ui.renderLogisticsMaster(this, 'comisionistas', agents);
    } catch (e) {
      this.ui.showError("Error loading agents: " + e.message);
    }
  }

  async saveAgent(agentObj) {
    this.ui.showLoading(true);
    try {
      const list = await this.repository.getAgents();
      const targetName = String(agentObj.name || '').trim().toLowerCase();
      const isDup = list.some(item => 
        String(item.id) !== String(agentObj.id) && 
        String(item.name || '').trim().toLowerCase() === targetName && 
        targetName.length > 0
      );
      if (isDup) {
        this.ui.hideLoading();
        this.ui.showError(`❌ Ya existe un comisionista registrado con el nombre "${agentObj.name}".`);
        return;
      }
      await this.repository.saveAgent(agentObj);
      await this.loadAgents();
    } catch (e) {
      this.ui.showError("Error saving agent: " + e.message);
    }
  }

  async deleteAgent(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteAgent(id);
      await this.loadAgents();
    } catch (e) {
      this.ui.showError("Error deleting agent: " + e.message);
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
