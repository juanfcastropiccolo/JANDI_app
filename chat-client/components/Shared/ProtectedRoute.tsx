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
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: 'business' | 'consumer';
}

export function ProtectedRoute({ children, userType }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { businessId } = useParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Verificar tipo de usuario si se especifica
      if (userType && user.user_metadata?.user_type !== userType) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Si hay businessId, verificar que el usuario tenga acceso
      if (businessId) {
        try {
          const { data, error } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', businessId)
            .eq('email', user.email)
            .single();

          if (error || !data) {
            setHasAccess(false);
          } else {
            setHasAccess(true);
          }
        } catch (err) {
          console.error('Error checking business access:', err);
          setHasAccess(false);
        }
      } else {
        setHasAccess(true);
      }

      setChecking(false);
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, businessId, userType]);

  // Mostrar loading mientras verifica
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--jandi-light-blue)' }} />
          <p style={{ color: 'var(--jandi-gray)' }}>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no está autenticado
  if (!user) {
    return <Navigate to="/business/login" replace />;
  }

  // Redirigir si no tiene acceso
  if (hasAccess === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
