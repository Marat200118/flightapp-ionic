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
  flightNumber = '';
  flightDate = '';

  private apiBaseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private apiKey = 'wHf94IBGL2dxGFS13wlB5sbGS34bBfT3';

  constructor(private navCtrl: NavController, private http: HttpClient) {}

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  confirm() {
    console.log(this.flightNumber, this.flightDate);

    if (!this.flightNumber || !this.flightDate) {
      alert('Please enter all details.');
      return;
    }

    const url = `http://localhost:3000/api/schedules`;
    const headers = new HttpHeaders({ 'x-apikey': this.apiKey });

    const params = {
      dateStart: this.flightDate.split('T')[0], // Ensure only the date is sent
      dateEnd: this.getEndDate(this.flightDate), // Ensure only the date is sent
      flightNumber: this.flightNumber.replace(/^\D+/g, ''), // Remove non-numeric prefix
    };

    console.log("Request Params:", params);

    this.http.get(url, { headers, params }).subscribe(
      (response: any) => {
        console.log('API Response (Full):', response);

        if (response.scheduled && response.scheduled.length > 0) {
          response.scheduled.forEach((flight: any) => {
            const newFlight = {
              id: Date.now(),
              flightNumber: flight.ident_iata || flight.actual_ident_iata || "Unknown",
              originAirport: flight.origin_iata || flight.origin_icao || "Unknown",
              destinationAirport:
                flight.destination_iata || flight.destination_icao || "Unknown",
              date: flight.scheduled_out,
            };

            console.log("Adding Flight to Home Screen:", newFlight);

            this.flights.push(newFlight);
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
    const startDate = new Date(date.split('T')[0]); // Strip time if present
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
  }

  // onWillDismiss(event: CustomEvent<OverlayEventDetail>) {
  //   if (event.detail.role === 'confirm' && event.detail.data) {
  //     this.flights.push(event.detail.data);
  //   }
  // }

  openFlightDetails(flight: any) {
    this.navCtrl.navigateForward(`/flight-details/${flight.id}`);
  }
}
