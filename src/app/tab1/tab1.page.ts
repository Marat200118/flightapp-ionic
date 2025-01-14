import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonInput,
  IonItem,
  IonModal,
  IonTitle,
  IonToolbar,
  IonDatetime,
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    // IonButton,
    // IonButtons,
    // IonContent,
    // IonInput,
    // IonItem,
    // IonModal,
    // IonTitle,
    // IonDatetime,
    // IonToolbar,
  ],
})
export class Tab1Page {
  @ViewChild('modal') modal!: IonModal;

  flights: any[] = [];
  upcomingFlights: any[] = [];
  previousFlights: any[] = [];
  flightNumber = '';
  flightDate = '';

  private apiBaseUrl = 'http://localhost:3000/api/schedules';
  private apiKey = 'wHf94IBGL2dxGFS13wlB5sbGS34bBfT3';

  constructor(private navCtrl: NavController, private http: HttpClient) {}

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async confirm() {
    console.log(this.flightNumber, this.flightDate);

    if (!this.flightNumber || !this.flightDate) {
      alert('Please enter all details.');
      return;
    }

    const url = `http://localhost:3000/api/schedules`;

    const params = {
      dateStart: this.flightDate.split('T')[0], 
      dateEnd: this.getEndDate(this.flightDate),
      flightNumber: this.flightNumber,
    };

    console.log('Request Params:', params);

    const headers = new HttpHeaders({ 'x-apikey': this.apiKey });
    this.http.get(this.apiBaseUrl, { headers, params }).subscribe(
      async (response: any) => {
        console.log('API Response (Full):', response);

        if (response.scheduled && response.scheduled.length > 0) {
          response.scheduled.forEach(async (flight: any) => {
            const newFlight = {
              id: Date.now(),
              ...flight,
            };

            console.log('Adding Flight to Home Screen:', newFlight);

            this.flights.push(newFlight);

            const storedFlights = JSON.parse(localStorage.getItem('flights') || '[]');
            storedFlights.push(newFlight);
            localStorage.setItem('flights', JSON.stringify(storedFlights));
          });

          this.modal.dismiss(null, 'confirm');
        } else {
          alert('No scheduled flights found for the provided details.');
        }
      },
      (error) => {
        console.error('Error fetching flight data:', error);
        alert('Failed to fetch flight data. Please try again.');
      }
    );
  }

  getEndDate(date: string): string {
    const startDate = new Date(date.split('T')[0]); 
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
  }

  async loadFlightsFromStorage() {
    const storedFlights = JSON.parse(localStorage.getItem('flights') || '[]');
    const today = new Date();


    const testFlight = {
      id: Date.now(),
      ident: 'LOT784',
      ident_icao: 'LOT784',
      ident_iata: 'LO784',
      actual_ident: null,
      actual_ident_icao: null,
      actual_ident_iata: null,
      aircraft_type: 'E75L',
      scheduled_in: '2025-01-12T13:50:00Z',
      scheduled_out: '2025-01-12T12:00:00Z',
      origin: 'EVRA',
      origin_icao: 'EVRA',
      origin_iata: 'RIX',
      origin_lid: null,
      destination: 'EPWA',
      destination_icao: 'EPWA',
      destination_iata: 'WAW',
      destination_lid: null,
      fa_flight_id: 'UAL784-1736491986-airline-250p',
      meal_service: 'Business: Snack or brunch / Economy: Food for sale',
      seats_cabin_business: 3,
      seats_cabin_coach: 76,
      seats_cabin_first: 0,
      isTest: true,
    };

    this.upcomingFlights = storedFlights.filter((flight: any) => {
      const scheduledDate = new Date(flight.scheduled_in);
      return scheduledDate >= today;
    });

    this.previousFlights = storedFlights.filter((flight: any) => {
      const scheduledDate = new Date(flight.scheduled_in);
      return scheduledDate < today;
    });


    const isTestFlightAdded = storedFlights.some(
      (flight: any) => flight.ident === testFlight.ident && flight.isTest
    );

    if (!isTestFlightAdded) {
      storedFlights.unshift(testFlight);
      localStorage.setItem('flights', JSON.stringify(storedFlights));
    }



    this.flights = storedFlights;
    console.log('Loaded Flights from Storage:', this.flights);
  }

  openFlightDetails(flight: any) {
    this.navCtrl.navigateForward('/flight-details', {
      state: { flight },
    });
  }

  ionViewWillEnter() {
    this.loadFlightsFromStorage();
  }

}
