//login.page.ts

import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { CommonModule } from '@angular/common';
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
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonContent,
    HeaderComponent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonGrid,
    IonCol,
    IonRow,
    IonBackButton,
    FormsModule,
    IonCard,
    IonIcon,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    CommonModule,
    IonButton,

  ],
  // schemas: [
  //   CUSTOM_ELEMENTS_SCHEMA,
  // ]
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private navCtrl: NavController,
    private supabase: SupabaseService
  ) {}

  async login() {
    console.log('Login button clicked');
    // const loader = await this.supabase.createLoader();
    // await loader.present();
    console.log('Logging in with email:', this.email);

    try {
      const data = await this.supabase.signIn(this.email, this.password);
      console.log('Login successful:', data);

      this.supabase.createNotice('Login successful!');
      this.navCtrl.navigateRoot('/tabs/tab1');
    } catch (err: any) {
      console.error('Login failed:', err.message);
      this.supabase.createNotice(err.message);
    } finally {
      // loader.dismiss();
    }
  }

  async loginWithGoogle() {
    try {
      await this.supabase.signInWithGoogle();
      console.log('Google login successful!');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }


  goToSignUp() {
    this.navCtrl.navigateForward('/auth/signup');
  }
}