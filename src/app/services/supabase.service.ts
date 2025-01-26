//supabase.service.ts

import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  AuthChangeEvent,
  Session,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { LoadingController, ToastController } from '@ionic/angular';

export interface Profile {
  username: string;
  website: string;
  avatar_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Get user details
  get user() {
    return this.supabase.auth.getUser().then(({ data }) => data?.user);
  }

  // Sign in with email and password
  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // Sign out the current user
  signOut() {
    return this.supabase.auth.signOut();
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  // Update profile
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
    const user = await this.user; // Use the existing `user` getter
    if (!user) {
      throw new Error('No user is logged in');
    }

    // Fetch profile data from the "profiles" table
    return this.supabase
      .from('profiles')
      .select('username, website, avatar_url')
      .eq('id', user.id)
      .single();
  }

  // Create a loader
  async createLoader() {
    const loader = await this.loadingCtrl.create();
    return loader;
  }

  // Create a toast notification
  async createNotice(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000 });
    toast.present();
  }
}
