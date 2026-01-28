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
import { BuildingStorefrontIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface BusinessInfoData {
  businessName: string;
  legalName: string;
  businessType: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  description: string;
}

interface BusinessInfoStepProps {
  data: BusinessInfoData | null;
  onChange: (data: BusinessInfoData) => void;
  onValidationChange: (isValid: boolean) => void;
  userEmail?: string;
}

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurante / Comida' },
  { value: 'store', label: 'Tienda / Comercio' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'supermarket', label: 'Supermercado' },
  { value: 'other', label: 'Otro' },
];

export function BusinessInfoStep({ data, onChange, onValidationChange, userEmail }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState<BusinessInfoData>(
    data || {
      businessName: '',
      legalName: '',
      businessType: '',
      email: userEmail || '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Argentina',
      },
      description: '',
    }
  );

  useEffect(() => {
    const isValid =
      !!formData.businessName &&
      !!formData.businessType &&
      !!formData.email &&
      !!formData.phone &&
      !!formData.address.street &&
      !!formData.address.city &&
      !!formData.address.state &&
      !!formData.address.zip;

    onValidationChange(isValid);
    onChange(formData);
  }, [formData, onValidationChange, onChange]);

  const handleChange = (field: keyof BusinessInfoData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Información básica del negocio
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Contanos sobre tu negocio
        </p>
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Nombre del negocio *
        </label>
        <div className="relative">
          <BuildingStorefrontIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            placeholder="Ej: Pizzería Don Juan"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>

      {/* Legal Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Razón social (opcional)
        </label>
        <input
          type="text"
          value={formData.legalName}
          onChange={(e) => handleChange('legalName', e.target.value)}
          placeholder="Nombre legal de la empresa"
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        />
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Tipo de negocio *
        </label>
        <select
          value={formData.businessType}
          onChange={(e) => handleChange('businessType', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        >
          <option value="">Selecciona un tipo</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Email de contacto *
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contacto@tunegocio.com"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
            disabled={!!userEmail}
          />
        </div>
        {userEmail && (
          <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
            ℹ️ Este es el email de tu cuenta de usuario
          </p>
        )}
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

      {/* Address */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          <MapPinIcon className="inline w-5 h-5 mr-1" />
          Dirección del negocio *
        </label>
        <div className="space-y-3">
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            placeholder="Calle y número"
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Ciudad"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="Provincia"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>
          <input
            type="text"
            value={formData.address.zip}
            onChange={(e) => handleAddressChange('zip', e.target.value)}
            placeholder="Código postal"
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Descripción (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Contanos brevemente sobre tu negocio..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        />
      </div>
    </div>
  );
}
