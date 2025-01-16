//flight-details.page.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../services/flight.service';
import { airplaneOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
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
    IonBackButton,
    IonCard,
    IonIcon,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
  ],
})


export class FlightDetailsPage {
  flight: any; 
  openskyInfo: any = null;
  

  constructor(
    private flightService: FlightService 
  ) {
    const state = history.state;
    this.flight = state.flight || null;
  }

  ngOnInit() {
    if (this.flight) {
      const now = new Date();
      const scheduledDeparture = new Date(this.flight.scheduled_out);

      // Check if the flight is upcoming (less than 6 hours from now)
      if (scheduledDeparture.getTime() > now.getTime()) {
        const timeDifference = (scheduledDeparture.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (timeDifference <= 6) {
          this.findPreviousFlight();
        }
      } else {
        this.openskyInfo = this.flight.openskyInfo || this.getOpenSkyInfoFromLocalStorage();
        if (!this.openskyInfo) {
          this.loadFlightInfoFromOpenSky();
        } else {
          this.loadFlightPathFromOpenSky();
        }
      }
    }
  }

  findPreviousFlight() {
    const departureAirport = this.flight.origin;
    const arrivalAirport = this.flight.destination;

    // Time range: 48 hours before the scheduled departure
    const scheduledDepartureUTC = new Date(this.flight.scheduled_out);
    const startTime = Math.floor((scheduledDepartureUTC.getTime() - 48 * 60 * 60 * 1000) / 1000); 
    const endTime = Math.floor(scheduledDepartureUTC.getTime() / 1000); 

    console.log('Fetching previous flights with the following parameters:');
    console.log(`Departure Airport: ${departureAirport}`);
    console.log(`Arrival Airport: ${arrivalAirport}`);
    console.log(`Start Time (Unix): ${startTime}`);
    console.log(`End Time (Unix): ${endTime}`);

    this.flightService
      .getDeparturesWithArrival(departureAirport, startTime, endTime, arrivalAirport)
      .subscribe(
        (flights: any[]) => {
          console.log('Previous Flights Fetched:', flights);

          const previousFlight = flights.find((flight) => {
            const matchesDepartureAirport = flight.estDepartureAirport === departureAirport;
            const matchesArrivalAirport = flight.estArrivalAirport === arrivalAirport;

            const flightDepartureTime = flight.firstSeen * 1000; 
            const matchesTimeRange =
              flightDepartureTime >= startTime * 1000 && flightDepartureTime <= endTime * 1000;

            console.log(`Checking flight: ${flight.callsign}`);
            console.log(`Matches Departure Airport: ${matchesDepartureAirport}`);
            console.log(`Matches Arrival Airport: ${matchesArrivalAirport}`);
            console.log(`Matches Time Range: ${matchesTimeRange}`);

            return matchesDepartureAirport && matchesArrivalAirport && matchesTimeRange;
          });

          if (previousFlight) {
            console.log('Previous Flight Found:', previousFlight);

            this.openskyInfo = previousFlight;
            this.saveOpenSkyInfoToLocalStorage(previousFlight);

            this.loadFlightPathFromOpenSky();
          } else {
            console.error('No previous flight found for this route and time range.');
          }
        },
        (error) => {
          console.error('Error fetching previous flights:', error);
        }
      );
  }



  loadFlightInfoFromOpenSky() {
    const departureAirport = this.flight.origin; 
    const arrivalAirport = this.flight.destination; 

    const scheduledOutUTC = new Date(this.flight.scheduled_out); // UTC time
    const startTime = new Date(scheduledOutUTC.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const endTime = new Date(scheduledOutUTC.getTime() + 4 * 60 * 60 * 1000)

    const startTimeUnix = Math.floor(startTime.getTime() / 1000); // Convert to Unix timestamp
    const endTimeUnix = Math.floor(endTime.getTime() / 1000); 

    // Call the FlightService to fetch departures within the time range
    this.flightService
      .getDeparturesWithArrival(departureAirport, startTimeUnix, endTimeUnix, arrivalAirport)
      .subscribe(
        (flights: any[]) => {
          console.log('Fetched Flights from OpenSky:', flights);

          // Match a flight by origin, destination, and time
          const matchingFlight = flights.find((flight) => {
            const matchesDepartureAirport = flight.estDepartureAirport === departureAirport;
            const matchesArrivalAirport = flight.estArrivalAirport === arrivalAirport;

            const flightDepartureTime = new Date(flight.firstSeen * 1000);
            const flightArrivalTime = new Date(flight.lastSeen * 1000);

            const matchesTimeRange =
              flightDepartureTime >= startTime && flightArrivalTime <= endTime;

            console.log(`Checking flight: ${flight.callsign}`);
            console.log(`Matches Departure Airport: ${matchesDepartureAirport}`);
            console.log(`Matches Arrival Airport: ${matchesArrivalAirport}`);
            console.log(`Matches Time Range: ${matchesTimeRange}`);

            return matchesDepartureAirport && matchesArrivalAirport && matchesTimeRange;
          });

          if (matchingFlight) {
            console.log('Matching Flight Found:', matchingFlight);

            this.openskyInfo = matchingFlight;
            this.saveOpenSkyInfoToLocalStorage(matchingFlight);
            this.loadFlightPathFromOpenSky();
          } else {
            console.error('No matching flights found for this flight.');
          }
        },
        (error) => {
          console.error('Error fetching OpenSky data:', error);
        }
      );
  }

  loadFlightPathFromOpenSky() {
    if (!this.openskyInfo || !this.openskyInfo.icao24) {
      console.error('No icao24 information available for this flight.');
      return;
    }

    const icao24 = this.openskyInfo.icao24.toLowerCase();
    const time = this.openskyInfo.firstSeen;

    const storedPath = this.getFlightPathFromLocalStorage();
    if (storedPath) {
      console.log('Using stored flight path from localStorage:', storedPath);
      this.openskyInfo.path = storedPath;
      return;
    }

    this.flightService.getFlightPath(icao24, time).subscribe(
      (data: any) => {
        console.log('Flight Path Data:', data);

        if (data && data.path) {
          this.openskyInfo.path = data.path;
          this.saveFlightPathToLocalStorage(data.path);
        } else {
          console.warn('No path data available for this flight.');
        }
      },
      (error) => {
        console.error('Error fetching flight path data:', error);
      }
    );
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

  saveOpenSkyInfoToLocalStorage(flightData: any) {
    const storedFlights = JSON.parse(localStorage.getItem('openskyInfo') || '[]');
    const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

    if (!storedFlights.some((stored: any) => stored.flightKey === flightKey)) {
      storedFlights.push({ ...flightData, flightKey });
      localStorage.setItem('openskyInfo', JSON.stringify(storedFlights));
      console.log('OpenSky info saved to localStorage:', flightData);
    }
  }

  saveFlightPathToLocalStorage(path: any[]) {
    const storedPaths = JSON.parse(localStorage.getItem('flightPaths') || '[]');
    
    const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

    if (!storedPaths.some((stored: any) => stored.flightKey === flightKey)) {
      storedPaths.push({ path, flightKey });
      localStorage.setItem('flightPaths', JSON.stringify(storedPaths));
      console.log('Flight path saved to localStorage:', path);
    }
  }

  getFlightPathFromLocalStorage() {
    const storedPaths = JSON.parse(localStorage.getItem('flightPaths') || '[]');
    const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

    const storedPath = storedPaths.find((stored: any) => stored.flightKey === flightKey);

    console.log('Retrieved flight path from localStorage:', storedPath?.path);
    return storedPath?.path || null;
  }


  getOpenSkyInfoFromLocalStorage() {
    const storedFlights = JSON.parse(localStorage.getItem('openskyInfo') || '[]');
    const flightKey = `${this.flight.origin}-${this.flight.destination}-${this.flight.scheduled_out}`;

    const storedFlight = storedFlights.find((stored: any) => stored.flightKey === flightKey);

    console.log('Retrieved OpenSky info from localStorage:', storedFlight);
    return storedFlight || null;
  }
}
