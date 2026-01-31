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

import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();
  const [checkingBusiness, setCheckingBusiness] = useState(false);
  const [businessRedirect, setBusinessRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCheckingBusiness(false);
      setBusinessRedirect(null);
      return;
    }

    const userType = user.user_type || 'consumer';
    if (userType !== 'business') {
      setCheckingBusiness(false);
      setBusinessRedirect(null);
      return;
    }

    const checkBusiness = async () => {
      setCheckingBusiness(true);
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.id) {
          setBusinessRedirect(`/business/dashboard/${data.id}`);
        } else {
          setBusinessRedirect('/business/onboarding');
        }
      } catch (err) {
        console.error('[OnboardingGuard] Error checking business access:', err);
        setBusinessRedirect('/business/onboarding');
      } finally {
        setCheckingBusiness(false);
      }
    };

    checkBusiness();
  }, [user]);

  if (user) {
    // Obtener tipo de usuario de la columna user_type (por defecto 'consumer')
    const userType = user.user_type || 'consumer';
    
    console.log('[OnboardingGuard] User type:', userType, 'onboarding_completed:', user.onboarding_completed);

    if (userType === 'business') {
      if (checkingBusiness || !businessRedirect) {
        return (
          <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <LoadingSpinner size="lg" message="Redirigiendo a tu panel..." />
          </div>
        );
      }
      console.log('[OnboardingGuard] Business user redirecting to:', businessRedirect);
      return <Navigate to={businessRedirect} replace />;
    }
    
    // Si es usuario consumer (tipo por defecto)
    // Verificar si completó el onboarding de consumidor
    if (!user.onboarding_completed) {
      console.log('[OnboardingGuard] Consumer user without onboarding, redirecting to /onboarding');
      return <Navigate to="/onboarding" replace />;
    }
    
    console.log('[OnboardingGuard] Consumer user with onboarding completed, allowing access');
  }

  return <>{children}</>;
}
