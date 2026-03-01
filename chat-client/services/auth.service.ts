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
   * Wraps la query de DB con un AbortController de 5s para evitar que
   * el browser quede colgado si Supabase REST no responde (CORS preflight issue).
   * Si la query falla o tarda demasiado, construye el usuario desde auth metadata.
   */
  async getFullUser(): Promise<CustomUser | null> {
    try {
      console.log('[AuthService] Getting full user...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[AuthService] Error getting session:', sessionError);
        return null;
      }

      if (!session || !session.user) {
        console.log('[AuthService] No active session');
        return null;
      }

      const authUser = session.user;
      console.log('[AuthService] Auth user found:', authUser.id, authUser.email);

      // Intentar obtener datos de DB con timeout de 5s usando Promise.race
      const dbQuery = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise<null>(resolve =>
        setTimeout(() => resolve(null), 5000)
      );

      const result = await Promise.race([dbQuery, timeoutPromise]);

      if (result === null) {
        console.warn('[AuthService] DB query timed out, falling back to metadata');
        return buildUserFromMetadata(authUser);
      }

      const { data: dbUser, error: dbError } = result as Awaited<typeof dbQuery>;

      if (dbError) {
        console.warn('[AuthService] DB query error, falling back to metadata:', dbError.message);
        return buildUserFromMetadata(authUser);
      }

      console.log('[AuthService] DB user found, onboarding_completed:', dbUser.onboarding_completed);

      const fullUser: CustomUser = {
        ...authUser,
        ...dbUser,
        onboarding_completed: dbUser.onboarding_completed ?? false,
        full_name: dbUser.full_name,
        phone: dbUser.phone,
        auth_provider: dbUser.auth_provider,
        is_active: dbUser.is_active,
        user_type: dbUser.user_type || 'consumer',
        metadata: dbUser.metadata || {},
        email: authUser.email!,
        id: authUser.id,
      };

      console.log('[AuthService] Full user assembled:', {
        id: fullUser.id,
        email: fullUser.email,
        user_type: fullUser.user_type,
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

/**
 * Construir CustomUser desde auth metadata cuando la DB no está disponible.
 * Usa valores por defecto razonables para los campos de public.users.
 */
function buildUserFromMetadata(authUser: any): CustomUser {
  const meta = authUser.user_metadata || {};
  const now = new Date().toISOString();

  console.log('[AuthService] Building user from auth metadata (DB fallback)');

  return {
    ...authUser,
    id: authUser.id,
    email: authUser.email!,
    full_name: meta.full_name || meta.name || '',
    avatar_url: meta.avatar_url || meta.picture,
    auth_provider: 'google',
    is_active: true,
    onboarding_completed: meta.onboarding_completed === true,
    user_type: (meta.user_type as 'consumer' | 'business') || 'consumer',
    created_at: authUser.created_at || now,
    updated_at: now,
    last_login_at: now,
    metadata: meta,
  } as CustomUser;
}

export const authService = new AuthService();
