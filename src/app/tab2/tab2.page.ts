// tab2.page.ts

import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule, DatePipe } from '@angular/common';
// import { Network } from '@capacitor/network';
// import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { SupabaseService } from '../services/supabase.service';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';

import { LiveFlightPathMapComponent } from '../components/live-flight-map/live-flight-map.component';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonInput,
  IonItem,
  IonChip,
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
    AuthHeaderComponent,
    IonButtons,
    IonContent,
    IonChip,
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
  flightDuration: string | null = null;

  flightDetails: any = null; 
  previousFlightDuration: number | null = null; 

  constructor(private storageService: StorageService, private navCtrl: NavController, private supabase: SupabaseService) {}

  async ngOnInit() {

    const profile = await this.supabase.getProfile();
    if (!profile || !profile.id) {
      console.error('User profile not found.');
      return;
    }

    const userId = profile.id;

     const flights = await this.storageService.getAllFlights(userId);
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
      this.flightDetails = upcomingFlight.flightDetails;
      console.log('Upcoming flight:', this.flight);

      const departureTime = new Date(this.flightDetails.scheduled_out);
      const arrivalTime = new Date(this.flightDetails.scheduled_in);
      const durationInMs = arrivalTime.getTime() - departureTime.getTime();

      const totalMinutes = Math.floor(durationInMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      this.flightDuration = `${hours}h ${minutes}min`;


      if (this.flight.previousFlight?.flightPath) {
        console.log('Previous Flight Path:', this.flight.previousFlight.flightPath);
        this.flightPath = this.formatFlightPath(this.flight.previousFlight.flightPath);

        const firstPoint = this.flightPath[0];
        const lastPoint = this.flightPath[this.flightPath.length - 1];
        this.previousFlightDuration = lastPoint.timestamp - firstPoint.timestamp;

        console.log('Previous Flight Duration (seconds):', this.previousFlightDuration);

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
    if (!this.flight || !this.flightPath.length || !this.previousFlightDuration) return;

    const now = Date.now() / 1000;
    const scheduledDeparture = Math.floor(
      new Date(this.flight.flightDetails.scheduled_out).getTime() / 1000
    );
    const scheduledArrival = Math.floor(
      new Date(this.flight.flightDetails.scheduled_in).getTime() / 1000
    );

    const elapsedTime = now - scheduledDeparture;
    const timeToDeparture = scheduledDeparture - now;
    const timeToArrival = scheduledArrival - now;

    if (timeToDeparture > 3600) {
      this.status = 'Waiting';
    } else if (timeToDeparture > 0) {
      this.status = 'Boarding';
    } else if (elapsedTime >= 0 && elapsedTime < 10 * 60) {
      this.status = 'Preparing for takeoff';
    } else if (elapsedTime >= 10 * 60 && elapsedTime < this.previousFlightDuration * 0.2) {
      this.status = 'Ascending';
    } else if (
      elapsedTime >= this.previousFlightDuration * 0.2 &&
      elapsedTime < this.previousFlightDuration * 0.8
    ) {
      this.status = 'Cruising';
    } else if (
      elapsedTime >= this.previousFlightDuration * 0.8 &&
      timeToArrival > 0
    ) {
      this.status = 'Descending';
    } else if (timeToArrival <= 0 && elapsedTime < this.previousFlightDuration + 600) {
      this.status = 'Taxiing to gate';
    } else {
      this.status = 'Arrived at destination';
    }

    console.log('Current Status:', this.status);
  }

  updatePlanePosition() {
    if (!this.flight || !this.flightPath.length) return;

    const now = Math.floor(Date.now() / 1000);
    const scheduledDeparture = Math.floor(
      new Date(this.flight.flightDetails.scheduled_out).getTime() / 1000
    );

    const elapsedTime = now - scheduledDeparture;

    this.currentAproximatePosition = this.calculateCurrentPosition(elapsedTime);

    if (this.status === 'Waiting') {
      this.currentAproximatePosition = this.flightPath[0];
    }
    console.log('Current Approximate Position:', this.currentAproximatePosition);
  }

  private calculateCurrentPosition(elapsedTime: number): { latitude: number; longitude: number } | null {
    if (!this.flightPath || this.flightPath.length < 2 || elapsedTime < 0) return null;

    const totalDuration = this.previousFlightDuration!;
    if (elapsedTime > totalDuration) {
  
      const lastPoint = this.flightPath[this.flightPath.length - 1];
      return { latitude: lastPoint.latitude, longitude: lastPoint.longitude };
    }

    const totalPathPoints = this.flightPath.length;
    const relativeTime = elapsedTime / totalDuration;

    const mappedIndex = Math.floor(relativeTime * (totalPathPoints - 1));
    const nextIndex = Math.min(mappedIndex + 1, totalPathPoints - 1);

    const start = this.flightPath[mappedIndex];
    const end = this.flightPath[nextIndex];

    if (!start || !end) return null;

    const segmentDuration = end.timestamp - start.timestamp;
    const segmentElapsedTime = elapsedTime - start.timestamp;

    if (segmentDuration <= 0 || segmentElapsedTime < 0) {
      return { latitude: start.latitude, longitude: start.longitude };
    }

    const segmentProgress = Math.min(1, Math.max(0, segmentElapsedTime / segmentDuration));

    return {
      latitude: start.latitude + segmentProgress * (end.latitude - start.latitude),
      longitude: start.longitude + segmentProgress * (end.longitude - start.longitude),
    };
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
