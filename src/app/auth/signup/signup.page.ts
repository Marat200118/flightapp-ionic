//signup.page.ts

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
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
  IonAvatar,
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
    CommonModule,
    IonToolbar,
    HeaderComponent,
    IonButtons,
    IonGrid,
    IonCol,
    IonAvatar,
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
  firstName = '';
  username = '';
  avatarFile: File | null = null;
  previewAvatar: string | ArrayBuffer | null = null;

  constructor(private navCtrl: NavController, private supabase: SupabaseService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.avatarFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewAvatar = e.target?.result ?? null; 
    };
    reader.readAsDataURL(file);
  }


  async signUp() {
    try {
      const avatarUrl = '';
      const user = await this.supabase.signUp(this.email, this.password, {
        first_name: this.firstName,
        username: this.username,
        avatar_url: avatarUrl,
      });

      if (user) {
        this.supabase.createNotice('Signup successful! Logging you in...');
        await this.supabase.restoreSession();
        this.navCtrl.navigateRoot('/tabs/tab1');
      }
    } catch (error: any) {
      console.error('Sign-up failed:', error.message);
      this.supabase.createNotice(error.message);
    }
  }

  async signUpWithGoogle() {
    try {
      await this.supabase.signUpWithGoogle();
      // Note: After the OAuth flow completes, the user will be redirected.
    } catch (error) {
      console.error('Error during Google sign-up:', error);
    }
  }


  goToLogin() {
    this.navCtrl.navigateForward('/auth/login');
  }
}
