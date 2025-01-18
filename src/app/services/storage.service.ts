//storage.service.ts

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import * as CordovaSQLiteDriver from 'localforage-cordovasqlitedriver';
import { Flight } from '../models/flight.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    try {
      await this.storage.defineDriver(CordovaSQLiteDriver);
      const storage = await this.storage.create();
      console.log('Storage initialized with driver:', storage.driver);

      this._storage = storage;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this._storage) {
      await this.init();
    }
  }

  async addFlight(flight: Flight): Promise<void> {
    await this.ensureInitialized();
    const flights = (await this.getAllFlights()) || [];
    flights.push(flight);
    await this._storage?.set('flights', flights);
  }

  // Get all flights from the storage
  async getAllFlights(): Promise<Flight[]> {
    return (await this.get('flights')) || [];
  }

  // Get a flight by its ID
  async getFlightById(flightId: string): Promise<Flight | undefined> {
    const flights = await this.getAllFlights();
    return flights.find((flight) => flight.flightId === flightId);
  }

  // Update a flight in the storage
  async updateFlight(flight: Flight): Promise<void> {
    const flights = await this.getAllFlights();
    const index = flights.findIndex((f) => f.flightId === flight.flightId);
    if (index !== -1) {
      flights[index] = flight;
      await this.set('flights', flights);
    }
  }

  // Get previous flight
  async getPreviousFlight(previousFlightId: string): Promise<Flight | undefined> {
    return await this.getFlightById(previousFlightId);
  }

  // Clear all storage data
  async clear(): Promise<void> {
    await this._storage?.clear();
  }

  // Set a value in the storage
  public async set(key: string, value: any): Promise<void> {
    await this._storage?.set(key, value);
  }

  // Get a value from the storage
  public async get(key: string): Promise<any> {
    return await this._storage?.get(key);
  }
}
