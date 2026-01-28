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
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';

interface BusinessOnboardingGuardProps {
  children: React.ReactNode;
}

export function BusinessOnboardingGuard({ children }: BusinessOnboardingGuardProps) {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      console.log('🔍 BusinessOnboardingGuard - Verificando acceso para:', user.email);

      // Verificar tipo de usuario
      const userType = user.user_metadata?.user_type;
      if (userType !== 'business') {
        console.log('❌ Usuario no es de tipo business:', userType);
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Verificar si ya tiene negocio
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          // Ya tiene negocio → no debería estar en onboarding
          console.log('ℹ️ Usuario ya tiene negocio:', data.id);
          setBusinessId(data.id);
          setHasAccess(false);
        } else {
          // No tiene negocio → OK para onboarding
          console.log('✅ Usuario puede acceder al onboarding');
          setHasAccess(true);
        }
      } catch (err) {
        console.error('Error checking business:', err);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading]);

  // Loading states
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <LoadingSpinner size="lg" message="Verificando acceso..." />
      </div>
    );
  }

  // No autenticado
  if (!user) {
    console.log('❌ Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/business/login" replace />;
  }

  // Ya tiene negocio
  if (hasAccess === false) {
    if (businessId) {
      console.log('↪️ Redirigiendo al dashboard:', businessId);
      return <Navigate to={`/business/dashboard/${businessId}`} replace />;
    }
    console.log('↪️ Redirigiendo al login');
    return <Navigate to="/business/login" replace />;
  }

  return <>{children}</>;
}
