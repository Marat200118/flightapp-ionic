import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../services/flight.service';
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
    this.openskyInfo = this.flight.openskyInfo || this.getOpenSkyInfoFromLocalStorage();

    if (!this.openskyInfo) {
      this.loadFlightInfoFromOpenSky();
    } else {
      this.loadFlightPathFromOpenSky();
    }
  }
}

  loadFlightInfoFromOpenSky() {
    const departureAirport = this.flight.origin;
    const arrivalAirport = this.flight.destination;

    const scheduledOut = new Date(this.flight.scheduled_out);
    const startTime = new Date(scheduledOut.getTime() - 2 * 60 * 60 * 1000); 
    const endTime = new Date(scheduledOut.getTime() + 4 * 60 * 60 * 1000); 

    const startTimeISO = startTime.toISOString();
    const endTimeISO = endTime.toISOString();

    this.flightService
      .getDeparturesWithArrival(departureAirport, startTimeISO, endTimeISO, arrivalAirport)
      .subscribe(
        (flights: any[]) => {
          console.log('Fetched Flights from OpenSky:', flights);

          const airlinePrefix = this.getAirlinePrefix(this.flight.ident_icao);

          const matchingFlight = flights.find((flight) => {
            const matchesArrivalAirport = flight.estArrivalAirport === arrivalAirport;
            const matchesAirlinePrefix = this.matchAirlinePrefix(flight.callsign, airlinePrefix);

            console.log(`Checking flight: ${flight.callsign}`);
            console.log(`Matches Arrival Airport: ${matchesArrivalAirport}`);
            console.log(`Matches Airline Prefix: ${matchesAirlinePrefix}`);

            return matchesArrivalAirport && matchesAirlinePrefix;
          });

          if (matchingFlight) {
            console.log('Matching Flight Found:', matchingFlight);
            this.openskyInfo = matchingFlight;
            this.saveOpenSkyInfoToLocalStorage(matchingFlight);
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

    const icao24 = this.openskyInfo.icao24.toLowerCase(); // Use lower case as required by the API
    const time = this.openskyInfo.firstSeen; // Use the departure time (firstSeen)

    // Check if the flight path is already in localStorage
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
          this.openskyInfo.path = data.path; // Attach the flight path to the flight details
          this.saveFlightPathToLocalStorage(data.path); // Save the path to localStorage
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
