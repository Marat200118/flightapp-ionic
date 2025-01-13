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
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
  ],
})

export class FlightDetailsPage {
  flight: any; 
  flightPath: any[] = [];

  constructor(
    private flightService: FlightService 
  ) {
    const state = history.state;
    this.flight = state.flight || null;
  }

  ngOnInit() {
    if (this.flight) {
      this.loadFlightPath();
    }
  }

  loadFlightPath() {
    const scheduledOut = this.flight.scheduled_out; // Departure time (ISO format)
    const scheduledIn = this.flight.scheduled_in; // Arrival time (ISO format)
    const departureAirport = this.flight.origin; // Departure airport (ICAO code)
    const arrivalAirport = this.flight.destination; // Arrival airport (ICAO code)

    if (!scheduledOut || !scheduledIn || !departureAirport || !arrivalAirport) {
      console.error('Flight details are missing.');
      return;
    }

    this.flightService
      .getDeparturesWithArrival(departureAirport, scheduledOut, scheduledIn, arrivalAirport)
      .subscribe(
        (data: any) => {
          console.log('Filtered Departures:', data);
          if (data.length > 0) {
            this.flightPath = data;
          } else {
            console.error('No matching flights found.');
          }
        },
        (error) => {
          console.error('Error fetching flight path data:', error);
        }
      );
  }
}
