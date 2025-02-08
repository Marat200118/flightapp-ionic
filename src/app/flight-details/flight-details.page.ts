//flight-details.page.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../services/flight.service';
import { StorageService } from '../services/storage.service';
import { ActualFlightPathMapComponent } from '../components/actual-flight-path-map/actual-flight-path-map.component';
import { Flight } from '../models/flight.model';
import { airplaneOutline, hourglassOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSpinner,
  ToastController,
  IonGrid,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-flight-details',
  templateUrl: './flight-details.page.html',
  styleUrls: ['./flight-details.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonGrid,
    IonSpinner,
    IonCol,
    IonItem,
    IonLabel,
    IonRow,
    IonBackButton,
    IonCard,
    IonIcon,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
    ActualFlightPathMapComponent,
  ],
})


export class FlightDetailsPage {
  flight: any; 
  flights: any[] = []; 
  upcomingFlights: any[] = []; 
  previousFlights: any[] = [];
  flightPath: any = null;
  openskyInfo: any = null;
  previousFlight: any = null;
  actualFlight: any = null;
  isLoading = false;
  
  
  constructor(
    private flightService: FlightService,
    private storageService: StorageService,
    private toastCtrl: ToastController,
  ) {
    const state = history.state;
    this.flight = state.flight || null;
  }

  async ngOnInit() {
    this.setLoading(true, 'Loading flight details...');
    if (this.flight) {
      await this.presentToast('Flight details loaded successfully', 'success', 'top');

      const now = new Date();
      const scheduledDeparture = new Date(this.flight.flightDetails.scheduled_out);

      const timeToDeparture = (scheduledDeparture.getTime() - now.getTime()) / (1000 * 60 * 60);
      console.log('Time to Departure (hours):', timeToDeparture);

      if (timeToDeparture <= 8 && timeToDeparture > 0) {
        console.log('Fetching previous flight...');
        await this.findPreviousFlight();
      }

      const timeSinceDeparture = (now.getTime() - scheduledDeparture.getTime()) / (1000 * 60 * 60);
      console.log('Time since Departure (hours):', timeSinceDeparture);

      if (timeSinceDeparture >= 12 && !this.flight.actualFlight) {
        console.log('Fetching actual flight...');
        await this.findAndSaveActualFlight();
      } else if (this.flight.actualFlight) {
        console.log('Using existing actual flight:', this.flight.actualFlight);
      }

      if (this.flight.previousFlight && !this.flight.previousFlight.flightPath) {
        console.log('Fetching flight path for previous flight...');
        await this.loadFlightPath(this.flight.previousFlight);
      } else if (this.flight.previousFlight?.flightPath) {
        console.log('Using existing flight path for previous flight:', this.flight.previousFlight?.flightPath);
      }

      if (this.flight.actualFlight && !this.flight.actualFlight.flightPath) {
        console.log('Fetching flight path for actual flight...');
        await this.loadFlightPath(this.flight.actualFlight);
      } else if (this.flight.actualFlight?.flightPath) {
        console.log('Using existing flight path for actual flight:', this.flight.actualFlight?.flightPath);
      }
    }
    this.setLoading(false);
  }

  isPastFlight(): boolean {
    const now = new Date();
    const scheduledDeparture = new Date(this.flight.flightDetails.scheduled_out);
    return scheduledDeparture < now;
  }


  async findPreviousFlight() {
    this.setLoading(true, 'Fetching previous flight data...');
    if (this.flight.previousFlight) {
      console.log('Previous flight is already available:', this.flight.previousFlight);

      if (!this.flight.previousFlight.flightPath) {
        console.log('Fetching flight path for previous flight...');
        await this.loadFlightPath(this.flight.previousFlight);
      } else {
        console.log('Using existing flight path for previous flight:', this.flight.previousFlight.flightPath);
      }
      return;
    }

    const { origin, destination, scheduled_out } = this.flight.flightDetails;
    const scheduledDepartureUTC = new Date(scheduled_out);
    const startTime = Math.floor((scheduledDepartureUTC.getTime() - 5 * 24 * 60 * 60 * 1000) / 1000); 
    const endTime = Math.floor(scheduledDepartureUTC.getTime() / 1000);

    try {
      let flights = await this.flightService
        .getDeparturesWithArrival(origin, startTime, endTime, destination)
        .toPromise();

      console.log('Fetched flights (origin to destination):', flights);

      let previousFlight = flights.reduce((closest: any, current: any) => {
        const closestTimeDiff = Math.abs(closest.lastSeen - scheduledDepartureUTC.getTime() / 1000);
        const currentTimeDiff = Math.abs(current.lastSeen - scheduledDepartureUTC.getTime() / 1000);
        return currentTimeDiff < closestTimeDiff ? current : closest;
      }, flights[0]);

      if (!previousFlight) {
        console.warn('No previous flight found from origin to destination. Trying arrivals endpoint...');
        
        flights = await this.flightService
          .getArrivalsAtAirport(destination, startTime, endTime)
          .toPromise();

        console.log('Fetched flights (arrivals at destination):', flights);

        previousFlight = flights
          .filter((flight: any) => flight.estDepartureAirport === origin) 
          .reduce((closest: any, current: any) => {
            const closestTimeDiff = Math.abs(closest.lastSeen - scheduledDepartureUTC.getTime() / 1000);
            const currentTimeDiff = Math.abs(current.lastSeen - scheduledDepartureUTC.getTime() / 1000);
            return currentTimeDiff < closestTimeDiff ? current : closest;
          }, flights[0]);
      }

      // Step 3: Process the found flight
      if (previousFlight) {
        console.log('Previous flight found:', previousFlight);

        if (!previousFlight.flightPath) {
          console.log('Fetching flight path for previous flight...');
          await this.loadFlightPath(previousFlight);
        }

        this.flight.previousFlight = previousFlight;
        await this.storageService.updateFlight(this.flight);
        console.log('Updated flight with previous flight:', this.flight);
      } else {
        console.warn('No previous flight found after trying both departures and arrivals.');
      }
    } catch (error) {
      console.error('Error fetching previous flight:', error);
    } finally {
      this.setLoading(false);
    }
  }




