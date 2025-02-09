//login.page.ts

import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { CommonModule } from '@angular/common';
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { Provider } from '@supabase/supabase-js';

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
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private navCtrl: NavController,
    private supabase: SupabaseService
  ) {}

  async login() {

    try {
      const data = await this.supabase.signIn(this.email, this.password);
      this.supabase.createNotice('Login successful!');
      this.navCtrl.navigateRoot('/tabs/tab1');
    } catch (err: any) {
      console.error('Login failed:', err.message);
      this.supabase.createNotice(err.message);
    }
  }

  async loginWithGoogle() {
    try {
      const redirectTo = Capacitor.isNativePlatform()
        ? 'myapp://auth/callback'
        : window.location.origin + '/auth/callback';

      const { data } = await this.supabase.signInWithOAuth({
        provider: 'google' as Provider,
        redirectTo,
      });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  goToSignUp() {
    this.navCtrl.navigateForward('/auth/signup');
  }
}