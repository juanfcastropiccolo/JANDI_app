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
  const [initialCheckDone, setInitialCheckDone] = React.useState(false);

  // Hacer un check inicial con timeout de seguridad
  React.useEffect(() => {
    // Si ya tenemos usuario inmediatamente, marcar como completado
    if (user) {
      console.log('[AuthGuard] User found immediately:', user.email);
      setInitialCheckDone(true);
      return;
    }

    // Si loading terminó y no hay usuario, marcar como completado
    if (!loading && !user) {
      console.log('[AuthGuard] Loading finished, no user found');
      setInitialCheckDone(true);
      return;
    }

    // Timer de seguridad: después de 8 segundos, marcar como completado de todas formas
    const safetyTimer = setTimeout(() => {
      console.log('[AuthGuard] Safety timeout reached after 8s');
      setInitialCheckDone(true);
    }, 8000);

    return () => clearTimeout(safetyTimer);
  }, [user, loading]);

  // Mostrar loading mientras:
  // 1. El auth está cargando inicialmente
  // 2. No hemos completado el check inicial
  // 3. No tenemos certeza del estado del usuario
  if (!initialCheckDone || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si el check terminó y NO hay usuario, redirigir inmediatamente
  if (!user) {
    console.log('[AuthGuard] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, renderizar children
  console.log('[AuthGuard] User authenticated:', user.email);
  return <>{children}</>;
}
