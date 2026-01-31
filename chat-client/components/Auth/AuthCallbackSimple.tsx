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
import { authService } from '../../services/auth.service';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

/**
 * AuthCallbackSimple - Componente simplificado para OAuth callback
 * 
 * Con detectSessionInUrl: true, Supabase maneja automáticamente el intercambio
 * de código por sesión. Este componente solo:
 * 1. Verifica que la sesión exista
 * 2. Crea el perfil del usuario en la DB si no existe (sin RLS habilitado temporalmente)
 * 3. Redirige al usuario según su estado de onboarding
 */
export function AuthCallbackSimple() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando autenticación...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

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

        // 2. Verificar si hay código de autorización en la URL
        const code = url.searchParams.get('code');
        console.log('[AuthCallbackSimple] Code in URL:', code ? 'YES' : 'NO');

        if (!alive) return;
        
        if (code) {
          // Si hay código, intercambiarlo por sesión
          setMessage('Intercambiando código de autenticación...');
          console.log('[AuthCallbackSimple] Exchanging code for session...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[AuthCallbackSimple] Error exchanging code:', exchangeError);
            throw exchangeError;
          }
          
          if (!data.session || !data.session.user) {
            throw new Error('No se pudo obtener la sesión después del intercambio');
          }
          
          console.log('[AuthCallbackSimple] ✅ Code exchanged successfully:', data.session.user.email);
          
          // Limpiar la URL
          window.history.replaceState({}, document.title, url.pathname);
          
          if (!alive) return;
          
          // Procesar perfil del usuario
          await handleUserProfile(data.session.user, alive, setMessage, navigate);
        } else {
          // No hay código, verificar si ya hay sesión
          setMessage('Verificando sesión...');
          console.log('[AuthCallbackSimple] No code, checking existing session...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[AuthCallbackSimple] Error getSession:', sessionError);
            throw sessionError;
          }

          if (!session || !session.user) {
            console.error('[AuthCallbackSimple] No session and no code');
            throw new Error('No se encontró código de autenticación ni sesión activa');
          }

          console.log('[AuthCallbackSimple] ✅ Existing session found:', session.user.email);

          if (!alive) return;
          
          // Procesar perfil del usuario
          await handleUserProfile(session.user, alive, setMessage, navigate);
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

    handleCallback();

    return () => {
      alive = false;
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
 * Función auxiliar para crear/actualizar usuario en tabla users y redirigir
 */
async function handleUserProfile(
  user: any, 
  alive: boolean, 
  setMessage: (msg: string) => void, 
  navigate: (path: string, options?: any) => void
) {
  try {
    if (!alive) return;
    
    console.log('[AuthCallbackSimple] Usuario autenticado:', user.email);
    setMessage('Configurando tu perfil...');

    // CRÍTICO: Asegurar que el usuario existe en la tabla users
    await ensureUserInDatabase(user);
    
    if (!alive) return;
    
    setMessage('¡Listo! Redirigiendo...');
    
    const fullUser = await authService.getFullUser();
    if (!fullUser) {
      throw new Error('No se pudo cargar el perfil del usuario');
    }

    let destination = fullUser.onboarding_completed ? '/chat' : '/onboarding';
    if (fullUser.user_type === 'business') {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('email', fullUser.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        destination = data?.id ? `/business/dashboard/${data.id}` : '/business/onboarding';
      } catch (err) {
        console.error('[AuthCallbackSimple] Error resolving business destination:', err);
        destination = '/business/onboarding';
      }
    }

    console.log('[AuthCallbackSimple] Redirigiendo a:', destination);
    console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');
    
    // Pequeño delay para asegurar que la base de datos está actualizada
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (alive) {
      navigate(destination, { replace: true });
    }
  } catch (err) {
    console.error('[AuthCallbackSimple] Error en handleUserProfile:', err);
    throw err;
  }
}

/**
 * Asegurar que el usuario existe en la tabla users
 * Esta función crea o actualiza el registro del usuario en nuestra tabla custom
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
    .select('*')
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
      console.error('[AuthCallbackSimple] Error creando usuario:', insertError);
      throw insertError;
    }
    
    console.log('[AuthCallbackSimple] ✅ Usuario creado exitosamente');
  } else {
    // Usuario existente: actualizar last_login_at
    console.log('[AuthCallbackSimple] Usuario existe, actualizando last_login...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        last_login_at: now,
        // Actualizar datos que puedan haber cambiado en Google
        full_name: fullName || existing.full_name,
        avatar_url: avatarUrl || existing.avatar_url,
        google_id: googleId || existing.google_id,
      })
      .eq('id', authUser.id);

    if (updateError) {
      console.error('[AuthCallbackSimple] Error actualizando usuario:', updateError);
      throw updateError;
    }
    
    console.log('[AuthCallbackSimple] ✅ Usuario actualizado exitosamente');
  }
}
