//app.component.ts

import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase.service';
import { Storage } from '@ionic/storage-angular';
import { Platform } from '@ionic/angular';
import { LoginPage } from './auth/login/login.page';
import { NavController } from '@ionic/angular';
// import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private supabase: SupabaseService,
    private storage: Storage,
    private navCtrl: NavController,
    
  ) {
    
    // GoogleAuth.initialize();
    this.initializeApp();
  }

  async initializeApp() {
    await this.storage.create();
    await this.supabase.restoreSession(); 
    const user = await this.supabase.user;
    if (user) {
      this.navCtrl.navigateRoot('/tabs/tab1');
    } else {
      this.navCtrl.navigateRoot('/onboarding');
    }
  }


}


