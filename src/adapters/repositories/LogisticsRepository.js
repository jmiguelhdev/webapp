// src/adapters/repositories/LogisticsRepository.js
import * as api from '../../api/LogisticsApi.js';
import { Driver, Trailer, Truck, Travel, Producer, Agent } from '../../domain/entities/LogisticsModels.js';

export class LogisticsRepository {
  constructor() {
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
    const data = await api.fetchDrivers();
    return data.map(d => new Driver(d));
  }

  async saveDriver(driverObj) {
    const domainDriver = new Driver(driverObj);
    await api.saveMasterData(domainDriver.id, 'DRIVER', domainDriver);
    return domainDriver;
  }

  async deleteDriver(id) {
    await api.deleteMasterData(id, 'DRIVER');
  }

  // --- TRAILERS ---
  async getTrailers() {
    const data = await api.fetchTrailers();
    return data.map(t => new Trailer(t));
  }

  async saveTrailer(trailerObj) {
    const domainTrailer = new Trailer(trailerObj);
    await api.saveMasterData(domainTrailer.id, 'TRAILER', domainTrailer);
    return domainTrailer;
  }

  async deleteTrailer(id) {
    await api.deleteMasterData(id, 'TRAILER');
  }

  // --- TRUCKS ---
  async getTrucks() {
    const data = await api.fetchTrucks();
    return data.map(t => new Truck(t));
  }

  async saveTruck(truckObj) {
    const domainTruck = new Truck(truckObj);
    await api.saveMasterData(domainTruck.id, 'TRUCK', domainTruck);
    return domainTruck;
  }

  async deleteTruck(id) {
    await api.deleteMasterData(id, 'TRUCK');
  }

  // --- TRAVELS ---
  async getTravels() {
    const data = await api.fetchTravels();
    return data.map(t => new Travel(t));
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
    const data = await api.fetchMasterDataByType('PRODUCER');
    return data.map(p => new Producer(p));
  }

  async getProducersPaginated(limitCount = 20, lastVisibleDoc = null) {
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
    return domainProducer;
  }

  async deleteProducer(id) {
    await api.deleteMasterData(id, 'PRODUCER');
  }

  // --- AGENTS ---
  async getAgents() {
    const data = await api.fetchMasterDataByType('AGENT');
    return data.map(a => new Agent(a));
  }

  async saveAgent(agentObj) {
    const domainAgent = new Agent(agentObj);
    await api.saveMasterData(domainAgent.id, 'AGENT', domainAgent);
    return domainAgent;
  }

  async deleteAgent(id) {
    await api.deleteMasterData(id, 'AGENT');
  }
}
