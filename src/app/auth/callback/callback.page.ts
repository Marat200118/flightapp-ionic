import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { IonButton, IonSpinner, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './callback.page.html',
  styleUrls: ['./callback.page.scss'],
  standalone: true,
  imports: [IonButton, IonSpinner, IonContent, IonHeader, IonTitle, IonToolbar],
})
export class AuthCallbackPage implements OnInit {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    try {

      const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = fragmentParams.get('access_token');
      const refreshToken = fragmentParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data, error } = await this.supabase.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: parseInt(fragmentParams.get('expires_in') || '3600', 10),
          token_type: fragmentParams.get('token_type') || 'bearer',
        });

        if (error) {
          console.error('Error setting session:', error.message);
          alert('Failed to sign in. Please try again.');
          this.router.navigate(['/login']);
          return;
        }

        console.log('OAuth callback successful:', data);
        alert('Signed in successfully!');
        this.router.navigate(['/tabs/tab1']);
      } else {
        console.warn('OAuth callback missing required parameters.');
        this.router.navigate(['/login']);
      }
    } catch (err) {
      console.error('Unexpected error during OAuth callback:', err);
      this.router.navigate(['/login']);
    }
  }
}
