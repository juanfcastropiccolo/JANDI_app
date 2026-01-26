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

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';
import type { User, LoginCredentials, RegisterCredentials } from '../types/auth.types';

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((v) => resolve(v))
      .catch((e) => reject(e))
      .finally(() => window.clearTimeout(t));
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Check initial session - NO HACER NADA, solo terminar loading
    // El onAuthStateChange se encarga de manejar todo
    setLoading(false);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.email);
        
        if (!alive) return;
        
        try {
          if (session?.user) {
            console.log('[useAuth] Session found, loading user...');
            
            // Intentar cargar el usuario con un solo intento y timeout corto
            try {
              const currentUser = await withTimeout(
                authService.getCurrentUser(),
                3000, // 3 segundos máximo
                'Timeout al cargar usuario'
              );
              
              if (!alive) return;
              
              if (currentUser) {
                console.log(`[useAuth] ✅ User loaded successfully:`, currentUser.email);
                setUser(currentUser);
                setError(null);
              } else {
                console.warn(`[useAuth] ⚠️ getCurrentUser returned null - user may still be creating`);
                // No establecer user como null todavía, dejar que el AuthGuard espere
              }
            } catch (err) {
              console.error(`[useAuth] ❌ Error loading user:`, err);
              
              // Si es timeout o el usuario no existe todavía, no es un error crítico
              if (err instanceof Error && (err.message.includes('Timeout') || err.message.includes('Query timeout'))) {
                console.warn('[useAuth] ⚠️ Timeout loading user - will not set error, AuthGuard will handle');
                // No establecer error, dejar que AuthGuard maneje con su propio timeout
              } else {
                throw err;
              }
            }
          } else {
            console.log('[useAuth] No session, clearing user');
            if (alive) {
              setUser(null);
            }
          }
        } catch (err) {
          console.error('[useAuth] ❌ Error handling auth change:', err);
          if (!alive) return;
          
          // No mostrar error en AbortError
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('[useAuth] Error details:', {
              name: err.name,
              message: err.message,
              stack: err.stack
            });
            setUser(null);
            
            // Solo mostrar error si no es un timeout durante el callback
            const isTimeoutError = err.message?.includes('Timeout');
            if (!isTimeoutError) {
              setError(err.message || 'Error de autenticación');
            }
          }
        } finally {
          if (alive) setLoading(false);
        }
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      const loggedInUser = await withTimeout(
        authService.login(credentials),
        15000,
        'Tiempo de espera agotado al iniciar sesión. Revisá tu conexión y reintentá.',
      );
      setUser(loggedInUser);
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
      setError(null);
      setLoading(true);
      const newUser = await withTimeout(
        authService.register(credentials),
        20000,
        'Tiempo de espera agotado al registrarse. Revisá tu conexión y reintentá.',
      );
      setUser(newUser);
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
      setError(null);
      // No usar timeout: loginWithGoogle solo lanza la redirección y devuelve inmediatamente
      await authService.loginWithGoogle();
      // La redirección va a suceder, no hay necesidad de setLoading
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al restablecer contraseña';
      setError(errorMessage);
      throw err;
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
  };
}
