//statistics.page.ts

import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';
import { GaugeComponent } from '../components/gauge/gauge.component';
import { ProgressBarComponent } from '../components/progress-bar/progress-bar.component';
import { LineChartComponent } from '../components/line-chart/line-chart.component';

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
  IonLabel,
  IonCardHeader,
  IonCardTitle,
  IonNote,
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
      AuthHeaderComponent,
      IonNote,
      IonButtons,
      IonContent,
      IonHeader,
      IonFab,
      IonFabButton,
      IonInput,
      IonItem,
      IonLabel,
      IonTitle,
      IonModal,
      IonIcon,
      IonImg,
      GaugeComponent,
      ProgressBarComponent,
      LineChartComponent,
      IonToolbar,
      IonDatetime,
  ]})
export class StatisticsPage implements OnInit {
  profileId: string = '';   
  flights: Flight[] = [];   
  totalDistance: number = 0; 
  totalFlightTime: number = 0; 
  totalFlights: number = 0; 
  monthlyFlightHours: { month: string; hours: number }[] = [];
  achievements: string[] = [];

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

    const monthlyHours: { [key: string]: number } = {};

    completedFlights.forEach((flight) => {
      if (flight.actualFlight) {
        const flightDate = new Date(flight.flightDetails.scheduled_out);
        const monthKey = `${flightDate.getFullYear()}-${flightDate.getMonth() + 1}`;

        if (!monthlyHours[monthKey]) {
          monthlyHours[monthKey] = 0;
        }

        if (flight.actualFlight.lastSeen && flight.actualFlight.firstSeen) {
          const flightTime = (flight.actualFlight.lastSeen - flight.actualFlight.firstSeen) / 3600;
          this.totalFlightTime += flightTime;
          monthlyHours[monthKey] += flightTime;
        }

        if (flight.actualFlight.flightPath && flight.actualFlight.flightPath.length > 1) {
          const flightDistance = this.calculateFlightDistance(flight.actualFlight.flightPath);
          this.totalDistance += flightDistance;
          console.log(`Distance for flight ${flight.flightDetails.ident_iata}:`, flightDistance, 'km');
        }
      }
    });

    this.monthlyFlightHours = Object.entries(monthlyHours).map(([key, hours]) => ({
      month: key,
      hours: parseFloat(hours.toFixed(2)), 
    }));

    console.log('Monthly Flight Hours Data:', this.monthlyFlightHours);

    this.setAchievements();
  }


  setAchievements() {
    if (this.totalFlights >= 10) {
      this.achievements.push('10 Flights Completed');
    }
    if (this.totalDistance >= 10000) {
      this.achievements.push('10,000 km Traveled');
    }
    if (this.totalFlightTime >= 100) {
      this.achievements.push('100 Hours in Air');
    }
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

  calculateFlightDistance(flightPath: any[]): number {
    let distance = 0;

    const validPath = flightPath
      .map((point) => this.convertFlightPathPoint(point))
      .filter((point) => point.latitude !== undefined && point.longitude !== undefined);


    for (let i = 0; i < validPath.length - 1; i++) {
      const pointA = validPath[i];
      const pointB = validPath[i + 1];

      if (pointA && pointB) {
        distance += this.calculateDistanceBetweenPoints(pointA.latitude, pointA.longitude, pointB.latitude, pointB.longitude);
      } else {
        console.warn('Invalid points detected:', pointA, pointB);
      }
    }

    console.log('Total Distance Calculated:', distance);
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

    return R * c; 
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
