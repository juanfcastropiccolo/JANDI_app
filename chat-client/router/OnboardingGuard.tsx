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

import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  if (user) {
    // Obtener tipo de usuario de la columna user_type (por defecto 'consumer')
    const userType = user.user_type || 'consumer';
    
    console.log('[OnboardingGuard] User type:', userType, 'onboarding_completed:', user.onboarding_completed);
    
    // Si es usuario business, permitir acceso sin verificar onboarding
    // Los usuarios business tienen su propio flujo de onboarding
    if (userType === 'business') {
      console.log('[OnboardingGuard] Business user detected, allowing access');
      return <>{children}</>;
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
