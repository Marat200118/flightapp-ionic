//tab1.page.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ViewChild, OnInit } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { SupabaseService } from '../services/supabase.service';
import { Profile } from '../services/supabase.service';
 

import {
  IonButton,
  IonButtons,
  IonContent,
  IonInput,
  IonItem,
  IonModal,
  IonIcon,
  IonImg,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonDatetime,
} from '@ionic/angular/standalone';
import { add } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonList,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButtons,
    IonContent,
    IonHeader,
    IonFab,
    IonFabButton,
    IonInput,
    IonItem,
    IonTitle,
    IonModal,
    IonIcon,
    IonImg,
    IonToolbar,
    IonDatetime,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class Tab1Page {
  @ViewChild('modal') modal!: IonModal;

  flights: Flight[] = [];
  profile: Profile | null = null;
  upcomingFlights: Flight[] = []; 
  previousFlights: Flight[] = [];
  ongoingFlights: Flight[] = [];
  flightNumber = '';
  flightDate = '';
  origin = '';
  destination = ''; 


  private apiBaseUrl = 'http://localhost:3000/api/schedules';
  private apiKey = 'wHf94IBGL2dxGFS13wlB5sbGS34bBfT3';

  constructor(private navCtrl: NavController, private http: HttpClient, private storageService: StorageService, private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.supabase.restoreSession();
    await this.loadProfile();
    if (this.profile?.id) {
      console.log('Profile loaded successfully:', this.profile);
      await this.loadFlightsFromStorage();
    } else {
      console.error('Failed to load profile or profile ID is missing.');
    }
  }

  async loadProfile(): Promise<void> {
    try {
      this.profile = await this.supabase.getProfile();
      if (this.profile) {
        console.log('Profile loaded successfully:', this.profile);
      } else {
        console.error('Profile not loaded or missing.');
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error.message);
    }
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async confirm() {
  console.log("Flight Number:", this.flightNumber, "Date:", this.flightDate, "Origin:", this.origin, "Destination:", this.destination);

  if (!this.flightNumber || !this.flightDate || !this.origin || !this.destination) {
    alert('Please enter all details.');
    return;
  }

  const selectedDate = new Date(this.flightDate); // Local time
  const flightDateUTC = selectedDate.toISOString(); // Convert to UTC

  const url = `http://localhost:3000/api/schedules`;

  const params = {
    dateStart: flightDateUTC.split('T')[0],
    dateEnd: this.getEndDate(flightDateUTC),
    flightNumber: this.flightNumber,
    origin: this.origin,
    destination: this.destination,
  };

  const headers = new HttpHeaders({ 'x-apikey': this.apiKey });
  this.http.get(url, { headers, params }).subscribe(
    async (response: any) => {
      console.log("API Response:", response);

      if (response.scheduled && response.scheduled.length > 0) {
        const flight = response.scheduled[0];

        if (!this.profile) {
          alert('User profile not loaded. Please try again.');
          return;
        }

        const userId = this.profile.id;

        const existingFlight = await this.storageService.getFlightById(flight.fa_flight_id, userId);
        if (existingFlight) {
          console.log('Flight already exists in storage:', existingFlight);
          alert('This flight is already saved.');
        } else {
          const flightRecord: Flight = {
            flightId: flight.fa_flight_id,
            flightDetails: flight,
            userId: userId,
            // previousFlightId: null,
            // actualFlightPathId: null,
          };


          await this.storageService.addFlight(flightRecord);
          this.flights.unshift(flightRecord);
          await this.loadFlightsFromStorage();
          this.modal.dismiss();
          console.log("Flight added to storage:", flightRecord);
        }
      } else {
        alert("No scheduled flights found for the provided details.");
      }
    },
    (error) => {
      console.error("Error fetching flight data:", error);
      alert("Failed to fetch flight data. Please try again.");
    }
  );
}

  // addFlightToStorage(flight: any) {
  //   const storedFlights = JSON.parse(localStorage.getItem("flights") || "[]");
  //   storedFlights.unshift(flight);
  //   localStorage.setItem("flights", JSON.stringify(storedFlights));
  // }

  getEndDate(date: string): string {
    const startDate = new Date(date.split('T')[0]); 
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
  }

  async loadFlightsFromStorage() {
    console.log('User profile at start of loadFlightsFromStorage:', this.profile);

    const userId = this.profile?.id;

    if (!this.profile?.id) {
      console.error('User ID is not available. Skipping flight storage loading.');
      return;
    }

    this.flights = await this.storageService.getAllFlights(this.profile.id);
    console.log('Fetched user-specific flights from storage:', this.flights);

    // Define the test flight
    const testFlight: Flight = {
      userId: this.profile?.id ?? '',
      flightId: 'UAL784-1736491986-airline-250p',
      flightDetails: {
        ident: 'LOT784',
        ident_icao: 'LOT784',
        ident_iata: 'LO784',
        actual_ident: null,
        actual_ident_icao: null,
        actual_ident_iata: null,
        aircraft_type: 'E75L',
        scheduled_in: '2025-01-24T13:50:00Z',
        scheduled_out: '2025-01-24T12:00:00Z',
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
      },
    };

    // Check if test flight already exists in storage
    const isTestFlightAdded = this.flights.some(
      (flight) => flight.flightId === testFlight.flightId && flight.userId === testFlight.userId
    );

    if (!isTestFlightAdded) {
      console.log('Adding test flight to storage...');
      await this.storageService.addFlight(testFlight);
      this.flights.unshift(testFlight);
    } else {
      console.log('Test flight already exists. Skipping add.');
    }

    // Organize flights
    const today = new Date();
    const now = new Date();

    this.upcomingFlights = this.flights.filter((flight) => {
      const scheduledDate = new Date(flight.flightDetails.scheduled_out);
      return scheduledDate >= today;
    });

    this.previousFlights = this.flights.filter((flight) => {
      const scheduledDate = new Date(flight.flightDetails.scheduled_out);
      return scheduledDate < today;
    });

    this.ongoingFlights = this.flights.filter((flight) => {
      const scheduledDeparture = new Date(flight.flightDetails.scheduled_out);
      const scheduledArrival = new Date(flight.flightDetails.scheduled_in);
      return scheduledDeparture <= now && scheduledArrival >= now;
    });

    console.log('Organized flights:', {
      upcomingFlights: this.upcomingFlights,
      previousFlights: this.previousFlights,
      ongoingFlights: this.ongoingFlights,
    });
  }


  getCodeshares(codeshares: any[]): string {
    if (!codeshares || codeshares.length === 0) {
      return '';
    }
    return codeshares.map((codeshare) => codeshare.ident).join(', ');
  }

  navigateToTracking(flight: Flight) {
    this.navCtrl.navigateForward('/tabs/tab2', {
      state: { flight },
    });
  }

  openFlightDetails(flight: any) {
    this.navCtrl.navigateForward('/flight-details', {
      state: { flight },
    });
  }

  async ionViewWillEnter() {
    if (!this.profile) {
      console.warn('Profile is not available yet. Skipping flight load.');
      return;
    }

    console.log('Profile available. Loading flights...');
    await this.loadFlightsFromStorage();
  }

}
