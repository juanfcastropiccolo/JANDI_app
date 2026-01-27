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

import React, { useState, useEffect } from 'react';
import { businessConfigService } from '../../services/business-config.service';
import { supabase } from '../../services/supabase';
import { BusinessConfiguration } from '../../types/business-config.types';
import { CollapsibleSection } from '../Shared/CollapsibleSection';
import { Tooltip } from '../Shared/Tooltip';
import { ZoneSelector } from '../Shared/ZoneSelector';
import { ToggleWithSubfields } from '../Shared/ToggleWithSubfields';
import {
  BUSINESS_CATEGORIES,
  COUNTRIES,
  ESTIMATED_DELIVERY_TIMES,
  CANCELLATION_WINDOWS,
  CURRENCIES,
} from '../../types/business-config.types';

interface BusinessConfigPanelProps {
  businessId: string;
}

export function BusinessConfigPanel({ businessId }: BusinessConfigPanelProps) {
  const [config, setConfig] = useState<BusinessConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [businessId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar configuración actual desde Supabase
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (fetchError) throw fetchError;

      // Mapear a BusinessConfiguration
      const businessConfig: BusinessConfiguration = {
        identity: {
          legalName: data.legal_name || '',
          displayName: data.business_name || '',
          category: data.business_type || 'other',
          country: data.address?.country || 'Argentina',
          city: data.address?.city || '',
          operatingRegions: data.operating_regions || [],
        },
        operations: {
          openingHours: data.business_config?.operations?.schedule || {},
          deliveryMethods: data.delivery_methods || { delivery: true, pickup: false },
          deliveryZones: data.delivery_zones || [],
          estimatedDeliveryTime: data.estimated_delivery_time_min
            ? {
                min: data.estimated_delivery_time_min,
                max: data.estimated_delivery_time_max || data.estimated_delivery_time_min + 15,
                unit: 'minutes',
              }
            : undefined,
          pickupPreparationTime: data.pickup_preparation_time_minutes,
        },
        payment: {
          methods: data.payment_methods_supported || { cash: true, card: false, wallet: { mercadoPago: false } },
          timing: data.payment_timing || 'both',
        },
        policies: {
          returnPolicy: data.return_policy || '',
          refundPolicy: data.refund_policy || '',
          cancellationWindow: data.cancellation_window_minutes || 15,
          minimumOrderAmount: data.min_order_amount || 0,
        },
        catalog: {
          sourceType: data.catalog_source_type || 'manual',
          currency: data.price_currency || 'ARS',
        },
        contact: {
          email: data.business_contact_email || data.email || '',
          phone: data.business_contact_phone || data.phone || '',
          responsiblePerson: data.responsible_person_name || '',
        },
      };

      setConfig(businessConfig);
    } catch (err: any) {
      console.error('Error loading configuration:', err);
      setError(err.message || 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await businessConfigService.saveConfiguration(businessId, config);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--jandi-light-blue)' }} />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#fee', color: '#c33' }}>
        <p className="font-bold mb-2">Error</p>
        <p>{error}</p>
        <button
          onClick={loadConfiguration}
          className="mt-4 px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: 'var(--jandi-light-blue)' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            Configuración del Negocio
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--jandi-gray)' }}>
            Administrá la configuración de tu agente y capabilities
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: 'var(--jandi-light-blue)' }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#efe', color: '#3a3' }}>
          ✅ Configuración guardada exitosamente
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#fee', color: '#c33' }}>
          ❌ {error}
        </div>
      )}

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-2xl">💡</div>
        <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
          <p className="font-medium mb-1">Tip</p>
          <p className="opacity-70">
            Los cambios en esta configuración actualizarán automáticamente tu Agent Card A2A y las capabilities
            disponibles para tu negocio. Los clientes verán estos cambios reflejados inmediatamente.
          </p>
        </div>
      </div>

      {/* Usar el mismo UCPConfigStep pero en modo edición */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <p className="text-center text-sm mb-6" style={{ color: 'var(--jandi-gray)' }}>
          Editá la configuración de tu negocio. Los cambios se aplicarán inmediatamente.
        </p>

        {/* Aquí iría el contenido del formulario - por ahora mostramos un mensaje */}
        <div className="text-center p-12" style={{ color: 'var(--jandi-gray)' }}>
          <p className="text-lg mb-4">Panel de Configuración</p>
          <p className="text-sm">
            Reutilizar el componente UCPConfigStep aquí para editar la configuración.
            <br />
            Por ahora, la configuración se puede editar durante el registro.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
          <div className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            Métodos de entrega
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
            {[config.operations.deliveryMethods.delivery && 'Delivery', config.operations.deliveryMethods.pickup && 'Pickup']
              .filter(Boolean)
              .join(', ') || 'Ninguno'}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
          <div className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            Zonas de cobertura
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
            {config.identity.operatingRegions.length}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
          <div className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            Métodos de pago
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
            {[
              config.payment.methods.cash && 'Efectivo',
              config.payment.methods.card && 'Tarjeta',
              config.payment.methods.wallet.mercadoPago && 'MP',
            ]
              .filter(Boolean)
              .join(', ') || 'Ninguno'}
          </div>
        </div>
      </div>
    </div>
  );
}
