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
    IonCol,
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
  
  
  constructor(
    private flightService: FlightService,
    private storageService: StorageService,
  ) {
    const state = history.state;
    this.flight = state.flight || null;
  }

  async ngOnInit() {
    if (this.flight) {
      console.log('Flight Details:', this.flight);

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
  }


  async findPreviousFlight() {
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
    const startTime = Math.floor((scheduledDepartureUTC.getTime() - 5 * 24 * 60 * 60 * 1000) / 1000); // 5 days before
    const endTime = Math.floor(scheduledDepartureUTC.getTime() / 1000); // Scheduled departure

    try {
      // Step 1: Try fetching departures
      let flights = await this.flightService
        .getDeparturesWithArrival(origin, startTime, endTime, destination)
        .toPromise();

      console.log('Fetched flights (origin to destination):', flights);

      let previousFlight = flights.reduce((closest: any, current: any) => {
        const closestTimeDiff = Math.abs(closest.lastSeen - scheduledDepartureUTC.getTime() / 1000);
        const currentTimeDiff = Math.abs(current.lastSeen - scheduledDepartureUTC.getTime() / 1000);
        return currentTimeDiff < closestTimeDiff ? current : closest;
      }, flights[0]);

      // Step 2: If no previous flight is found, fallback to arrivals endpoint
      if (!previousFlight) {
        console.warn('No previous flight found from origin to destination. Trying arrivals endpoint...');
        
        flights = await this.flightService
          .getArrivalsAtAirport(destination, startTime, endTime)
          .toPromise();

        console.log('Fetched flights (arrivals at destination):', flights);

        previousFlight = flights
          .filter((flight: any) => flight.estDepartureAirport === origin) // Check the departure airport
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
    }
  }




  // loadFlightInfoFromOpenSky() {
  //   const departureAirport = this.flight.origin; 
  //   const arrivalAirport = this.flight.destination; 

  //   const scheduledOutUTC = new Date(this.flight.scheduled_out); // UTC time
  //   const startTime = new Date(scheduledOutUTC.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
  //   const endTime = new Date(scheduledOutUTC.getTime() + 4 * 60 * 60 * 1000)

  //   const startTimeUnix = Math.floor(startTime.getTime() / 1000); // Convert to Unix timestamp
  //   const endTimeUnix = Math.floor(endTime.getTime() / 1000); 

  //   // Call the FlightService to fetch departures within the time range
  //   this.flightService
  //     .getDeparturesWithArrival(departureAirport, startTimeUnix, endTimeUnix, arrivalAirport)
  //     .subscribe(
  //       (flights: any[]) => {
  //         console.log('Fetched Flights from OpenSky:', flights);

  //         // Match a flight by origin, destination, and time
  //         const matchingFlight = flights.find((flight) => {
  //           const matchesDepartureAirport = flight.estDepartureAirport === departureAirport;
  //           const matchesArrivalAirport = flight.estArrivalAirport === arrivalAirport;

  //           const flightDepartureTime = new Date(flight.firstSeen * 1000);
  //           const flightArrivalTime = new Date(flight.lastSeen * 1000);

  //           const matchesTimeRange =
  //             flightDepartureTime >= startTime && flightArrivalTime <= endTime;

  //           console.log(`Checking flight: ${flight.callsign}`);
  //           console.log(`Matches Departure Airport: ${matchesDepartureAirport}`);
  //           console.log(`Matches Arrival Airport: ${matchesArrivalAirport}`);
  //           console.log(`Matches Time Range: ${matchesTimeRange}`);

  //           return matchesDepartureAirport && matchesArrivalAirport && matchesTimeRange;
  //         });

  //         if (matchingFlight) {
  //           console.log('Matching Flight Found:', matchingFlight);

  //           this.openskyInfo = matchingFlight;
  //           this.saveOpenSkyInfoToLocalStorage(matchingFlight);
  //           this.loadFlightPathFromOpenSky();
  //         } else {
  //           console.error('No matching flights found for this flight.');
  //         }
  //       },
  //       (error) => {
  //         console.error('Error fetching OpenSky data:', error);
  //       }
  //     );
  // }

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
    this.flights = await this.storageService.getAllFlights();
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


  // saveOpenSkyInfoToLocalStorage(flightData: any) {
  //   const storedFlights = JSON.parse(localStorage.getItem('openskyInfo') || '[]');
  //   const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

  //   if (!storedFlights.some((stored: any) => stored.flightKey === flightKey)) {
  //     storedFlights.push({ ...flightData, flightKey });
  //     localStorage.setItem('openskyInfo', JSON.stringify(storedFlights));
  //     console.log('OpenSky info saved to localStorage:', flightData);
  //   }
  // }

  // savePreviousFlightToLocalStorage(key: string, flightData: any) {
  //   localStorage.setItem(key, JSON.stringify(flightData));
  //   console.log('Previous flight saved to localStorage:', flightData);
  // }

  // getPreviousFlightFromLocalStorage(key: string) {
  //   const storedFlight = localStorage.getItem(key);
  //   return storedFlight ? JSON.parse(storedFlight) : null;
  // }

  // saveFlightPathToLocalStorage(path: any[]) {
  //   const storedPaths = JSON.parse(localStorage.getItem('flightPaths') || '[]');
    
  //   const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

  //   if (!storedPaths.some((stored: any) => stored.flightKey === flightKey)) {
  //     storedPaths.push({ path, flightKey });
  //     localStorage.setItem('flightPaths', JSON.stringify(storedPaths));
  //     console.log('Flight path saved to localStorage:', path);
  //   }
  // }



  // getFlightPathFromLocalStorage() {
  //   const storedPaths = JSON.parse(localStorage.getItem('flightPaths') || '[]');
  //   const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

  //   const storedPath = storedPaths.find((stored: any) => stored.flightKey === flightKey);

  //   console.log('Retrieved flight path from localStorage:', storedPath?.path);
  //   return storedPath?.path || null;
  // }


  // getOpenSkyInfoFromLocalStorage() {
  //   const storedFlights = JSON.parse(localStorage.getItem('openskyInfo') || '[]');
  //   const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

  //   const storedFlight = storedFlights.find((stored: any) => stored.flightKey === flightKey);

  //   console.log('Retrieved OpenSky info from localStorage:', storedFlight);
  //   return storedFlight || null;
  // }
}
