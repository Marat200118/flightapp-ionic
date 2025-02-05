//supabase.service.ts



// export interface User {
//   id: string;
//   email: string;
//   user_metadata: {
//     avatar_url: string;
//     [key: string]: any;
//   };
// }


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

    console.log('Supabase URL:', environment.supabaseUrl);
    console.log('Supabase Key:', environment.supabaseKey);

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event detected:', event);
      if (session) {
        console.log('Updating session in storage.');
        this.storage.set('supabase_session', JSON.stringify(session));
      } else {
        console.log('No session. Clearing storage.');
        this.storage.remove('supabase_session');
      }
    });
  }

  

  get user(): Promise<User | null> {
  return this.supabase.auth.getUser().then(({ data }) => data?.user ?? null);

  
}


  async signIn(email: string, password: string) {
    console.log('Attempting sign in with:', email);
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Sign-in error:', error.message);
      throw error;
    }

    console.log('Login successful:', data.session);

    if (data.session) {
      await this.storage.set('supabase_session', JSON.stringify(data.session));
      console.log('Session saved in storage.');
    }

    return data;
  }

  async signInWithGoogle() {
    const redirectTo =
      Capacitor.isNativePlatform() 
        ? 'myapp://auth/callback'  // Custom URL for mobile
        : window.location.origin + '/auth/callback';  // For web

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Google sign-in failed:', error.message);
      throw error;
    }

    console.log('Redirecting to Google OAuth...');
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
      console.error('Google sign-up failed:', error.message);
      throw error;
    }

    console.log('Redirecting to Google OAuth for sign-up...');
    
  } catch (error: any) {
    console.error('Google sign-up error:', error.message);
    this.createNotice(error.message);
  }
}


  async signOut() {
    console.log('Signing out...');
    await this.supabase.auth.signOut();
    await this.storage.remove('supabase_session');
  }

  async handleOAuthCallback() {
    try {
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error('Error handling OAuth callback:', error.message);
        return { error };
      }

      console.log('OAuth callback successful. Session:', data);
      return { data };
    } catch (err) {
      console.error('Unexpected error during callback:', err);
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
        console.error('OAuth sign-in error:', error.message);
        throw error;
      }

      return { data };
    } catch (err) {
      console.error('Unexpected error during OAuth sign-in:', err);
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
      console.error('Failed to set session:', error);
      return { error };
    }

    console.log('Session set successfully:', data);
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
      console.log('Session restoration is already in progress. Skipping...');
      return;
    }

    this.sessionLock = true; // Acquire the lock

    try {
      await this.storage.create();
      const storedSession = await this.storage.get('supabase_session');

      if (storedSession) {
        const session: Session = JSON.parse(storedSession);
        console.log('Restoring session from storage:', session);

        const { error } = await this.supabase.auth.setSession(session);

        if (error) {
          console.error('Failed to restore session:', error.message);
          await this.storage.remove('supabase_session');
        } else {
          console.log('Session restored successfully.');
        }
      } else {
        console.log('No session found in storage.');
      }

      // Register the auth state change listener (once)
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event detected:', event);
        if (session) {
          console.log('Updating session in storage.');
          await this.storage.set('supabase_session', JSON.stringify(session));
        } else {
          console.log('Session is null. Clearing storage.');
          await this.storage.remove('supabase_session');
        }
      });

    } catch (error) {
      console.error('Unexpected error during session restoration:', error);
    } finally {
      this.sessionLock = false; // Release the lock
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
