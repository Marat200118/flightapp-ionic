// tab2.page.ts

import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule, DatePipe } from '@angular/common';
import { LiveFlightPathMapComponent } from '../components/live-flight-map/live-flight-map.component';
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
  IonDatetime,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule,
    LiveFlightPathMapComponent,
    IonButton,
    IonCard,
    IonList,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonTitle,
    IonModal,
    IonIcon,
    IonImg,
    IonToolbar,
    IonDatetime,
  ],
})
export class Tab2Page implements OnInit {
  flight: Flight | null = null; 
  flightPath: { latitude: number; longitude: number, timestamp: number }[] = [];
  status: string = '';
  currentAproximatePosition: { latitude: number; longitude: number } | null = null;
  message: string = ''; 
  private intervalId: any;

  constructor(private storageService: StorageService, private navCtrl: NavController) {}

  async ngOnInit() {
    const flights = await this.storageService.getAllFlights();
    console.log('Fetched flights from storage:', flights);
    console.log('Flight Path:', this.flightPath);

    const now = new Date();
    const upcomingFlight = flights.find((flight: Flight) => {
      const scheduledArrival = new Date(flight.flightDetails.scheduled_in);
      const timeToDeparture = (scheduledArrival.getTime() - now.getTime()) / (1000 * 60 * 60);
      return timeToDeparture > 0 && timeToDeparture <= 12; 
    });

    if (upcomingFlight) {
      this.flight = upcomingFlight;
      console.log('Upcoming flight:', this.flight);

    if (this.flight.previousFlight?.flightPath) {
      console.log('Previous Flight Path:', this.flight.previousFlight.flightPath);
      this.flightPath = this.formatFlightPath(this.flight.previousFlight.flightPath);
      this.startLiveUpdates();
    } else {
      console.warn('No previous flight path available:', this.flight.previousFlight);
    }

    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  goBackToMain() {
    this.navCtrl.navigateBack('/tabs/tab1');
  }

  updateFlightStatus() {
    if (!this.flight || !this.flightPath.length) return;

    const now = Date.now() / 1000; // Current time in seconds
    const scheduledDeparture = new Date(this.flight.flightDetails.scheduled_out).getTime() / 1000;
    const boardingStart = scheduledDeparture - 30 * 60;

    if (now < boardingStart) {
      this.status = 'Waiting';
    } else if (now >= boardingStart && now < scheduledDeparture) {
      this.status = 'Boarding';
    } else {
      const flightDuration =
        this.flightPath[this.flightPath.length - 1].timestamp - this.flightPath[0].timestamp;
      const elapsedTime = now - scheduledDeparture;
      const progress = elapsedTime / flightDuration;

      if (progress <= 0.2) {
        this.status = 'Climbing';
      } else if (progress > 0.2 && progress <= 0.8) {
        this.status = 'Cruising';
      } else if (progress > 0.8 && progress <= 1) {
        this.status = 'Descending';
      } else {
        this.status = 'Landed';
      }
    }
  }

  updatePlanePosition() {
    if (!this.flight || !this.flightPath.length) return;

    const now = Date.now() / 1000;
    const scheduledDeparture = new Date(this.flight.flightDetails.scheduled_out).getTime() / 1000;
    const elapsedTime = now - scheduledDeparture;

    const timestamps = this.flightPath.map((point) => point.timestamp);
    const closestIndex = timestamps.findIndex((time) => time >= elapsedTime);

    if (closestIndex === -1 || closestIndex >= timestamps.length) {
      console.warn('Plane position is out of bounds:', elapsedTime);
      this.currentAproximatePosition = null;
      return;
    }

    if (closestIndex > 0) {
      const start = this.flightPath[closestIndex - 1];
      const end = this.flightPath[closestIndex];

      const progress = (elapsedTime - start.timestamp) / (end.timestamp - start.timestamp);
      this.currentAproximatePosition = {
        latitude: start.latitude + progress * (end.latitude - start.latitude),
        longitude: start.longitude + progress * (end.longitude - start.longitude),
      };
    } else {
      this.currentAproximatePosition = {
        latitude: this.flightPath[0].latitude,
        longitude: this.flightPath[0].longitude,
      };
    }

    console.log('Current Approximate Position:', this.currentAproximatePosition);
  }


  startLiveUpdates() {
    this.intervalId = setInterval(() => {
      this.updateFlightStatus();
      this.updatePlanePosition();
    }, 1000);
  }

  formatFlightPath(flightPath: any[]): { timestamp: number; latitude: number; longitude: number }[] {
    const formatted = flightPath.map((point) => ({
      timestamp: point[0],
      latitude: point[1],
      longitude: point[2],
    }));
    console.log('Formatted Flight Path:', formatted);
    return formatted;
  }

}
