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
 * Lee el destino desde auth metadata (JWT) en lugar de hacer REST a public.users.
 * El trigger on_auth_user_created (ENABLE ALWAYS) se encarga de crear/actualizar
 * public.users automáticamente cuando GoTrue procesa el login.
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

    const handleSession = (user: any) => {
      if (processedRef.current) return;
      processedRef.current = true;
      clearTimeout(timeoutId);

      console.log('[AuthCallbackSimple] ✅ Sesión detectada:', user.email);

      window.history.replaceState({}, document.title, '/auth/callback');
      setMessage('¡Listo! Redirigiendo...');

      const destination = resolveDestinationFromMetadata(user);
      console.log('[AuthCallbackSimple] Redirigiendo a:', destination);
      console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');

      navigate(destination, { replace: true });
    };

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[AuthCallbackSimple] Auth event:', _event, 'has session:', !!session);
        if (session?.user) handleSession(session.user);
      }
    );

    // Verificar si ya hay sesión (race condition: evento disparado antes de suscribir)
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        console.warn('[AuthCallbackSimple] Error getSession inicial:', sessionError);
        return;
      }
      if (data.session?.user) {
        console.log('[AuthCallbackSimple] Sesión detectada via getSession');
        handleSession(data.session.user);
      } else {
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
 * Determinar destino desde auth metadata (sin REST a public.users).
 *
 * El trigger on_auth_user_created escribe en public.users, pero el JWT
 * ya contiene user_metadata con los datos necesarios para el routing.
 * OnboardingService actualiza auth metadata al completar onboarding,
 * por lo que onboarding_completed estará disponible en futuros logins.
 */
function resolveDestinationFromMetadata(authUser: any): string {
  const meta = authUser.user_metadata || {};
  const userType = meta.user_type || 'consumer';
  const onboardingCompleted = meta.onboarding_completed === true;

  console.log('[AuthCallbackSimple] Metadata routing:', { userType, onboardingCompleted });

  if (userType === 'business') {
    // Sin business_id en metadata, el guard del dashboard lo resolverá
    return '/business/onboarding';
  }

  return onboardingCompleted ? '/chat' : '/onboarding';
}
