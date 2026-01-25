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
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        // Si el error es de RLS, puede que el usuario no exista todavía
        if (error.code === 'PGRST116' || error.message.includes('no rows')) {
          return null;
        }
        throw error;
      }

      return userData as User;
    } catch (err) {
      console.error('Error in getCurrentUser:', err);
      // Si es AbortError, propagarlo para que useAuth lo maneje
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      return null;
    }
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
