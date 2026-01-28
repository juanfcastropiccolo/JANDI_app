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
import type { User } from '@supabase/supabase-js';
import type { User as CustomUser } from '../types/auth.types';

export class AuthService {
  /**
   * Obtener usuario completo (Auth User + datos de tabla users)
   * Esta función combina los datos del Auth User de Supabase con los datos
   * de nuestra tabla users para tener un objeto completo con onboarding_completed
   */
  async getFullUser(): Promise<CustomUser | null> {
    try {
      console.log('[AuthService] Getting full user...');
      
      // 1. Obtener Auth User de Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[AuthService] Error getting auth user:', authError);
        throw authError;
      }
      
      if (!authUser) {
        console.log('[AuthService] No auth user found');
        return null;
      }

      console.log('[AuthService] Auth user found:', authUser.id, authUser.email);

      // 2. Obtener datos de la tabla users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (dbError) {
        console.error('[AuthService] Error fetching user from database:', dbError);
        // Si falla la consulta de DB, devolver solo authUser con valores por defecto
        console.warn('[AuthService] Returning auth user with default values');
        return {
          ...authUser,
          onboarding_completed: false,
          auth_provider: 'email',
          is_active: true,
        } as CustomUser;
      }

      console.log('[AuthService] DB user found, onboarding_completed:', dbUser.onboarding_completed);

      // 3. Combinar ambos (priorizar datos de la tabla users)
      const fullUser: CustomUser = {
        ...authUser,
        ...dbUser,
        // Asegurar que propiedades críticas vengan de la tabla users
        onboarding_completed: dbUser.onboarding_completed ?? false,
        full_name: dbUser.full_name,
        phone: dbUser.phone,
        auth_provider: dbUser.auth_provider,
        is_active: dbUser.is_active,
        // Mantener propiedades de Auth que no están en la tabla
        email: authUser.email!,
        id: authUser.id,
      };

      console.log('[AuthService] Full user assembled:', {
        id: fullUser.id,
        email: fullUser.email,
        onboarding_completed: fullUser.onboarding_completed,
      });

      return fullUser;
    } catch (error) {
      console.error('[AuthService] Error in getFullUser:', error);
      throw error;
    }
  }
  /**
   * Registrar nuevo usuario de negocio
   */
  async signUpBusiness(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'business',
          onboarding_completed: false,
          onboarding_step: 1,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Login de usuario de negocio
   */
  async signInBusiness(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Verificar que sea un usuario de tipo business
    if (data.user?.user_metadata?.user_type !== 'business') {
      throw new Error('Este usuario no es un negocio');
    }

    return data;
  }

  /**
   * Logout
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Actualizar metadata del usuario
   */
  async updateUserMetadata(metadata: any) {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Verificar si hay sesión activa
   */
  async hasActiveSession(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
}

export const authService = new AuthService();
