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
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';
import { LoadingSpinner } from '../../Shared/LoadingSpinner';

export function BusinessAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 Procesando callback de confirmación de email...');

        // Obtener el hash de la URL que contiene el token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔍 Token type:', type);
        console.log('🔍 Access token presente:', !!accessToken);

        // Si es un signup confirmation, establecer la sesión
        if (type === 'signup' && accessToken && refreshToken) {
          console.log('🔍 Estableciendo sesión con tokens...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          if (data.session) {
            console.log('✅ Sesión establecida:', data.session.user.email);

            // Verificar que sea un usuario de negocio (priorizar tabla users)
            const { data: dbUser, error: dbError } = await supabase
              .from('users')
              .select('user_type')
              .eq('id', data.session.user.id)
              .single();

            if (dbError && dbError.code !== 'PGRST116') {
              throw dbError;
            }

            const userType = dbUser?.user_type ?? data.session.user.user_metadata?.user_type;
            
            if (userType !== 'business') {
              console.error('❌ Usuario no es de tipo negocio:', userType);
              throw new Error('Esta cuenta no es de tipo negocio');
            }

            console.log('✅ Usuario de negocio confirmado');
            setStatus('success');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
              navigate('/business/login', { 
                state: { emailConfirmed: true },
                replace: true
              });
            }, 2000);
          } else {
            throw new Error('No se pudo establecer la sesión');
          }
        } else {
          // Intentar obtener sesión existente
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) throw error;

          if (session) {
            console.log('✅ Sesión obtenida:', session.user.email);

            // Verificar que sea un usuario de negocio (priorizar tabla users)
            const { data: dbUser, error: dbError } = await supabase
              .from('users')
              .select('user_type')
              .eq('id', session.user.id)
              .single();

            if (dbError && dbError.code !== 'PGRST116') {
              throw dbError;
            }

            const userType = dbUser?.user_type ?? session.user.user_metadata?.user_type;
            
            if (userType !== 'business') {
              console.error('❌ Usuario no es de tipo negocio:', userType);
              throw new Error('Esta cuenta no es de tipo negocio');
            }

            console.log('✅ Usuario de negocio confirmado');
            setStatus('success');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
              navigate('/business/login', { 
                state: { emailConfirmed: true },
                replace: true
              });
            }, 2000);
          } else {
            throw new Error('No se pudo confirmar la sesión. Por favor intenta iniciar sesión.');
          }
        }
      } catch (err: any) {
        console.error('Error en callback:', err);
        setErrorMessage(err.message || 'Error al confirmar el email');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" message="Confirmando tu email..." />
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-light-blue)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Email confirmado!
          </h2>
          <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
            Tu cuenta ha sido verificada exitosamente. Redirigiendo al login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--jandi-light-blue)' }} />
        </motion.div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
          Error al confirmar email
        </h2>
        <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
          {errorMessage}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/business/login')}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Ir al Login
          </button>
          <button
            onClick={() => navigate('/business/register')}
            className="px-6 py-3 rounded-lg font-medium border-2 transition-all duration-200 hover:scale-105"
            style={{ borderColor: 'var(--jandi-light-blue)', color: 'var(--jandi-light-blue)' }}
          >
            Volver al registro
          </button>
        </div>
      </motion.div>
    </div>
  );
}
