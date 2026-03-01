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

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

/**
 * AuthCallbackSimple - Componente para OAuth callback
 * 
 * Usa onAuthStateChange para detectar la sesión de forma confiable
 */
export function AuthCallbackSimple() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando autenticación...');
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    console.log('[AuthCallbackSimple] ===== INICIO DEL CALLBACK =====');
    
    // Verificar si hay error en la URL
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error');
    
    if (errorParam) {
      const errorDescription = url.searchParams.get('error_description');
      const msg = decodeURIComponent(errorDescription || errorParam);
      console.error('[AuthCallbackSimple] Error OAuth:', msg);
      setError(msg);
      setMessage('Error al iniciar sesión');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    // Timeout de seguridad: si en 20 segundos no hay sesión, fallar
    const timeoutId = setTimeout(() => {
      if (!processedRef.current) {
        console.error('[AuthCallbackSimple] Timeout esperando sesión');
        setError('Timeout esperando la sesión. Por favor intentá de nuevo.');
        setMessage('Error al iniciar sesión');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    }, 20000);

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthCallbackSimple] Auth event:', event, 'has session:', !!session);
        
        if (processedRef.current) {
          console.log('[AuthCallbackSimple] Already processed, ignoring event');
          return;
        }

        if (session?.user) {
          processedRef.current = true;
          clearTimeout(timeoutId);
          
          console.log('[AuthCallbackSimple] ✅ Sesión detectada:', session.user.email);
          
          try {
            // Limpiar la URL
            window.history.replaceState({}, document.title, '/auth/callback');
            
            // Asegurar usuario en tabla users
            setMessage('Configurando tu cuenta...');
            await ensureUserInDatabase(session.user);
            
            // Determinar destino
            setMessage('¡Listo! Redirigiendo...');
            const destination = await resolveDestination(session.user);
            
            console.log('[AuthCallbackSimple] Redirigiendo a:', destination);
            console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');
            
            navigate(destination, { replace: true });
          } catch (err) {
            console.error('[AuthCallbackSimple] Error procesando usuario:', err);
            // Si falla algo, igual mandamos a onboarding
            console.log('[AuthCallbackSimple] Fallback: enviando a /onboarding');
            navigate('/onboarding', { replace: true });
          }
        }
      }
    );

    // Verificar si ya hay sesión inmediatamente
    // IMPORTANTE: si la sesión ya existe (el evento SIGNED_IN pudo haberse
    // disparado antes de que este componente se suscribiera), la procesamos
    // directamente aquí sin esperar onAuthStateChange.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('[AuthCallbackSimple] Error getSession inicial:', error);
        return;
      }

      if (data.session?.user && !processedRef.current) {
        console.log('[AuthCallbackSimple] Sesión detectada via getSession, procesando directamente...');
        processedRef.current = true;
        clearTimeout(timeoutId);

        const user = data.session.user;
        window.history.replaceState({}, document.title, '/auth/callback');
        setMessage('Configurando tu cuenta...');

        ensureUserInDatabase(user)
          .then(() => resolveDestination(user))
          .then((destination) => {
            setMessage('¡Listo! Redirigiendo...');
            console.log('[AuthCallbackSimple] (getSession fallback) Redirigiendo a:', destination);
            navigate(destination, { replace: true });
          })
          .catch((err) => {
            console.error('[AuthCallbackSimple] Error en getSession fallback:', err);
            navigate('/onboarding', { replace: true });
          });
      } else if (!data.session) {
        console.log('[AuthCallbackSimple] Sin sesión aún, esperando onAuthStateChange...');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
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
