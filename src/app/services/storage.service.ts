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
  private currentUserId: string | null = null;

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
      console.warn('Storage not initialized; initializing now...');
      await this.init();
    }
  }

  async checkAndPrepareStorage(userId: string) {
    await this.ensureInitialized();

    if (this.currentUserId !== userId) {
      console.log('New user detected, resetting storage for user:', userId);

      // Clear old data and set new key for the current user
      if (this.currentUserId) {
        await this.storage.remove(this.currentUserId);
      }

      this.currentUserId = userId;
    }
  }

  async addFlight(flight: Flight): Promise<void> {
    await this.ensureInitialized();

    if (!this.currentUserId) {
      throw new Error('No user logged in. Cannot add flight.');
    }

    const key = this.currentUserId;
    const existingFlights: Flight[] = (await this.storage.get(key)) || [];

    if (!existingFlights.some((f: Flight) => f.flightId === flight.flightId)) {
      existingFlights.push(flight);
    }

    await this.storage.set(key, existingFlights);
    console.log(`Flights stored under key "${key}":`, existingFlights);
  }


  async getAllFlights(userId: string): Promise<Flight[]> {
    await this.ensureInitialized();
    await this.checkAndPrepareStorage(userId);

    const key = userId;
    const storedFlights: Flight[] = (await this.storage.get(key)) || [];
    console.log(`Fetched flights for user "${userId}":`, storedFlights);

    return storedFlights;
  }



  async getFlightById(flightId: string, userId: string): Promise<Flight | undefined> {
    const flights = await this.getAllFlights(userId);
    return flights.find((flight) => flight.flightId === flightId);
  }

  async updateFlight(flight: Flight): Promise<void> {
    await this.ensureInitialized();

    if (!this.currentUserId) {
      throw new Error('No user logged in. Cannot update flight.');
    }

    const key = this.currentUserId;
    const existingFlights: Flight[] = (await this.storage.get(key)) || [];

    const flightIndex = existingFlights.findIndex(
      (f) => f.flightId === flight.flightId && f.userId === flight.userId
    );

    if (flightIndex !== -1) {
      existingFlights[flightIndex] = flight;
    } else {
      console.warn(`Flight with ID ${flight.flightId} not found for update. Adding it instead.`);
      existingFlights.push(flight);
    }

    await this.storage.set(key, existingFlights);
    console.log('Updated flights for user:', existingFlights);
  }


  async getPreviousFlight(previousFlightId: string, userId: string): Promise<Flight | undefined> {
    return await this.getFlightById(previousFlightId, userId);
  }

  async clear(): Promise<void> {
    if (this.currentUserId) {
      await this.storage.remove(this.currentUserId);
      console.log(`Cleared storage for user: ${this.currentUserId}`);
    }
  }

  public async set(key: string, value: any): Promise<void> {
    await this._storage?.set(key, value);
  }

  public async get(key: string): Promise<any> {
    const data = await this._storage?.get(key);
    console.log(`Data fetched for key "${key}":`, data);

    if (typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to parse JSON for key "${key}":`, error);
      return data;
    }
  }
}
