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

        if (!alive) return;
        setMessage('Verificando sesión...');

        // 2. Esperar un momento para que Supabase termine de procesar la sesión
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Verificar que tenemos sesión (Supabase ya hizo el exchangeCodeForSession)
        console.log('[AuthCallbackSimple] Verificando sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthCallbackSimple] Error getSession:', sessionError);
          throw sessionError;
        }

        if (!session || !session.user) {
          console.log('[AuthCallbackSimple] No hay sesión todavía, esperando...');
          // Esperar un poco más y reintentar
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession || !retrySession.user) {
            console.error('[AuthCallbackSimple] No se pudo establecer la sesión');
            throw new Error('No se pudo establecer la sesión. Intentá nuevamente.');
          }
          
          console.log('[AuthCallbackSimple] ✅ Sesión verificada (retry):', retrySession.user.email);
          return handleUserProfile(retrySession.user, alive, setMessage, navigate);
        }

        console.log('[AuthCallbackSimple] ✅ Sesión verificada:', session.user.email);

        // 4. Procesar perfil del usuario
        await handleUserProfile(session.user, alive, setMessage, navigate);

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
 * Función auxiliar para redirigir al usuario
 * 
 * Redirigimos a /chat y dejamos que el OnboardingGuard se encargue de:
 * - Si el usuario NO completó onboarding → redirige a /onboarding
 * - Si el usuario SÍ completó onboarding → permite acceso a /chat
 * 
 * Esto funciona tanto para usuarios nuevos como para usuarios existentes.
 */
async function handleUserProfile(
  user: any, 
  alive: boolean, 
  setMessage: (msg: string) => void, 
  navigate: (path: string, options?: any) => void
) {
  try {
    if (!alive) return;
    setMessage('¡Listo! Redirigiendo...');

    console.log('[AuthCallbackSimple] Usuario autenticado:', user.email);
    
    // Redirigir a /chat - El OnboardingGuard verificará automáticamente
    // si el usuario necesita completar el onboarding
    console.log('[AuthCallbackSimple] Redirigiendo a: /chat');
    console.log('[AuthCallbackSimple] (El OnboardingGuard verificará estado de onboarding)');
    console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');
    
    if (alive) {
      navigate('/chat', { replace: true });
    }
  } catch (err) {
    console.error('[AuthCallbackSimple] Error en handleUserProfile:', err);
    throw err;
  }
}
