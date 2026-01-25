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
import type { PreferencesData } from '../../types/onboarding.types';

interface Step3PreferencesProps {
  data: PreferencesData | null;
  onChange: (data: { preferences: Partial<PreferencesData> }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step3Preferences({ data, onChange, onValidationChange }: Step3PreferencesProps) {
  const [formData, setFormData] = useState<Partial<PreferencesData>>({
    priority: data?.priority || undefined,
    outOfStockAction: data?.outOfStockAction || undefined,
    favoriteBrands: data?.favoriteBrands || {},
  });

  useEffect(() => {
    const isValid = !!formData.priority && !!formData.outOfStockAction;
    onValidationChange(isValid);
  }, [formData, onValidationChange]);

  const handleChange = (field: keyof PreferencesData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange({ preferences: updated });
  };

  const priorityOptions = [
    { value: 'price', label: 'Precio', description: 'Busco las mejores ofertas' },
    { value: 'brand', label: 'Marca', description: 'Prefiero marcas conocidas' },
    { value: 'quality', label: 'Calidad', description: 'Lo mejor, sin importar el precio' },
    { value: 'consistency', label: 'Siempre lo mismo', description: 'No me gusta cambiar' },
  ];

  const outOfStockOptions = [
    { value: 'replace', label: 'Reemplazá por algo similar', description: 'JANDI elige una alternativa' },
    { value: 'notify', label: 'Avisame', description: 'Quiero decidir yo' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Ayudanos a decidir como vos
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Así JANDI puede avanzar sin molestarte.
        </p>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Cuando comprás, priorizás: *
        </label>
        <div className="space-y-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('priority', option.value as PreferencesData['priority'])}
              className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:scale-102"
              style={{
                backgroundColor: formData.priority === option.value ? 'var(--jandi-light-blue)' : 'white',
                borderColor: formData.priority === option.value ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
                color: formData.priority === option.value ? 'white' : 'var(--jandi-dark-blue)',
              }}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Out of Stock Action */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Si no hay stock: *
        </label>
        <div className="space-y-2">
          {outOfStockOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('outOfStockAction', option.value as PreferencesData['outOfStockAction'])}
              className="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:scale-102"
              style={{
                backgroundColor: formData.outOfStockAction === option.value ? 'var(--jandi-light-blue)' : 'white',
                borderColor: formData.outOfStockAction === option.value ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
                color: formData.outOfStockAction === option.value ? 'white' : 'var(--jandi-dark-blue)',
              }}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
