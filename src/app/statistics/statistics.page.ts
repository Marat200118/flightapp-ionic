import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


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

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  standalone: true,
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
  ]})
export class StatisticsPage implements OnInit {
  profileId: string = '';    // Store the user's profile ID
  flights: Flight[] = [];    // All flights
  totalDistance: number = 0; // Total kilometers traveled
  totalFlightTime: number = 0; // Total time spent in air (hours)
  totalFlights: number = 0;  // Number of completed flights

  constructor(private storageService: StorageService) {}

  async ngOnInit() {
    this.profileId = 'user-profile-id-placeholder'; 

    // Load flights and calculate statistics
    await this.loadFlights();
    this.calculateStatistics();
  }

  async loadFlights() {
    this.flights = await this.storageService.getAllFlights(this.profileId);
    console.log('Fetched flights:', this.flights);
  }

  calculateStatistics() {
    // Filter only past flights that have actualFlight data
    const completedFlights = this.flights.filter(
      (flight) => flight.actualFlight && new Date(flight.flightDetails.scheduled_out) < new Date()
    );

    this.totalFlights = completedFlights.length;

    completedFlights.forEach((flight) => {
      if (flight.actualFlight) {
        const flightPath = flight.actualFlight.flightPath;

        // Calculate total distance traveled using the flight path
        if (flightPath && flightPath.length > 1) {
          this.totalDistance += this.calculateFlightDistance(flightPath);
        }

        // Calculate flight time (in hours)
        const flightTime = (flight.actualFlight.lastSeen - flight.actualFlight.firstSeen) / 3600; // Convert seconds to hours
        this.totalFlightTime += flightTime;
      }
    });

    console.log('Total Distance:', this.totalDistance, 'km');
    console.log('Total Flight Time:', this.totalFlightTime, 'hours');
    console.log('Total Flights:', this.totalFlights);
  }

  calculateFlightDistance(flightPath: { latitude: number; longitude: number }[]): number {
    let distance = 0;

    for (let i = 0; i < flightPath.length - 1; i++) {
      const pointA = flightPath[i];
      const pointB = flightPath[i + 1];
      distance += this.calculateDistanceBetweenPoints(pointA.latitude, pointA.longitude, pointB.latitude, pointB.longitude);
    }

    return distance;
  }

  calculateDistanceBetweenPoints(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