  async findAndSaveActualFlight() {
    const { origin, destination, scheduled_out } = this.flight.flightDetails;
    const scheduledDepartureUTC = new Date(scheduled_out);
    const scheduledDepartureTime = Math.floor(scheduledDepartureUTC.getTime() / 1000);
    const startTime = scheduledDepartureTime;
    const endTime = Math.floor((scheduledDepartureUTC.getTime() + 12 * 60 * 60 * 1000) / 1000);

    if (this.flight.actualFlight) {
      console.log('Previous flight is already available:', this.flight.actualFlight);

      if (!this.flight.actualFlight.flightPath) {
        console.log('Fetching flight path for previous flight...');
        await this.loadFlightPath(this.flight.actualFlight);
      } else {
        console.log('Using existing flight path for actual flight:', this.flight.actualFlight.flightPath);
      }
      return;
    }

    try {
      this.setLoading(true, 'Fetching actual flight data...');
      let flights = await this.flightService
        .getDeparturesWithArrival(origin, startTime, endTime, destination)
        .toPromise();

      let actualFlight = flights.reduce((closest: any, current: any) => {
        const closestDiff = Math.abs(closest.firstSeen - scheduledDepartureTime);
        const currentDiff = Math.abs(current.firstSeen - scheduledDepartureTime);
        return currentDiff < closestDiff ? current : closest;
      }, flights[0]);

      if (!actualFlight) {
        console.warn('No actual flight found from origin to destination. Trying reverse direction...');

       
        flights = await this.flightService
          .getDeparturesWithArrival(destination, startTime, endTime, origin)
          .toPromise();

        console.log('Fetched flights (destination to origin):', flights);

        actualFlight = flights.reduce((closest: any, current: any) => {
          const closestDiff = Math.abs(closest.firstSeen - scheduledDepartureTime);
          const currentDiff = Math.abs(current.firstSeen - scheduledDepartureTime);
          return currentDiff < closestDiff ? current : closest;
        }, flights[0]);
      }

      if (actualFlight) {
        if (!actualFlight.flightPath) {
          console.log('Fetching flight path for actual flight...');
          await this.loadFlightPath(actualFlight);
        } else {
          console.log('Using existing flight path for actual flight:', actualFlight.flightPath);
        }
        this.flight.actualFlight = actualFlight;
        await this.storageService.updateFlight(this.flight);
        console.log('Updated flight with actual flight:', this.flight);
      } else {
        console.warn('No actual flight found.');
      }
    } catch (error) {
      console.error('Error fetching actual flight:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async loadFlightPath(flight: any) {
    if (flight.flightPath) {
      console.log('Flight already has a flightPath:', flight.flightPath);
      return flight.flightPath;
    }

    try {
      const pathData = await this.flightService.getFlightPath(flight.icao24, flight.firstSeen).toPromise();
      if (pathData?.path) {
        console.log('Fetched flight path from API:', pathData.path);
        flight.flightPath = pathData.path; 
        await this.storageService.updateFlight(this.flight);
        return pathData.path;
      } else {
        console.warn('No flight path data found.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching flight path:', error);
      return null;
    }
  }

  async loadFlightsFromStorage() {
    this.flights = await this.storageService.getAllFlights(this.flight.userId);
    console.log('Loaded Flights from Storage:', this.flights);

    const today = new Date();
    this.upcomingFlights = this.flights.filter((flight) => {
      const scheduledDate = new Date(flight.flightDetails.scheduled_out);
      return scheduledDate >= today;
    });

    this.previousFlights = this.flights.filter((flight) => {
      const scheduledDate = new Date(flight.flightDetails.scheduled_out);
      return scheduledDate < today;
    });
  }

  
  getAirlinePrefix(ident: string): string {
    return ident.replace(/[^\D]/g, '').toUpperCase();
  }

  matchAirlinePrefix(callsign: string, airlinePrefix: string): boolean {
    if (!callsign || !airlinePrefix) return false;

    const normalizedCallsign = callsign.trim().toUpperCase();
    const normalizedPrefix = airlinePrefix.trim().toUpperCase();

    return normalizedCallsign.startsWith(normalizedPrefix);
  }

  formatFlightPath(flightPath: any[]): { latitude: number; longitude: number }[] {
  return flightPath
      .map((point) => ({
        latitude: point[1],
        longitude: point[2], 
      }))
      .filter(
        (point) =>
          typeof point.latitude === 'number' &&
          typeof point.longitude === 'number'
      );
  }

  codesharesAsString(codeshares: Array<{ ident_iata: string }>): string {
    if (!codeshares || codeshares.length === 0) {
      return '';
    }
    return codeshares.map((code) => code.ident_iata).join(', ');
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning', position: 'top' | 'middle' | 'bottom') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position,
    });
    await toast.present();
  }

  setLoading(loading: boolean, message?: string) {
    this.isLoading = loading;
    if (message) {
      console.log(message);
    }
  }

}
