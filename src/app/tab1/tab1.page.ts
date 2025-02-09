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
import { AlertController } from '@ionic/angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StorageService } from '../services/storage.service';
import { Flight } from '../models/flight.model';
import { SupabaseService } from '../services/supabase.service';
import { Profile } from '../services/supabase.service';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';
 

import {
  IonButton,
  IonButtons,
  IonContent,
  IonInput,
  IonItem,
  IonModal,
  IonItemSliding,
  IonItemOption,
  IonAlert,
  IonItemOptions,
  IonSpinner,
  IonIcon,
  IonImg,
  IonHeader,
  IonTitle,
  ToastController,
  IonToolbar,
  IonCard,
  IonBadge,
  IonLabel,
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
    IonItemSliding,
    IonItemOption,
    IonSpinner,
    IonItemOptions,
    IonCard,
    IonList,
    IonCardHeader,
    IonicModule,
    IonCardContent,
    IonLabel,
    IonCardTitle,
    IonButtons,
    AuthHeaderComponent,
    IonBadge,
    IonContent,
    IonHeader,
    IonFab,
    IonFabButton,
    IonInput,
    IonAlert,
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
  isLoading = false;
  private isToastVisible = false;
  

  private apiBaseUrl = 'https://flight-api-backend.vercel.app/api/schedules';
  private apiKey = 'wHf94IBGL2dxGFS13wlB5sbGS34bBfT3';

  constructor(
    private navCtrl: NavController, 
    private http: HttpClient, 
    private storageService: StorageService, 
    private supabase: SupabaseService,
    private alertController: AlertController,
    private toastCtrl: ToastController,
  ) {
  }

  async ngOnInit() {
    this.setLoading(true, 'Loading profile...');
    await this.loadProfile();
    this.setLoading(false, 'Profile loaded.');

    if (this.profile?.id) {
      this.setLoading(true, 'Loading flights...');
      await this.loadFlightsFromStorage();
      this.setLoading(false);
    } else {
      this.presentToast('Profile not loaded. Please try again.', 'danger', 'top');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning', position: 'top' | 'middle' | 'bottom') {
    if (this.isToastVisible) {
      return;
    }

    try {
      this.isToastVisible = true;

      const toast = await this.toastCtrl.create({
        message,
        color,
        duration: 3000,
        position,
      });

      toast.onWillDismiss().then(() => {
        this.isToastVisible = false;
      });

      await toast.present();

    } catch (error) {
      this.isToastVisible = false;
    }
  }


  async loadProfile(): Promise<void> {
    try {
      this.profile = await this.supabase.getProfile();
      if (this.profile) {
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

  async deleteFlight(flight: Flight, slidingItem: IonItemSliding) {

    try {
      if (this.profile && this.profile.id) {
        await this.storageService.deleteFlightById(flight.flightId, this.profile.id);
        this.flights = this.flights.filter(f => f.flightId !== flight.flightId);
        await this.loadFlightsFromStorage();
        this.presentToast('Flight deleted successfully', 'success', 'top');
      } else {
        console.error('User profile is not available. Cannot delete flight.');
      }
    } catch (error) {
      console.error('Failed to delete flight:', error);
    } finally {
      slidingItem.close();
    }
  }

  getAlertButtons(flight: Flight, slidingItem: IonItemSliding) {
    return [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          slidingItem.close();
        },
      },
      {
        text: 'Delete',
        handler: async () => {
          await this.deleteFlight(flight, slidingItem);
        },
      },
    ];
  }


  async confirm() {

    if (!this.flightNumber || !this.flightDate || !this.origin || !this.destination) {
      this.presentToast('Please fill all fields', 'warning', 'top');
      return;
    }
    this.setLoading(true, 'Fetching flight details...');
    const selectedDate = new Date(this.flightDate);
    const flightDateUTC = selectedDate.toISOString();

    const url = this.apiBaseUrl;

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
        this.setLoading(false);

        if (response.scheduled && response.scheduled.length > 0) {
          const flight = response.scheduled[0];

          if (!this.profile) {
            alert('User profile not loaded. Please try again.');
            return;
          }

          const userId = this.profile.id;

          const existingFlight = await this.storageService.getFlightById(flight.fa_flight_id, userId);
          if (existingFlight) {
            alert('This flight is already saved.');
          } else {
            const flightRecord: Flight = {
              flightId: flight.fa_flight_id,
              flightDetails: flight,
              userId: userId,
            };


            await this.storageService.addFlight(flightRecord);
            this.flights.unshift(flightRecord);
            await this.loadFlightsFromStorage();
            this.modal.dismiss();
            this.presentToast('Flight added successfully', 'success', 'top');
          }
        } else {
        this.presentToast('No flights found for the given details', 'warning', 'top');
        }
      },
      (error) => {
        alert("Failed to fetch flight data. Please try again.");
      }
    );
  }

  getEndDate(date: string): string {
    const startDate = new Date(date.split('T')[0]); 
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
  }

  async loadFlightsFromStorage() {

    const userId = this.profile?.id;

    if (!this.profile?.id) {
      return;
    }

    this.flights = await this.storageService.getAllFlights(this.profile.id);
    this.presentToast('Flights loaded successfully', 'success', 'top');


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
      return;
    }

    await this.loadFlightsFromStorage();

  }

  codesharesAsString(codeshares: Array<{ ident_iata: string }>): string {
    if (!codeshares || codeshares.length === 0) {
      return '';
    }
    return codeshares.map((code) => code.ident_iata).join(', ');
  }

  setLoading(loading: boolean, message?: string) {
    this.isLoading = loading;
    if (message) {
    }
  }

}
