//supabase.service.ts


import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Capacitor } from '@capacitor/core';

import {
  createClient,
  SupabaseClient,
  Session,
  User,
  Provider,
} from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import { LoadingController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  avatar_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  
  private supabase: SupabaseClient;
  private sessionLock: boolean = false;
  private authListenerRegistered: boolean = false;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private storage: Storage,
    private storageService: StorageService,
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
      },
    });

    this.registerAuthStateListener();
  }

    private registerAuthStateListener() {
    if (this.authListenerRegistered) {
      return;
    }

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await this.storage.set('supabase_session', JSON.stringify(session));
      } else {
        await this.storage.remove('supabase_session');
      }
    });

    this.authListenerRegistered = true;
  }

  

  get user(): Promise<User | null> {
    return this.supabase.auth.getUser().then(({ data }) => data?.user ?? null);
  }


  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (data.session) {
      await this.storage.set('supabase_session', JSON.stringify(data.session));
    }

    return data;
  }

  async signInWithGoogle() {
    const redirectTo =
      Capacitor.isNativePlatform() 
        ? 'myapp://auth/callback' 
        : window.location.origin + '/auth/callback';  

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }
  }

  async signUpWithGoogle(): Promise<void> {
  try {

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });

    if (error) {
      throw error;
    }
    
  } catch (error: any) {
    this.createNotice(error.message);
  }
}


  async signOut() {
    await this.supabase.auth.signOut();
    await this.storage.remove('supabase_session');
  }

  async handleOAuthCallback() {
    try {
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        return { error };
      }
      return { data };
    } catch (err) {
      throw err;
    }
  }

  async signInWithOAuth(options: { provider: Provider; redirectTo: string }) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: options.provider,
        options: {
          redirectTo: options.redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      return { data };
    } catch (err) {
      throw err;
    }
  }


  async setSession(sessionData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }) {
    const { data, error } = await this.supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (error) {
      return { error };
    }
    return { data };
  }


  async signUp(email: string, password: string, profile: Partial<Profile>) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('User was not created successfully');
    }

    const { error: profileError } = await this.supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          // email: data.user.email,
          first_name: profile.first_name || '',
          username: profile.username || email.split('@')[0],
          avatar_url: profile.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg',
        },
      ]);

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error(`Signup successful, but login failed: ${signInError.message}`);
    }

    return data.user;
  }



  async uploadAvatar(file: File): Promise<string> {
    const user = await this.user;
    if (!user) throw new Error('No user is logged in');

    const fileName = `${user.id}/${file.name}`;
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Avatar upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    if (!publicUrlData) {
      throw new Error(`Failed to retrieve public URL.`);
    }

    return publicUrlData.publicUrl;
  }


  async updateProfile(profile: Profile) {
    const user = await this.user;
    const update = {
      ...profile,
      id: user?.id,
      updated_at: new Date(),
    };
    return this.supabase.from('profiles').upsert(update);
  }

  async getProfile() {
    const user = await this.user; 
    if (!user) {
      throw new Error('No user is logged in');
    }

    const { data, error } = await this.supabase
      .from('profiles') 
      .select('id, username, first_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      username: data.username,
      first_name: data.first_name,
      avatar_url: data.avatar_url,
    };
  }

  async restoreSession() {
    if (this.sessionLock) {
      return;
    }

    this.sessionLock = true;

    try {
      await this.storage.create();
      const storedSession = await this.storage.get('supabase_session');

      if (storedSession) {
        const session: Session = JSON.parse(storedSession);

        const { error } = await this.supabase.auth.setSession(session);

        if (error) {
          await this.storage.remove('supabase_session');
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('Unexpected error during session restoration:', error);
    } finally {
      this.sessionLock = false;
    }
  }

  async createLoader() {
    const loader = await this.loadingCtrl.create();
    return loader;
  }

  async createNotice(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000 });
    toast.present();
  }
}
