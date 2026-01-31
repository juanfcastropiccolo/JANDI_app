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

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';
import type { User } from '../types/auth.types';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAuth] Initializing auth hook...');
    
    // Obtener usuario completo al iniciar
    authService.getFullUser().then(fullUser => {
      console.log('[useAuth] Initial user loaded:', fullUser?.email, 'onboarding:', fullUser?.onboarding_completed);
      setUser(fullUser);
      setLoading(false);
    }).catch(err => {
      console.error('[useAuth] Error loading initial user:', err);
      setUser(null);
      setLoading(false);
    });

    // Escuchar cambios en auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[useAuth] Auth state changed, event:', _event, 'has session:', !!session);
        
        if (session?.user) {
          // Obtener usuario completo cuando hay sesión
          try {
            const fullUser = await authService.getFullUser();
            console.log('[useAuth] Full user loaded after auth change:', fullUser?.email, 'onboarding:', fullUser?.onboarding_completed);
            setUser(fullUser);
          } catch (err) {
            console.error('[useAuth] Error loading full user after auth change:', err);
            setUser(null);
          }
        } else {
          console.log('[useAuth] No session, clearing user');
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) throw signInError;
      const fullUser = await authService.getFullUser();
      setUser(fullUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
            user_type: 'consumer',
            onboarding_completed: false,
          },
        },
      });

      if (signUpError) throw signUpError;
      const fullUser = await authService.getFullUser();
      setUser(fullUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrarse';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (googleError) throw googleError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar email de recuperación';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    try {
      console.log('[useAuth] Refetching user...');
      const fullUser = await authService.getFullUser();
      console.log('[useAuth] User refetched:', fullUser?.email, 'onboarding:', fullUser?.onboarding_completed);
      setUser(fullUser);
    } catch (err) {
      console.error('[useAuth] Error refreshing user:', err);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    refetchUser,
  };
}
