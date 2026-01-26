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
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { AutonomyData } from '../../types/onboarding.types';

interface Step4AutonomyProps {
  data: AutonomyData | null;
  onChange: (data: { autonomy: Partial<AutonomyData> }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step4Autonomy({ data, onChange, onValidationChange }: Step4AutonomyProps) {
  const [formData, setFormData] = useState<Partial<AutonomyData>>({
    autonomyLevel: data?.autonomyLevel || 'semi',
    maxAmountPerPurchase: data?.maxAmountPerPurchase || 5000,
    maxAmountPerMonth: data?.maxAmountPerMonth || 50000,
    notificationPreference: data?.notificationPreference || 'threshold',
    summaryFrequency: data?.summaryFrequency || 'weekly',
  });

  useEffect(() => {
    const isValid =
      !!formData.maxAmountPerPurchase &&
      !!formData.maxAmountPerMonth &&
      !!formData.notificationPreference &&
      !!formData.summaryFrequency;
    onValidationChange(isValid);
  }, [formData, onValidationChange]);

  const handleChange = (field: keyof AutonomyData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange({ autonomy: updated });
  };

  const notificationOptions = [
    { value: 'always', label: 'Siempre avisame', description: 'Confirmo cada compra' },
    { value: 'threshold', label: 'Solo si pasa cierto monto', description: 'Autonomía parcial' },
    { value: 'never', label: 'Nunca (modo autónomo)', description: 'JANDI decide solo' },
  ];

  const summaryOptions = [
    { value: 'daily', label: 'Diario', icon: '📅' },
    { value: 'weekly', label: 'Semanal', icon: '📆' },
    { value: 'on_anomaly', label: 'Solo cuando pase algo raro', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          ¿Cuánta libertad le damos a JANDI?
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Vos ponés las reglas. JANDI las sigue.
        </p>
      </div>

      {/* Max Amount Per Purchase */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          JANDI puede comprar solo hasta (por compra): *
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={formData.maxAmountPerPurchase}
            onChange={(e) => handleChange('maxAmountPerPurchase', Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: 'var(--jandi-light-blue)' }}
          />
          <input
            type="number"
            value={formData.maxAmountPerPurchase}
            onChange={(e) => handleChange('maxAmountPerPurchase', Number(e.target.value))}
            className="w-32 px-4 py-2 rounded-lg border-2 text-center font-bold"
            style={{ borderColor: 'var(--jandi-light-blue)', color: 'var(--jandi-dark-blue)' }}
          />
          <span className="text-lg font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>ARS</span>
        </div>
      </div>

      {/* Max Amount Per Month */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Límite mensual: *
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={formData.maxAmountPerMonth}
            onChange={(e) => handleChange('maxAmountPerMonth', Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: 'var(--jandi-light-blue)' }}
          />
          <input
            type="number"
            value={formData.maxAmountPerMonth}
            onChange={(e) => handleChange('maxAmountPerMonth', Number(e.target.value))}
            className="w-32 px-4 py-2 rounded-lg border-2 text-center font-bold"
            style={{ borderColor: 'var(--jandi-light-blue)', color: 'var(--jandi-dark-blue)' }}
          />
          <span className="text-lg font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>ARS</span>
        </div>
      </div>

      {/* Notification Preference */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Antes de comprar: *
        </label>
        <div className="space-y-2">
          {notificationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('notificationPreference', option.value as AutonomyData['notificationPreference'])}
              className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:scale-102"
              style={{
                backgroundColor: formData.notificationPreference === option.value ? 'var(--jandi-light-blue)' : 'white',
                borderColor: formData.notificationPreference === option.value ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
                color: formData.notificationPreference === option.value ? 'white' : 'var(--jandi-dark-blue)',
              }}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Frequency */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          ¿Querés resúmenes? *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {summaryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('summaryFrequency', option.value as AutonomyData['summaryFrequency'])}
              className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-center"
              style={{
                backgroundColor: formData.summaryFrequency === option.value ? 'var(--jandi-light-blue)' : 'white',
                borderColor: formData.summaryFrequency === option.value ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
                color: formData.summaryFrequency === option.value ? 'white' : 'var(--jandi-dark-blue)',
              }}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="text-sm font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Warning for Full Autonomy */}
      {formData.notificationPreference === 'never' && (
        <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#D97706' }} />
          <p className="text-sm" style={{ color: '#92400E' }}>
            Modo autónomo activado. JANDI podrá realizar compras sin tu confirmación previa, respetando los límites establecidos.
          </p>
        </div>
      )}
    </div>
  );
}
