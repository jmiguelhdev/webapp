// src/adapters/repositories/LogisticsRepository.js
import * as api from '../../api/LogisticsApi.js';
import { Driver, Trailer, Truck, Travel, Producer, Agent } from '../../domain/entities/LogisticsModels.js';

export class LogisticsRepository {
  constructor() {
    this.drivers = [];
    this.trailers = [];
    this.trucks = [];
    this.travels = [];
    this.appConfig = null;
  }

  // --- CONFIG ---
  async getAppConfig() {
    if (!this.appConfig) {
      this.appConfig = await api.getAppConfig();
    }
    return this.appConfig;
  }

  // --- DRIVERS ---
  async getDrivers() {
    const cacheKey = 'logistics_drivers';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.drivers = JSON.parse(cached).map(d => new Driver(d));
      return this.drivers;
    }
    const data = await api.fetchDrivers();
    this.drivers = data.map(d => new Driver(d));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return this.drivers;
  }

  async saveDriver(driverObj) {
    const domainDriver = new Driver(driverObj);
    await api.saveMasterData(domainDriver.id, 'DRIVER', domainDriver);
    localStorage.removeItem('logistics_drivers');
    return domainDriver;
  }

  async deleteDriver(id) {
    await api.deleteMasterData(id, 'DRIVER');
    localStorage.removeItem('logistics_drivers');
  }

  // --- TRAILERS ---
  async getTrailers() {
    const cacheKey = 'logistics_trailers';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.trailers = JSON.parse(cached).map(t => new Trailer(t));
      return this.trailers;
    }
    const data = await api.fetchTrailers();
    this.trailers = data.map(t => new Trailer(t));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return this.trailers;
  }

  async saveTrailer(trailerObj) {
    const domainTrailer = new Trailer(trailerObj);
    await api.saveMasterData(domainTrailer.id, 'TRAILER', domainTrailer);
    localStorage.removeItem('logistics_trailers');
    return domainTrailer;
  }

  async deleteTrailer(id) {
    await api.deleteMasterData(id, 'TRAILER');
    localStorage.removeItem('logistics_trailers');
  }

  // --- TRUCKS ---
  async getTrucks() {
    const cacheKey = 'logistics_trucks';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.trucks = JSON.parse(cached).map(t => new Truck(t));
      return this.trucks;
    }
    const data = await api.fetchTrucks();
    this.trucks = data.map(t => new Truck(t));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return this.trucks;
  }

  async saveTruck(truckObj) {
    const domainTruck = new Truck(truckObj);
    await api.saveMasterData(domainTruck.id, 'TRUCK', domainTruck);
    localStorage.removeItem('logistics_trucks');
    return domainTruck;
  }

  async deleteTruck(id) {
    await api.deleteMasterData(id, 'TRUCK');
    localStorage.removeItem('logistics_trucks');
  }

  // --- TRAVELS ---
  async getTravels() {
    const data = await api.fetchTravels();
    this.travels = data.map(t => new Travel(t));
    return this.travels;
  }

  async saveTravel(travelObj) {
    const domainTravel = new Travel(travelObj);
    await api.saveTravel(domainTravel);
    return domainTravel;
  }

  async deleteTravel(id) {
    await api.deleteTravel(id);
  }

  // --- PRODUCERS ---
  async getProducers() {
    const cacheKey = 'logistics_producers';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.producers = JSON.parse(cached).map(p => new Producer(p));
      return this.producers;
    }
    const data = await api.fetchMasterDataByType('PRODUCER');
    this.producers = data.map(p => new Producer(p));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return this.producers;
  }

  async getProducersPaginated(limitCount = 20, lastVisibleDoc = null) {
    // Para la vista de gestión, no usamos caché para asegurar frescura de datos al paginar
    const result = await api.fetchProducersPaginated(limitCount, lastVisibleDoc);
    const domainProducers = result.results.map(p => new Producer(p));
    return {
      producers: domainProducers,
      lastVisible: result.lastVisible,
      hasMore: result.hasMore
    };
  }

  async saveProducer(producerObj) {
    const domainProducer = new Producer(producerObj);
    await api.saveMasterData(domainProducer.id, 'PRODUCER', domainProducer);
    localStorage.removeItem('logistics_producers');
    return domainProducer;
  }

  async deleteProducer(id) {
    await api.deleteMasterData(id, 'PRODUCER');
    localStorage.removeItem('logistics_producers');
  }

  // --- AGENTS ---
  async getAgents() {
    const cacheKey = 'logistics_agents';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      this.agents = JSON.parse(cached).map(a => new Agent(a));
      return this.agents;
    }
    const data = await api.fetchMasterDataByType('AGENT');
    this.agents = data.map(a => new Agent(a));
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return this.agents;
  }

  async saveAgent(agentObj) {
    const domainAgent = new Agent(agentObj);
    await api.saveMasterData(domainAgent.id, 'AGENT', domainAgent);
    localStorage.removeItem('logistics_agents');
    return domainAgent;
  }

  async deleteAgent(id) {
    await api.deleteMasterData(id, 'AGENT');
    localStorage.removeItem('logistics_agents');
  }
}
