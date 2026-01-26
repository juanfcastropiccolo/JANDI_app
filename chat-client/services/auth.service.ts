/*
 * Copyright 2026 UCP Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { supabase } from './supabase';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth.types';

export class AuthService {
  /**
   * Login con email y contraseña
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from login');

    // Actualizar last_login_at
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    // Obtener datos completos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;
    return userData as User;
  }

  /**
   * Registro con email y contraseña
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.full_name,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from registration');

    // Crear registro en tabla users
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: credentials.email,
        full_name: credentials.full_name,
        auth_provider: 'email',
        onboarding_completed: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return userData as User;
  }

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    console.log('[authService] getCurrentUser: Getting auth user...');
    
    // Verificar sesión primero
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[authService] getCurrentUser: Session check:', session ? 'exists' : 'null');
    if (sessionError) {
      console.error('[authService] getCurrentUser: Session error:', sessionError);
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[authService] getCurrentUser: Error getting auth user:', authError);
      throw authError;
    }
    
    if (!user) {
      console.log('[authService] getCurrentUser: No auth user found');
      return null;
    }

    console.log('[authService] getCurrentUser: Auth user found:', user.id, user.email);
    console.log('[authService] getCurrentUser: Querying users table with ID:', user.id);
    console.log('[authService] getCurrentUser: Current auth.uid() should be:', user.id);

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[authService] getCurrentUser: ❌ Error fetching user data:', error);
      console.error('[authService] getCurrentUser: Error code:', error.code);
      console.error('[authService] getCurrentUser: Error message:', error.message);
      console.error('[authService] getCurrentUser: Error details:', error.details);
      console.error('[authService] getCurrentUser: Error hint:', error.hint);
      
      // Si el error es de RLS, puede que el usuario no exista todavía
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        console.warn('[authService] getCurrentUser: User not found in DB (PGRST116)');
        return null;
      }
      
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('[authService] getCurrentUser: RLS PERMISSION DENIED - check policies!');
      }
      
      throw error;
    }

    if (!userData) {
      console.warn('[authService] getCurrentUser: ⚠️ Query succeeded but no data returned');
      console.warn('[authService] getCurrentUser: This means the user exists in auth.users but not in public.users');
      console.warn('[authService] getCurrentUser: OR the RLS policy is blocking the read');
      return null;
    }

    console.log('[authService] getCurrentUser: ✅ User data loaded successfully:', userData.email);
    return userData as User;
  }

  /**
   * Verificar si el usuario completó el onboarding
   */
  async checkOnboardingStatus(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed || false;
  }

  /**
   * Marcar onboarding como completado
   */
  async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (error) throw error;
  }
}

export const authService = new AuthService();
