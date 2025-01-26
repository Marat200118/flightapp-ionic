//login.page.ts

import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private navCtrl: NavController,
    private supabase: SupabaseService
  ) {}

  async login() {
    const loader = await this.supabase.createLoader();
    await loader.present();

    try {
      const { data, error } = await this.supabase.signIn(this.email, this.password);
      if (error) {
        throw new Error(error.message);
      }

      console.log('Login successful:', data.session);
      this.supabase.createNotice('Login successful!');
      this.navCtrl.navigateRoot('/tabs/tab1');
    } catch (err: any) {
      console.error('Login failed:', err.message);
      this.supabase.createNotice(err.message);
    } finally {
      loader.dismiss();
    }
  }

  goToSignUp() {
    this.navCtrl.navigateForward('/auth/signup');
  }
}