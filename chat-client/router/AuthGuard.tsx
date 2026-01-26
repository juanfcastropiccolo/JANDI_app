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
import { LoadingSpinner } from '../components/Shared/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuthContext();
  const [waitingForAuth, setWaitingForAuth] = React.useState(true);

  React.useEffect(() => {
    // Dar tiempo extra para que la autenticación se complete
    // Esto es importante después del callback de OAuth
    // Aumentado a 10 segundos para dar más tiempo al proceso de OAuth
    const timer = setTimeout(() => {
      console.log('[AuthGuard] Timer finished, user:', user ? user.email : 'null');
      setWaitingForAuth(false);
    }, 10000); // Esperar hasta 10 segundos antes de redirigir a login

    return () => clearTimeout(timer);
  }, [user]);

  // Mostrar loading mientras carga o mientras esperamos
  if (loading || (waitingForAuth && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Solo redirigir a login si definitivamente no hay usuario después de esperar
  if (!user) {
    console.log('[AuthGuard] No user found after waiting, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[AuthGuard] User authenticated:', user.email);
  return <>{children}</>;
}
