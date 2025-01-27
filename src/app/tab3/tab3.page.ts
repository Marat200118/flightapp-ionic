//tab3.page.ts

import { Component, OnInit } from '@angular/core';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CommonModule } from '@angular/common';
import { SupabaseService, Profile } from '../services/supabase.service';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonRow,
  IonCol,
  IonGrid,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
      IonContent,
      IonHeader,
      IonTitle,
      IonToolbar,
      FormsModule,
      IonButtons,
      IonGrid,
      IonCol,
      IonRow,
      IonBackButton,
      IonCard,
      IonIcon,
      IonCardHeader,
      IonCardTitle,
      IonCardContent,
      IonItem,
      IonLabel,
      IonInput,
      IonButton,
      CommonModule,
    ],
})
export class Tab3Page implements OnInit {
  profile: Profile = {
    username: '',
    first_name: '',
    avatar_url: '',
  };

  email = ''; 


  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.loadProfile();
  }

  
  async loadProfile() {
    try {
      const profile = await this.supabase.getProfile(); 
      if (profile) {
        this.profile = { ...this.profile, ...profile }; 
        console.log('Profile:', this.profile);
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error.message);
    }
  }

  async signOut() {
    await this.supabase.signOut();
  }
}