// src/adapters/repositories/LogisticsRepository.js
import * as api from '../../api/LogisticsApi.js';
import { Driver, Trailer, Truck, Travel } from '../../domain/entities/LogisticsModels.js';

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
    const data = await api.fetchDrivers();
    this.drivers = data.map(d => new Driver(d));
    return this.drivers;
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
    this.trailers = data.map(t => new Trailer(t));
    return this.trailers;
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
    this.trucks = data.map(t => new Truck(t));
    return this.trucks;
  }

  async saveTruck(truckObj) {
    const domainTruck = new Truck(truckObj);
    await api.saveMasterData(domainTruck.id, 'TRUCK', domainTruck);
    return domainTruck;
  }

  async deleteTruck(id) {
    // KMP also supports soft delete, but for now we'll do hard delete or mark isDeleted = true
    await api.deleteMasterData(id, 'TRUCK');
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
}
