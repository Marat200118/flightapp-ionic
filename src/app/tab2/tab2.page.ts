//tab2.page.ts

import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { CommonModule, DatePipe } from '@angular/common';
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
  message: string = ''; 

  constructor(private storageService: StorageService, private navCtrl: NavController) {}

  async ngOnInit() {
    const flights = await this.storageService.getAllFlights();
    console.log('Fetched flights from storage:', flights);

    const now = new Date();
    const upcomingFlight = flights.find((flight: Flight) => {
      const scheduledDeparture = new Date(flight.flightDetails.scheduled_out);
      const timeToDeparture = (scheduledDeparture.getTime() - now.getTime()) / (1000 * 60 * 60);
      return timeToDeparture > 0 && timeToDeparture <= 24; 
    });

    if (upcomingFlight) {
      this.flight = upcomingFlight;
      console.log('Upcoming flight:', this.flight);

      if (!this.flight.previousFlight) {
        console.warn('No previous flight data available.');
      }
    } else {
      this.message = 'No upcoming flights within the next 24 hours.';
      console.log(this.message);
    }
  }

  goBackToMain() {
    this.navCtrl.navigateBack('/tabs/tab1');
  }
}
