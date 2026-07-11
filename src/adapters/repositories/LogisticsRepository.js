// src/adapters/repositories/LogisticsRepository.js
import * as api from '../api/LogisticsApi.js';
import { Driver, Trailer, Truck, Travel, Producer, Agent } from '../../domain/entities/LogisticsModels.js';

/**
 * Repositorio de logística para choferes, jaulas, camiones, viajes, comisionistas y productores.
 * Implementa la hidratación de DTOs en entidades de dominio enriquecidas.
 */
export class LogisticsRepository {
  constructor() {
    this.appConfig = null;
  }

  /**
   * Obtiene la configuración general del módulo fletes.
   * @returns {Promise<Object>} Configuración logística.
   */
  async getAppConfig() {
    if (!this.appConfig) {
      this.appConfig = await api.getAppConfig();
    }
    return this.appConfig;
  }

  /**
   * Obtiene la lista de choferes.
   * @returns {Promise<Array<Driver>>} Lista de choferes instanciados.
   */
  async getDrivers() {
    const data = await api.fetchDrivers();
    return data.map(d => new Driver(d));
  }

  /**
   * Registra o guarda un chofer.
   * @param {Object} driverObj - Atributos del chofer.
   * @returns {Promise<Driver>} Chofer guardado.
   */
  async saveDriver(driverObj) {
    const domainDriver = new Driver(driverObj);
    await api.saveMasterData(domainDriver.id, 'DRIVER', domainDriver);
    return domainDriver;
  }

  /**
   * Elimina un chofer.
   * @param {string|number} id - ID del chofer.
   * @returns {Promise<void>}
   */
  async deleteDriver(id) {
    await api.deleteMasterData(id, 'DRIVER');
  }

  /**
   * Obtiene las jaulas/acoplados en stock.
   * @returns {Promise<Array<Trailer>>} Lista de jaulas.
   */
  async getTrailers() {
    const data = await api.fetchTrailers();
    return data.map(t => new Trailer(t));
  }

  /**
   * Registra una jaula.
   * @param {Object} trailerObj - Atributos de la jaula.
   * @returns {Promise<Trailer>} Jaula guardada.
   */
  async saveTrailer(trailerObj) {
    const domainTrailer = new Trailer(trailerObj);
    await api.saveMasterData(domainTrailer.id, 'TRAILER', domainTrailer);
    return domainTrailer;
  }

  /**
   * Elimina una jaula por ID.
   * @param {string|number} id - ID de la jaula.
   * @returns {Promise<void>}
   */
  async deleteTrailer(id) {
    await api.deleteMasterData(id, 'TRAILER');
  }

  /**
   * Obtiene los camiones resolviendo los choferes y jaulas asignados.
   * @returns {Promise<Array<Truck>>} Lista de camiones.
   */
  async getTrucks() {
    const [trucksData, drivers, trailers] = await Promise.all([
      api.fetchTrucks(),
      this.getDrivers(),
      this.getTrailers()
    ]);

    return trucksData.map(t => {
      const truck = new Truck(t);

      // Resolve driver ID to complete Driver object
      const dId = truck.driverId || (t.driver ? (t.driver.id || t.driver) : null);
      if (dId) {
        const foundDriver = drivers.find(d => String(d.id) === String(dId));
        if (foundDriver) {
          truck.driver = foundDriver;
          truck.driverId = foundDriver.id;
        }
      }

      // Resolve trailer ID to complete Trailer object
      const trId = truck.trailerId || (t.trailer ? (t.trailer.id || t.trailer) : null);
      if (trId) {
        const foundTrailer = trailers.find(tr => String(tr.id) === String(trId));
        if (foundTrailer) {
          truck.trailer = foundTrailer;
          truck.trailerId = foundTrailer.id;
        }
      }

      return truck;
    });
  }

  /**
   * Guarda un camión en Firestore asegurando los campos de ID y objetos.
   * @param {Object} truckObj - Atributos del camión.
   * @returns {Promise<Truck>} Camión guardado.
   */
  async saveTruck(truckObj) {
    const domainTruck = new Truck(truckObj);
    if (domainTruck.driver && !domainTruck.driverId) {
      domainTruck.driverId = domainTruck.driver.id;
    }
    if (domainTruck.trailer && !domainTruck.trailerId) {
      domainTruck.trailerId = domainTruck.trailer.id;
    }
    await api.saveMasterData(domainTruck.id, 'TRUCK', domainTruck);
    return domainTruck;
  }

