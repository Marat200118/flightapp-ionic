//supabase.service.ts

import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

import {
  createClient,
  SupabaseClient,
  AuthChangeEvent,
  Session,
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
      autoRefreshToken: false,
    },
  });
  console.log('Supabase URL:', environment.supabaseUrl);
  console.log('Supabase Key:', environment.supabaseKey);
  }

  get user() {
    return this.supabase.auth.getUser().then(({ data }) => data?.user);
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

  async signOut() {
    console.log('Signing out...');
    // await this.storageService.clear();
    await this.supabase.auth.signOut();
    await this.storage.remove('supabase_session');
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
    await this.storage.create(); 

    const storedSession = await this.storage.get('supabase_session');

    if (storedSession) {
      const session: Session = JSON.parse(storedSession);
      console.log('Restoring session from storage:', session);

      const { error } = await this.supabase.auth.setSession(session);
      if (error) {
        console.error('Failed to restore session:', error.message);
      } else {
        console.log('Session restored successfully.');
      }
    } else {
      console.log('No session found in storage.');
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
