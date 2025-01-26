//signup.page.ts

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
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
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
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
    FormsModule,
  ],
})
export class SignupPage {
  email = '';
  password = '';

  constructor(private navCtrl: NavController, private supabase: SupabaseService) {}

  async signUp() {
    try {
      const { data, error } = await this.supabase.signUp(this.email, this.password);
      if (error) throw error;

      if (data?.user) {
        this.supabase.createNotice('Signup successful! Please log in.');
        this.navCtrl.navigateRoot('/auth/login');
      }
    } catch (error: any) {
      this.supabase.createNotice(error.message);
    }
  }

  goToLogin() {
    this.navCtrl.navigateForward('/auth/login');
  }
}
