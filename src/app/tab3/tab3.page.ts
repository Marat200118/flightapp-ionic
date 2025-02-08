//tab3.page.ts

import { Component, OnInit } from '@angular/core';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CommonModule } from '@angular/common';
import { NavController } from '@ionic/angular';
import { SupabaseService, Profile } from '../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { AuthHeaderComponent } from '../components/auth-header/auth-header.component';

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
  IonImg,
  IonCardSubtitle,
  IonList,
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
      AuthHeaderComponent,
      IonImg,
      IonCardSubtitle,
      IonList,
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
    id: '',
    username: '',
    first_name: '',
    avatar_url: '',
  };

  email = ''; 

  constructor(private supabase: SupabaseService, private navCtrl: NavController,) {}

  ngOnInit() {
    this.loadProfile();
  }
  
  async loadProfile() {
    try {
      const profile = await this.supabase.getProfile();
      const user = await this.supabase.user;

      console.log('User:', user);
      console.log('Profile:', profile);

      if (profile) {
        this.profile = { ...this.profile, ...profile };
      }

      if (user) {
        this.email = user.email ?? '';
        if (user.user_metadata?.['avatar_url']) {
          this.profile.avatar_url = user.user_metadata['avatar_url'];
        }
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error.message);
    }
  }

  async signOut() {
    await this.supabase.signOut();
    this.navCtrl.navigateRoot('/auth/login');

  }
}