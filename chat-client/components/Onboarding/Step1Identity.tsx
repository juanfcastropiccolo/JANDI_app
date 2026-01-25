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
import { UserIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { IdentityData } from '../../types/onboarding.types';

interface Step1IdentityProps {
  data: IdentityData | null;
  onChange: (data: { identity: Partial<IdentityData> }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step1Identity({ data, onChange, onValidationChange }: Step1IdentityProps) {
  const [formData, setFormData] = useState<Partial<IdentityData>>({
    nickname: data?.nickname || '',
    email: data?.email || '',
    phone: data?.phone || '',
    primaryAddress: data?.primaryAddress || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'Argentina',
    },
    secondaryAddresses: data?.secondaryAddresses || [],
  });

  useEffect(() => {
    const isValid =
      !!formData.nickname &&
      !!formData.phone &&
      !!formData.primaryAddress?.street &&
      !!formData.primaryAddress?.city &&
      !!formData.primaryAddress?.state &&
      !!formData.primaryAddress?.zip;

    onValidationChange(isValid);
  }, [formData, onValidationChange]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange({ identity: updated });
  };

  const handleAddressChange = (field: string, value: string) => {
    const updated = {
      ...formData,
      primaryAddress: {
        ...formData.primaryAddress!,
        [field]: value,
      },
    };
    setFormData(updated);
    onChange({ identity: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Arranquemos por lo básico
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Esto le permite a JANDI saber quién sos y dónde hacer llegar las cosas.
        </p>
      </div>

      {/* Nickname */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Nombre / Apodo *
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            placeholder="¿Cómo querés que te llamemos?"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Teléfono *
        </label>
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+54 9 11 1234-5678"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>

      {/* Primary Address */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          <MapPinIcon className="inline w-5 h-5 mr-1" />
          Dirección principal *
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.primaryAddress?.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="Calle y número"
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.primaryAddress?.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Ciudad"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
            <input
              type="text"
              value={formData.primaryAddress?.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="Provincia"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>
          <input
            type="text"
            value={formData.primaryAddress?.zip}
            onChange={(e) => handleAddressChange('zip', e.target.value)}
            placeholder="Código postal"
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>
    </div>
  );
}
