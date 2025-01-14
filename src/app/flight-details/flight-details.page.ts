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
      }
    }
  }

  loadFlightInfoFromOpenSky() {
    const departureAirport = this.flight.origin;
    const arrivalAirport = this.flight.destination;
    const startTime = '2025-01-12T10:00:00Z';
    const endTime = '2025-01-12T16:00:00Z';

    this.flightService
      .getDeparturesWithArrival(departureAirport, startTime, endTime, arrivalAirport)
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
            console.error('No matching flights found for test flight.');
          }
        },
        (error) => {
          console.error('Error fetching OpenSky data:', error);
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
    storedFlights.push(flightData);
    localStorage.setItem('openskyInfo', JSON.stringify(storedFlights));
    console.log('OpenSky info saved to localStorage:', flightData);
  }

  getOpenSkyInfoFromLocalStorage() {
    const storedFlights = JSON.parse(localStorage.getItem('openskyInfo') || '[]');
    const flightIdent = this.flight.ident;

    const storedFlight = storedFlights.find(
      (stored: any) => stored.callsign?.startsWith(flightIdent.slice(0, 3))
    );

    console.log('Retrieved OpenSky info from localStorage:', storedFlight);
    return storedFlight || null;
  }
}
