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
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../services/auth.service';
import { businessDashboardService } from '../../../services/business-dashboard.service';
import type { Business } from '../../../types/business.types';

export function BusinessHeader() {
  const { user } = useAuth();
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadBusiness(businessId);
    }
  }, [businessId]);

  const loadBusiness = async (id: string) => {
    try {
      const data = await businessDashboardService.getBusinessById(id);
      setBusiness(data);
    } catch (error) {
      console.error('Error loading business:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <img src="/images/JANDI_LOGO_COMPLETO.png" alt="JANDI" className="h-8" />
          <span className="text-lg font-semibold" style={{ color: 'var(--jandi-dark-blue)' }}>
            Business
          </span>
        </div>

        {/* Nombre del negocio */}
        {business && (
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
              {business.business_name}
            </h1>
          </div>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              {user?.email?.[0].toUpperCase()}
            </div>
            <span className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
              {user?.email}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMenu && (
            <>
              {/* Overlay para cerrar el menú */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menú dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border">
                <Link 
                  to={`/business/profile/${businessId}`}
                  className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <span>👤</span>
                    <span>Mi Perfil</span>
                  </span>
                </Link>
                <Link 
                  to={`/business/config/${businessId}`}
                  className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Configuración</span>
                  </span>
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-red-600"
                >
                  <span className="flex items-center gap-2">
                    <span>🚪</span>
                    <span>Cerrar Sesión</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
