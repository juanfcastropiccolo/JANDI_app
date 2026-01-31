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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

/**
 * AuthCallbackSimple - Componente para OAuth callback
 * 
 * Estrategia simple y robusta:
 * 1. Esperar a que exista sesión (Supabase la crea automáticamente)
 * 2. Asegurar usuario en tabla users
 * 3. Redirigir según tipo de usuario
 */
export function AuthCallbackSimple() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando autenticación...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const handleCallback = async () => {
      try {
        console.log('[AuthCallbackSimple] ===== INICIO DEL CALLBACK =====');
        
        // 1. Verificar si hay error en la URL
        const url = new URL(window.location.href);
        const errorParam = url.searchParams.get('error');
        
        if (errorParam) {
          const errorDescription = url.searchParams.get('error_description');
          const msg = decodeURIComponent(errorDescription || errorParam);
          console.error('[AuthCallbackSimple] Error OAuth:', msg);
          throw new Error(msg);
        }

        // 2. Esperar a que exista sesión (máximo 15 segundos)
        setMessage('Verificando sesión...');
        console.log('[AuthCallbackSimple] Esperando sesión...');
        
        const sessionUser = await waitForSession(15000, alive);
        
        if (!alive) return;
        
        if (!sessionUser) {
          throw new Error('No se pudo establecer la sesión. Por favor intentá de nuevo.');
        }

        console.log('[AuthCallbackSimple] ✅ Sesión encontrada:', sessionUser.email);
        
        // 3. Limpiar la URL
        window.history.replaceState({}, document.title, '/auth/callback');
        
        if (!alive) return;

        // 4. Asegurar usuario en tabla users
        setMessage('Configurando tu cuenta...');
        console.log('[AuthCallbackSimple] Asegurando usuario en DB...');
        
        await ensureUserInDatabase(sessionUser);
        
        if (!alive) return;

        // 5. Determinar destino
        setMessage('¡Listo! Redirigiendo...');
        console.log('[AuthCallbackSimple] Determinando destino...');
        
        const destination = await resolveDestination(sessionUser);
        
        console.log('[AuthCallbackSimple] Redirigiendo a:', destination);
        console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');
        
        if (alive) {
          navigate(destination, { replace: true });
        }

      } catch (err) {
        console.error('[AuthCallbackSimple] ===== ERROR EN CALLBACK =====', err);
        
        if (!alive) return;

        const errorMessage = err instanceof Error ? err.message : 'Error al procesar autenticación';
        setError(errorMessage);
        setMessage('Error al iniciar sesión');

        setTimeout(() => {
          if (alive) navigate('/login', { replace: true });
        }, 3000);
      }
    };

    /**
     * Esperar a que exista sesión con polling
     */
    async function waitForSession(maxWaitMs: number, isAlive: boolean) {
      const start = Date.now();
      
      while (Date.now() - start < maxWaitMs && isAlive) {
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('[AuthCallbackSimple] Error getSession:', error.message);
          }
          
          if (data.session?.user) {
            return data.session.user;
          }
        } catch (err) {
          console.warn('[AuthCallbackSimple] Exception in getSession:', err);
        }
        
        // Esperar 500ms antes del próximo intento
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return null;
    }

    handleCallback();

    return () => {
      alive = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <LoadingSpinner size="lg" />
      <div className="text-center max-w-md">
        <div className="text-lg font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          {message}
        </div>
        {error && (
          <div className="mt-4 p-4 rounded-lg text-sm" style={{ backgroundColor: '#fee', color: '#c00' }}>
            <div className="font-bold mb-2">Error:</div>
            <div>{error}</div>
            <div className="mt-3 text-xs opacity-75">
              Serás redirigido al login en 3 segundos...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Asegurar que el usuario existe en la tabla users
 */
async function ensureUserInDatabase(authUser: any): Promise<void> {
  console.log('[AuthCallbackSimple] Verificando usuario en base de datos...');
  
  const email = authUser.email;
  if (!email) {
    throw new Error('No se encontró email en el usuario autenticado');
  }

  // Extraer datos del usuario de Google
  const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
  const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
  const googleId = authUser.identities?.find((i: any) => i.provider === 'google')?.id;

  // Verificar si el usuario ya existe
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingError) {
    console.error('[AuthCallbackSimple] Error verificando usuario:', existingError);
    throw existingError;
  }

  const now = new Date().toISOString();

  if (!existing) {
    // Usuario nuevo: crear registro
    console.log('[AuthCallbackSimple] Usuario no existe, creando...');
    
    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      google_id: googleId,
      auth_provider: 'google',
      onboarding_completed: false,
      is_active: true,
      last_login_at: now,
      metadata: authUser.user_metadata || {},
    });
    
    if (insertError) {
      // Si el error es de duplicado, el usuario ya existe (race condition)
      if (insertError.code === '23505') {
        console.log('[AuthCallbackSimple] Usuario ya existe (race condition), continuando...');
        return;
      }
      console.error('[AuthCallbackSimple] Error creando usuario:', insertError);
      throw insertError;
    }
    
    console.log('[AuthCallbackSimple] ✅ Usuario creado exitosamente');
  } else {
    // Usuario existente: actualizar last_login_at
    console.log('[AuthCallbackSimple] Usuario existe, actualizando last_login...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login_at: now })
      .eq('id', authUser.id);

    if (updateError) {
      console.warn('[AuthCallbackSimple] Error actualizando usuario (no crítico):', updateError);
    } else {
      console.log('[AuthCallbackSimple] ✅ Usuario actualizado exitosamente');
    }
  }
}

/**
 * Determinar destino según tipo de usuario y estado de onboarding
 */
async function resolveDestination(authUser: any): Promise<string> {
  // Obtener datos del usuario de la DB
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('user_type, onboarding_completed, email')
    .eq('id', authUser.id)
    .single();

  if (dbError || !dbUser) {
    console.warn('[AuthCallbackSimple] No se pudo leer usuario de DB, enviando a onboarding');
    return '/onboarding';
  }

  console.log('[AuthCallbackSimple] Usuario DB:', dbUser);

  // Si es business, resolver destino business
  if (dbUser.user_type === 'business') {
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('email', dbUser.email)
      .single();

    if (bizError && bizError.code !== 'PGRST116') {
      console.warn('[AuthCallbackSimple] Error buscando business:', bizError);
    }

    if (business?.id) {
      return `/business/dashboard/${business.id}`;
    }
    return '/business/onboarding';
  }

  // Consumer: verificar onboarding
  if (dbUser.onboarding_completed) {
    return '/chat';
  }

  return '/onboarding';
}
