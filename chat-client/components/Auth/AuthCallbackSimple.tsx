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

export function AuthCallbackSimple() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Procesando autenticación...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const processedRef = { current: false };

    const handleCallback = async () => {
      if (processedRef.current) {
        console.log('[AuthCallbackSimple] Already processed, skipping...');
        return;
      }
      processedRef.current = true;

      try {
        console.log('[AuthCallbackSimple] ===== INICIO DEL CALLBACK =====');
        
        // 1. Verificar si hay error en la URL
        const url = new URL(window.location.href);
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (errorParam) {
          const msg = decodeURIComponent(errorDescription || errorParam);
          console.error('[AuthCallbackSimple] Error en callback:', msg);
          throw new Error(msg);
        }

        // 2. Obtener el código de auth
        const code = url.searchParams.get('code');
        console.log('[AuthCallbackSimple] Código encontrado:', code ? 'SÍ' : 'NO');

        if (!code) {
          console.warn('[AuthCallbackSimple] No hay código, redirigiendo a login');
          navigate('/login', { replace: true });
          return;
        }

        if (!alive) return;
        setMessage('Intercambiando código de autenticación...');

        // 3. Intercambiar código por sesión
        console.log('[AuthCallbackSimple] Intercambiando código...');
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('[AuthCallbackSimple] Error exchangeCodeForSession:', exchangeError);
          
          // Si el código ya fue usado, verificar si hay sesión
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession) {
            console.log('[AuthCallbackSimple] Sesión existe a pesar del error, continuando...');
          } else {
            throw exchangeError;
          }
        } else {
          console.log('[AuthCallbackSimple] ✅ Código intercambiado exitosamente');
        }

        // Limpiar URL
        window.history.replaceState({}, document.title, '/auth/callback');

        if (!alive) return;
        setMessage('Verificando sesión...');

        // 4. Verificar que tenemos sesión
        console.log('[AuthCallbackSimple] Verificando sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthCallbackSimple] Error getSession:', sessionError);
          throw sessionError;
        }

        if (!session || !session.user) {
          console.error('[AuthCallbackSimple] No hay sesión después del intercambio');
          throw new Error('No se pudo establecer la sesión');
        }

        console.log('[AuthCallbackSimple] ✅ Sesión verificada:', session.user.email);

        if (!alive) return;
        setMessage('Configurando tu perfil...');

        // 5. Crear/actualizar registro en tabla users
        console.log('[AuthCallbackSimple] Creando/actualizando usuario en DB...');
        const userId = session.user.id;
        const email = session.user.email || '';
        const fullName = 
          (session.user.user_metadata?.full_name as string) || 
          (session.user.user_metadata?.name as string) || 
          '';
        const avatarUrl = 
          (session.user.user_metadata?.avatar_url as string) || 
          (session.user.user_metadata?.picture as string) || 
          null;
        const googleId = session.user.identities?.find(i => i.provider === 'google')?.id || null;

        console.log('[AuthCallbackSimple] Datos del usuario:', {
          userId,
          email,
          fullName,
          googleId: googleId ? 'presente' : 'ausente',
        });

        // Primero verificar si el usuario ya existe
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, onboarding_completed')
          .eq('id', userId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('[AuthCallbackSimple] ❌ Error verificando usuario existente:', checkError);
          
          if (checkError.code === '42501' || checkError.message.includes('permission denied')) {
            throw new Error('ERROR RLS: No podés leer la tabla users. Ejecutá TEST_RLS.sql en Supabase.');
          }
          
          throw checkError;
        }

        console.log('[AuthCallbackSimple] Usuario existente:', existingUser ? 'SÍ' : 'NO');

        let upsertError;
        if (existingUser) {
          // Usuario existe, actualizar
          const { error } = await supabase
            .from('users')
            .update({
              last_login_at: new Date().toISOString(),
              full_name: fullName || existingUser.full_name,
              avatar_url: avatarUrl || existingUser.avatar_url,
            })
            .eq('id', userId);
          upsertError = error;
        } else {
          // Usuario no existe, crear
          const { error } = await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              full_name: fullName,
              avatar_url: avatarUrl,
              google_id: googleId,
              auth_provider: 'google',
              onboarding_completed: false,
              is_active: true,
              last_login_at: new Date().toISOString(),
              metadata: session.user.user_metadata || {},
            });
          upsertError = error;
        }

        if (upsertError) {
          console.error('[AuthCallbackSimple] ❌ Error guardando usuario:', upsertError);
          console.error('[AuthCallbackSimple] Error code:', upsertError.code);
          console.error('[AuthCallbackSimple] Error message:', upsertError.message);
          
          // Si es un error de permisos RLS, informar claramente
          if (upsertError.code === '42501' || upsertError.message.includes('permission denied')) {
            throw new Error('ERROR RLS: Las políticas de seguridad no están configuradas. Ejecutá TEST_RLS.sql en Supabase para diagnosticar.');
          }
          
          throw upsertError;
        }

        console.log('[AuthCallbackSimple] ✅ Usuario guardado en DB');

        if (!alive) return;
        setMessage('Cargando tu perfil...');

        // 6. Leer el usuario de la DB para verificar onboarding
        console.log('[AuthCallbackSimple] Leyendo usuario de DB...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, onboarding_completed')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('[AuthCallbackSimple] ❌ Error leyendo usuario:', userError);
          console.error('[AuthCallbackSimple] Error code:', userError.code);
          console.error('[AuthCallbackSimple] Error message:', userError.message);
          
          if (userError.code === '42501' || userError.message.includes('permission denied')) {
            throw new Error('ERROR RLS: No podés leer tu propio perfil. Ejecutá TEST_RLS.sql en Supabase.');
          }
          
          throw userError;
        }

        console.log('[AuthCallbackSimple] ✅ Usuario leído de DB:', userData.email);
        console.log('[AuthCallbackSimple] Onboarding completado:', userData.onboarding_completed);

        if (!alive) return;
        setMessage('¡Listo! Redirigiendo...');

        // 7. Redirigir según onboarding_completed
        const destination = userData.onboarding_completed ? '/chat' : '/onboarding';
        console.log('[AuthCallbackSimple] Redirigiendo a:', destination);
        console.log('[AuthCallbackSimple] ===== FIN DEL CALLBACK (ÉXITO) =====');
        
        setTimeout(() => {
          if (alive) navigate(destination, { replace: true });
        }, 500);

      } catch (err) {
        console.error('[AuthCallbackSimple] ===== ERROR EN CALLBACK =====');
        console.error('[AuthCallbackSimple] Error:', err);
        
        if (err instanceof Error) {
          console.error('[AuthCallbackSimple] Error name:', err.name);
          console.error('[AuthCallbackSimple] Error message:', err.message);
          console.error('[AuthCallbackSimple] Error stack:', err.stack);
        }

        // Ignorar AbortError - NO reintentar automáticamente para evitar loops
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('[AuthCallbackSimple] ⚠️ AbortError detectado - posible problema de RLS o timing');
          console.warn('[AuthCallbackSimple] Verificá que las políticas RLS estén aplicadas en Supabase');
          
          if (!alive) return;
          
          setError('Error de sincronización. Ejecutá TEST_RLS.sql en Supabase para verificar RLS.');
          setMessage('Error: Problema con políticas de seguridad');
          
          setTimeout(() => {
            if (alive) navigate('/login', { replace: true });
          }, 5000);
          return;
        }

        if (!alive) return;

        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        setMessage('Error al procesar autenticación');

        // Redirigir a login después de 5s
        setTimeout(() => {
          if (alive) {
            console.log('[AuthCallbackSimple] Redirigiendo a login después de error');
            navigate('/login', { replace: true });
          }
        }, 5000);
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
              Serás redirigido al login en 5 segundos...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
