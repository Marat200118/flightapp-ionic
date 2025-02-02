import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';


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
  profileId: string = '';   
  flights: Flight[] = [];   
  totalDistance: number = 0; 
  totalFlightTime: number = 0; 
  totalFlights: number = 0; 

  constructor(private storageService: StorageService, private supabase: SupabaseService) {}

  async ngOnInit() {
    const profile = await this.supabase.getProfile();
    if (!profile || !profile.id) {
      console.error('Profile not found.');
      return;
    }

    this.profileId = profile.id;

    await this.storageService.checkAndPrepareStorage(this.profileId);

    await this.loadFlights();
    this.calculateStatistics();
  }


  async loadFlights() {
    this.flights = await this.storageService.getAllFlights(this.profileId);
    console.log('Fetched flights:', this.flights);
  }

  calculateStatistics() {
    const completedFlights = this.flights.filter(
      (flight) => flight.actualFlight && new Date(flight.flightDetails.scheduled_out) < new Date()
    );

    this.totalFlights = completedFlights.length;

    completedFlights.forEach((flight) => {
      if (flight.actualFlight) {
        const flightPath = flight.actualFlight.flightPath;

        console.log('Flight Path:', flightPath);

        const validPath = flightPath
          .map(point => this.convertFlightPathPoint(point)) 
          .filter(point => point.latitude !== undefined && point.longitude !== undefined);

        console.log('Valid Path Points:', validPath);

        if (validPath.length > 1) {
          this.totalDistance += this.calculateFlightDistance(validPath);
        }

        if (flight.actualFlight.lastSeen && flight.actualFlight.firstSeen) {
          const flightTime = (flight.actualFlight.lastSeen - flight.actualFlight.firstSeen) / 3600;
          this.totalFlightTime += flightTime;
        }
      }
    });

    console.log('Total Distance:', this.totalDistance, 'km');
    console.log('Total Flight Time:', this.formatFlightTime(this.totalFlightTime));
    console.log('Total Flights:', this.totalFlights);
  }

  convertFlightPathPoint(point: any): { latitude: number; longitude: number } {
    if (Array.isArray(point) && point.length >= 3) {
      return { latitude: point[1], longitude: point[2] };
    }
    return point;
  }


  formatFlightTime(hours: number): string {
    const totalMinutes = Math.floor(hours * 60);
    const displayHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${displayHours} hours, ${minutes} minutes`;
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
    console.log('Calculating distance between points:', lat1, lon1, lat2, lon2);
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
