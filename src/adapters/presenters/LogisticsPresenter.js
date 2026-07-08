// src/adapters/presenters/LogisticsPresenter.js
import { Travel } from '../../domain/entities/LogisticsModels.js';

/**
 * Presenter para el módulo de Logística y Maestros de datos.
 * Coordina las vistas de choferes, jaulas, camiones, comisionistas, productores, liquidaciones y consumos de combustible.
 */
export class LogisticsPresenter {
  /**
   * @param {Object} repository - Repositorio de logística para operaciones de datos.
   * @param {Object} ui - Interfaz unificada de usuario para el renderizado del DOM.
   */
  constructor(repository, ui) {
    this.repository = repository;
    this.ui = ui; // uiInterface from main.js
  }

  // --- MASTERS DELEGATION ---
  
  /**
   * Carga la lista de choferes ordenada alfabéticamente y la renderiza en el maestro correspondiente.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra o actualiza la información de un chofer tras validar duplicidad de DNI.
   * @param {Object} driverObj - Atributos del chofer a guardar.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un chofer del repositorio según su ID y recarga la vista.
   * @param {string|number} id - Identificador del chofer.
   * @returns {Promise<void>}
   */
  async deleteDriver(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteDriver(id);
      await this.loadDrivers();
    } catch (e) {
      this.ui.showError("Error deleting driver: " + e.message);
    }
  }

  /**
   * Carga la lista de jaulas/acoplados ordenada alfabéticamente y la renderiza.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra o actualiza la información de una jaula tras validar la patente.
   * @param {Object} trailerObj - Parámetros de la jaula.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina una jaula por ID.
   * @param {string|number} id - Identificador de la jaula.
   * @returns {Promise<void>}
   */
  async deleteTrailer(id) {
    this.ui.showLoading(true);
    try {
      await this.repository.deleteTrailer(id);
      await this.loadTrailers();
    } catch (e) {
      this.ui.showError("Error deleting trailer: " + e.message);
    }
  }

  /**
   * Carga camiones, choferes y jaulas disponibles en paralelo y renderiza el maestro de camiones.
   * @returns {Promise<void>}
   */
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

  /**
   * Guarda un camión tras validar duplicidad de patente.
   * @param {Object} truckObj - Parámetros del camión.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un camión por ID.
   * @param {string|number} id - Identificador del camión.
   * @returns {Promise<void>}
   */
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

  /**
   * Carga la lista de productores y la renderiza.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra o actualiza la información de un productor validando el CUIT.
   * @param {Object} producerObj - Parámetros del productor.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un productor por ID.
   * @param {string|number} id - Identificador de productor.
   * @returns {Promise<void>}
   */
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

  /**
   * Carga la lista de comisionistas y la renderiza.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra o actualiza la información de un comisionista validando el nombre.
   * @param {Object} agentObj - Parámetros de comisionista.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un comisionista por ID.
   * @param {string|number} id - Identificador de comisionista.
   * @returns {Promise<void>}
   */
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

  /**
   * Carga viajes, camiones y configuraciones globales para renderizar el panel de administración logística de viajes.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra un nuevo viaje o guarda cambios logísticos, completando precios default si faltan.
   * @param {Object} travelObj - Atributos logísticos del viaje.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un viaje logístico por ID.
   * @param {string|number} id - Identificador de viaje.
   * @returns {Promise<void>}
   */
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

  /**
   * Carga viajes y choferes para renderizar el panel de preliquidaciones de fletes por chofer.
   * @returns {Promise<void>}
   */
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

  /**
   * Carga viajes y camiones para renderizar la pantalla de estadísticas de rendimiento de combustible y consumo.
   * @returns {Promise<void>}
   */
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
