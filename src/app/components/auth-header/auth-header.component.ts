import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonAvatar, IonImg, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'auth-app-header',
  templateUrl: './auth-header.component.html',
  styleUrls: ['./auth-header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonAvatar, IonImg, IonIcon, CommonModule]
})
export class AuthHeaderComponent implements OnInit {
  avatarUrl: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    try {
      const user = await this.supabase.user;
     
      if (user && user.user_metadata && user.user_metadata['avatar_url']) {
        this.avatarUrl = user.user_metadata['avatar_url'];
      }
    } catch (error) {
      console.error('Error loading user avatar', error);
    }
  }
  setDefaultAvatar() {
    
    this.avatarUrl = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }
}