  /**
   * Elimina un camión por ID.
   * @param {string|number} id - ID del camión.
   * @returns {Promise<void>}
   */
  async deleteTruck(id) {
    await api.deleteMasterData(id, 'TRUCK');
  }

  /**
   * Obtiene la lista de viajes resolviendo las relaciones de camión, chofer y jaula.
   * @returns {Promise<Array<Travel>>} Lista de viajes.
   */
  async getTravels() {
    const [travelsData, trucks, drivers, trailers] = await Promise.all([
      api.fetchTravels(),
      this.getTrucks(),
      this.getDrivers(),
      this.getTrailers()
    ]);

    return travelsData.map(t => {
      const travel = new Travel(t);
      if (travel.truck) {
        // Resolve truck reference to fully populated truck
        const foundTruck = trucks.find(tr => String(tr.id) === String(travel.truck.id));
        if (foundTruck) {
          travel.truck = foundTruck;
        } else {
          // Fallback manually if truck is not in current catalog
          const dId = travel.truck.driverId || (t.truck?.driver ? (t.truck.driver.id || t.truck.driver) : null);
          if (dId) {
            travel.truck.driver = drivers.find(d => String(d.id) === String(dId)) || travel.truck.driver;
            travel.truck.driverId = dId;
          }
          const trId = travel.truck.trailerId || (t.truck?.trailer ? (t.truck.trailer.id || t.truck.trailer) : null);
          if (trId) {
            travel.truck.trailer = trailers.find(tr => String(tr.id) === String(trId)) || travel.truck.trailer;
            travel.truck.trailerId = trId;
          }
        }
      }
      return travel;
    });
  }

  /**
   * Guarda un viaje logístico.
   * @param {Object} travelObj - Atributos del viaje.
   * @returns {Promise<Travel>} Viaje guardado.
   */
  async saveTravel(travelObj) {
    const domainTravel = new Travel(travelObj);
    await api.saveTravel(domainTravel);
    return domainTravel;
  }

  /**
   * Elimina un viaje por ID.
   * @param {string|number} id - ID del viaje.
   * @returns {Promise<void>}
   */
  async deleteTravel(id) {
    await api.deleteTravel(id);
  }

  /**
   * Obtiene los productores registrados.
   * @returns {Promise<Array<Producer>>} Lista de productores.
   */
  async getProducers() {
    const data = await api.fetchMasterDataByType('PRODUCER');
    return data.map(p => new Producer(p));
  }

  /**
   * Obtiene productores con paginación para mejorar tiempos de renderizado.
   * @param {number} [limitCount=20] - Límite de elementos por página.
   * @param {Object|null} [lastVisibleDoc=null] - Cursor de Firebase para paginar.
   * @returns {Promise<Object>} Colección con productores y controles de paginación.
   */
  async getProducersPaginated(limitCount = 20, lastVisibleDoc = null) {
    const result = await api.fetchProducersPaginated(limitCount, lastVisibleDoc);
    const domainProducers = result.results.map(p => new Producer(p));
    return {
      producers: domainProducers,
      lastVisible: result.lastVisible,
      hasMore: result.hasMore
    };
  }

  /**
   * Guarda un productor.
   * @param {Object} producerObj - Atributos de productor.
   * @returns {Promise<Producer>} Productor guardado.
   */
  async saveProducer(producerObj) {
    const domainProducer = new Producer(producerObj);
    await api.saveMasterData(domainProducer.id, 'PRODUCER', domainProducer);
    return domainProducer;
  }

  /**
   * Elimina un productor por ID.
   * @param {string|number} id - ID de productor.
   * @returns {Promise<void>}
   */
  async deleteProducer(id) {
    await api.deleteMasterData(id, 'PRODUCER');
  }

  /**
   * Obtiene todos los comisionistas.
   * @returns {Promise<Array<Agent>>} Lista de comisionistas.
   */
  async getAgents() {
    const data = await api.fetchMasterDataByType('AGENT');
    return data.map(a => new Agent(a));
  }

  /**
   * Guarda un comisionista.
   * @param {Object} agentObj - Atributos de comisionista.
   * @returns {Promise<Agent>} Comisionista guardado.
   */
  async saveAgent(agentObj) {
    const domainAgent = new Agent(agentObj);
    await api.saveMasterData(domainAgent.id, 'AGENT', domainAgent);
    return domainAgent;
  }

  /**
   * Elimina un comisionista por ID.
   * @param {string|number} id - ID de comisionista.
   * @returns {Promise<void>}
   */
  async deleteAgent(id) {
    await api.deleteMasterData(id, 'AGENT');
  }
}
