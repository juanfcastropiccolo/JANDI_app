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

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

async function ensureUserRowExists(): Promise<void> {
  console.log('[AuthCallback] Starting ensureUserRowExists...');
  
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[AuthCallback] Error getting auth user:', authError);
    throw authError;
  }
  
  const authUser = authData.user;
  if (!authUser) {
    console.error('[AuthCallback] No auth user found');
    throw new Error('No se pudo obtener el usuario autenticado');
  }

  console.log('[AuthCallback] Auth user:', authUser.id, authUser.email);

  const email = pickString(authUser.email);
  if (!email) throw new Error('No se encontró email en el usuario autenticado');

  const fullName =
    pickString((authUser.user_metadata as Record<string, unknown> | null)?.full_name) ??
    pickString((authUser.user_metadata as Record<string, unknown> | null)?.name);

  const avatarUrl =
    pickString((authUser.user_metadata as Record<string, unknown> | null)?.avatar_url) ??
    pickString((authUser.user_metadata as Record<string, unknown> | null)?.picture);

  // Para Google, Supabase suele exponer provider_id en identities (cuando existe)
  const identities = (authUser.identities ?? []) as Array<{ provider?: string; id?: string }>;
  const googleId = identities.find((i) => i.provider === 'google')?.id;

  console.log('[AuthCallback] Checking if user exists in DB...');
  
  // Buscar si ya existe el usuario en nuestra tabla "users"
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingError) {
    console.error('[AuthCallback] Error checking existing user:', existingError);
    throw existingError;
  }

  const now = new Date().toISOString();

  if (!existing) {
    console.log('[AuthCallback] User does not exist, creating...');
    
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
      metadata: authUser.user_metadata ?? {},
    });
    
    if (insertError) {
      console.error('[AuthCallback] Error inserting user:', insertError);
      throw insertError;
    }
    
    console.log('[AuthCallback] User created successfully');
    return;
  }

  console.log('[AuthCallback] User exists, updating last_login_at...');
  
  // Si existe, actualizar last_login_at (y completar campos faltantes)
  const { error: updateError } = await supabase
    .from('users')
    .update({
      last_login_at: now,
      auth_provider: existing.auth_provider ?? 'google',
      full_name: existing.full_name ?? fullName,
      avatar_url: existing.avatar_url ?? avatarUrl,
      google_id: existing.google_id ?? googleId,
    })
    .eq('id', authUser.id);

  if (updateError) {
    console.error('[AuthCallback] Error updating user:', updateError);
    throw updateError;
  }
  
  console.log('[AuthCallback] User updated successfully');
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando autenticación...');
  const processedCodeRef = React.useRef<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        console.log('[AuthCallback] Starting callback flow...');
        const url = new URL(window.location.href);

        // Supabase/Google pueden devolver error en query params
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        if (errorParam || errorDescription) {
          throw new Error(decodeURIComponent(errorDescription ?? errorParam ?? 'Error de autenticación'));
        }

        const code = url.searchParams.get('code');
        
        // Evitar doble procesamiento en React Strict Mode
        if (code) {
          if (processedCodeRef.current === code) {
            console.log('[AuthCallback] Code already processed/processing, skipping...');
            return;
          }
          processedCodeRef.current = code;

          console.log('[AuthCallback] Found code, exchanging for session...');
          setMessage('Autenticando con Google...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // Si el error es que el código ya fue usado o es inválido, verificamos si ya tenemos sesión
            // Esto puede pasar si hubo un re-render rápido o race condition
            console.warn('[AuthCallback] Error exchanging code:', error);
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              throw error;
            }
            console.log('[AuthCallback] Session already exists despite exchange error');
          } else {
            console.log('[AuthCallback] Code exchanged successfully');
          }

          // Limpia la URL
          window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`);
          
          setMessage('Configurando tu cuenta...');
        } else {
          console.log('[AuthCallback] No code found, checking session...');
        }

        if (!alive) return;

        // Verificar sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
          // Si no hay código y no hay sesión, algo salió mal o el usuario entró directo a /auth/callback
          if (!code) {
             console.log('[AuthCallback] No session and no code, redirecting to login');
             navigate('/login', { replace: true });
             return;
          }
          throw new Error('No se pudo establecer la sesión. Por favor intentá de nuevo.');
        }
        
        console.log('[AuthCallback] Session verified, user:', session.user.email);

        setMessage('Creando tu perfil...');
        await ensureUserRowExists();

        if (!alive) return;

        console.log('[AuthCallback] Loading user profile...');
        // Reintentar cargar el perfil un par de veces si falla (por latencia de replicación/RLS)
        let currentUser = null;
        for (let i = 0; i < 3; i++) {
            currentUser = await authService.getCurrentUser();
            if (currentUser) break;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!currentUser) {
          throw new Error('No se pudo cargar el perfil del usuario después de varios intentos');
        }

        console.log('[AuthCallback] User loaded:', currentUser.email);

        if (!alive) return;

        setMessage('¡Listo! Redirigiendo...');
        
        const destination = currentUser.onboarding_completed ? '/chat' : '/onboarding';
        console.log('[AuthCallback] Navigating to:', destination);
        navigate(destination, { replace: true });

      } catch (err) {
        console.error('[AuthCallback] Error in callback flow:', err);
        // Ignorar AbortError
        if (err instanceof Error && err.name === 'AbortError') return;

        const errorMessage = err instanceof Error ? err.message : 'Error procesando la autenticación';
        if (!alive) return;
        setMessage(`Error: ${errorMessage}`);

        setTimeout(() => {
          if (alive) {
            navigate('/login', { replace: true });
          }
        }, 3000);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <LoadingSpinner size="lg" />
      <div className="text-center px-6" style={{ color: 'var(--jandi-dark-blue)' }}>
        {message}
      </div>
    </div>
  );
}

