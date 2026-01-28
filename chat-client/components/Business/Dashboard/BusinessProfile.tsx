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
import { useParams } from 'react-router-dom';
import { BusinessHeader } from './BusinessHeader';
import { BusinessNavigation } from './BusinessNavigation';
import { LoadingSpinner } from '../../Shared/LoadingSpinner';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../services/supabase';
import type { Business } from '../../../types/business.types';

export function BusinessProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadBusiness(businessId);
    }
  }, [businessId]);

  const loadBusiness = async (id: string) => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setBusiness(data);
    } catch (err: any) {
      console.error('Error loading business:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!business) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: business.business_name,
          legal_name: business.legal_name,
          description: business.description,
          phone: business.phone,
          website_url: business.website_url,
          address: business.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving business:', err);
      setError(err.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" message="Cargando perfil..." />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="p-6 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-red-600">❌ No se pudo cargar el perfil del negocio</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <BusinessHeader />
      <BusinessNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--jandi-dark-blue)' }}>
          👤 Perfil del Negocio
        </h1>

        {success && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }}>
            <p className="text-sm text-green-800">✅ Cambios guardados exitosamente</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        )}

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            🔐 Información de Usuario
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--jandi-gray)' }}>
                Email de la cuenta
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border-2 bg-gray-50"
                style={{ borderColor: '#d1d5db', color: 'var(--jandi-gray)' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
                Este es tu email de inicio de sesión (no se puede cambiar)
              </p>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            🏢 Información del Negocio
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Nombre del negocio *
              </label>
              <input
                type="text"
                value={business.business_name}
                onChange={(e) => setBusiness({ ...business, business_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Razón social
              </label>
              <input
                type="text"
                value={business.legal_name || ''}
                onChange={(e) => setBusiness({ ...business, legal_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Descripción
              </label>
              <textarea
                value={business.description || ''}
                onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={business.phone || ''}
                onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Sitio web
              </label>
              <input
                type="url"
                value={business.website_url || ''}
                onChange={(e) => setBusiness({ ...business, website_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
