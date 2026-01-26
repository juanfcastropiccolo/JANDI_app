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
  const [timeoutExpired, setTimeoutExpired] = React.useState(false);

  React.useEffect(() => {
    // Si ya tenemos usuario, no necesitamos esperar
    if (user) {
      console.log('[AuthGuard] User found immediately:', user.email);
      setWaitingForAuth(false);
      setTimeoutExpired(false);
      return;
    }

    // Si no hay usuario, esperar hasta 15 segundos
    console.log('[AuthGuard] Starting timer, waiting for user...');
    const timer = setTimeout(() => {
      console.log('[AuthGuard] Timer finished after 15s, user:', user ? user.email : 'null');
      setWaitingForAuth(false);
      setTimeoutExpired(true);
    }, 15000); // 15 segundos

    return () => {
      console.log('[AuthGuard] Cleaning up timer');
      clearTimeout(timer);
    };
  }, [user]); // Reiniciar el timer cada vez que cambia user

  // Mostrar loading mientras carga o mientras esperamos
  if (loading || (waitingForAuth && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Solo redirigir a login si definitivamente no hay usuario después de esperar
  if (!user && timeoutExpired) {
    console.log('[AuthGuard] No user found after timeout expired, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Si tenemos usuario, renderizar children
  if (user) {
    console.log('[AuthGuard] User authenticated:', user.email);
    return <>{children}</>;
  }

  // Caso fallback: mostrar loading
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}
