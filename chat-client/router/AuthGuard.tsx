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
  const startTimeRef = React.useRef(Date.now());

  // Hacer un check inicial con timeout de seguridad mejorado
  React.useEffect(() => {
    const elapsedTime = Date.now() - startTimeRef.current;
    
    // Si ya tenemos usuario, marcar como completado inmediatamente
    if (user) {
      console.log(`[AuthGuard] ✅ User found after ${elapsedTime}ms:`, user.email);
      setInitialCheckDone(true);
      return;
    }

    // Timer de seguridad: después de 12 segundos, marcar como completado
    // Eliminamos el check rápido de !loading && !user para evitar race conditions
    const safetyTimer = setTimeout(() => {
      const finalElapsed = Date.now() - startTimeRef.current;
      console.log(`[AuthGuard] ⏱️ Safety timeout reached after ${finalElapsed}ms, user:`, user ? user.email : 'null');
      setInitialCheckDone(true);
    }, 12000); // Aumentado de 8s a 12s

    return () => clearTimeout(safetyTimer);
  }, [user, loading]);

  // Mostrar loading mientras no hayamos completado el check inicial
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm" style={{ color: 'var(--jandi-gray)' }}>
            Verificando autenticación...
          </p>
        </div>
      </div>
    );
  }

  // Si el check terminó y NO hay usuario, redirigir a login
  if (!user) {
    console.log('[AuthGuard] ❌ No user found after check, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, renderizar children
  console.log('[AuthGuard] ✅ User authenticated:', user.email, 'onboarding:', user.onboarding_completed);
  return <>{children}</>;
}
