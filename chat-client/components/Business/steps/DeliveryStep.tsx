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
import { ClockIcon } from '@heroicons/react/24/outline';

interface DeliveryData {
  delivery_radius_km: number;
  delivery_fee: number;
  min_order_amount: number;
  preparationTime: number;
  business_hours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
}

interface DeliveryStepProps {
  data: DeliveryData | null;
  onChange: (data: DeliveryData) => void;
  onValidationChange: (isValid: boolean) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export function DeliveryStep({ data, onChange, onValidationChange }: DeliveryStepProps) {
  const [formData, setFormData] = useState<DeliveryData>(
    data || {
      delivery_radius_km: 5,
      delivery_fee: 500,
      min_order_amount: 1000,
      preparationTime: 30,
      business_hours: DAYS.reduce((acc, day) => ({
        ...acc,
        [day]: { open: '09:00', close: '18:00', closed: false },
      }), {}),
    }
  );

  useEffect(() => {
    const isValid =
      formData.delivery_radius_km > 0 &&
      formData.delivery_fee >= 0 &&
      formData.min_order_amount >= 0;

    onValidationChange(isValid);
    onChange(formData);
  }, [formData, onValidationChange, onChange]);

  const handleChange = (field: keyof DeliveryData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleHoursChange = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      business_hours: {
        ...formData.business_hours,
        [day]: { ...formData.business_hours[day], [field]: value },
      },
    });
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Configuración de entregas
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Define cómo funcionarán las entregas
        </p>
      </div>

      {/* Delivery Radius */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Radio de entrega (km) *
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="50"
            value={formData.delivery_radius_km}
            onChange={(e) => handleChange('delivery_radius_km', Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: 'var(--jandi-light-blue)' }}
          />
          <input
            type="number"
            value={formData.delivery_radius_km}
            onChange={(e) => handleChange('delivery_radius_km', Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg border-2 text-center font-bold"
            style={{ borderColor: 'var(--jandi-light-blue)', color: 'var(--jandi-dark-blue)' }}
          />
          <span className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>km</span>
        </div>
      </div>

      {/* Delivery Fee */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Costo de envío *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            $
          </span>
          <input
            type="number"
            value={formData.delivery_fee}
            onChange={(e) => handleChange('delivery_fee', Number(e.target.value))}
            placeholder="0"
            min="0"
            step="50"
            className="w-full pl-8 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
          Ingresá 0 para envío gratis
        </p>
      </div>

      {/* Min Order Amount */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Monto mínimo de pedido *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            $
          </span>
          <input
            type="number"
            value={formData.min_order_amount}
            onChange={(e) => handleChange('min_order_amount', Number(e.target.value))}
            placeholder="0"
            min="0"
            step="100"
            className="w-full pl-8 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>

      {/* Preparation Time */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          <ClockIcon className="inline w-5 h-5 mr-1" />
          Tiempo de preparación (minutos) *
        </label>
        <input
          type="number"
          value={formData.preparationTime}
          onChange={(e) => handleChange('preparationTime', Number(e.target.value))}
          placeholder="30"
          min="5"
          step="5"
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        />
      </div>

      {/* Business Hours */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Horarios de atención
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
              <input
                type="checkbox"
                checked={!formData.business_hours[day].closed}
                onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--jandi-light-blue)' }}
              />
              <span className="w-24 text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                {DAY_LABELS[day]}
              </span>
              {!formData.business_hours[day].closed ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={formData.business_hours[day].open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="px-3 py-1 rounded border text-sm"
                    style={{ borderColor: 'var(--jandi-gray-light)' }}
                  />
                  <span style={{ color: 'var(--jandi-gray)' }}>-</span>
                  <input
                    type="time"
                    value={formData.business_hours[day].close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    className="px-3 py-1 rounded border text-sm"
                    style={{ borderColor: 'var(--jandi-gray-light)' }}
                  />
                </div>
              ) : (
                <span className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                  Cerrado
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
