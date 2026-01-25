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
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface ReviewStepProps {
  businessData: any;
  onValidationChange: (isValid: boolean) => void;
}

export function ReviewStep({ businessData, onValidationChange }: ReviewStepProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    onValidationChange(acceptTerms);
  }, [acceptTerms, onValidationChange]);

  const { basicInfo, legalInfo, catalog, delivery } = businessData;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Revisión final
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Verificá que toda la información sea correcta
        </p>
      </div>

      {/* Summary Sections */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Basic Info */}
        {basicInfo && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
              Información básica
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Negocio:</span> {basicInfo.businessName}</p>
              <p><span className="font-medium">Tipo:</span> {basicInfo.businessType}</p>
              <p><span className="font-medium">Email:</span> {basicInfo.email}</p>
              <p><span className="font-medium">Teléfono:</span> {basicInfo.phone}</p>
              <p><span className="font-medium">Dirección:</span> {basicInfo.address.street}, {basicInfo.address.city}</p>
            </div>
          </div>
        )}

        {/* Legal Info */}
        {legalInfo && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
              Información legal
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Tipo:</span> {legalInfo.legalEntityType === 'individual' ? 'Persona Física' : 'Persona Jurídica'}</p>
              <p><span className="font-medium">{legalInfo.legalEntityType === 'individual' ? 'DNI' : 'CUIT'}:</span> {legalInfo.taxId}</p>
              <p><span className="font-medium">Documentos:</span> {Object.keys(legalInfo.documents).length} archivo(s) cargado(s)</p>
            </div>
          </div>
        )}

        {/* Catalog */}
        {catalog && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
              Catálogo
            </h3>
            <p className="text-sm">
              <span className="font-medium">{catalog.products.length}</span> producto(s) agregado(s)
            </p>
          </div>
        )}

        {/* Delivery */}
        {delivery && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
              Entregas
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Radio:</span> {delivery.deliveryRadiusKm} km</p>
              <p><span className="font-medium">Costo de envío:</span> ${delivery.deliveryFee}</p>
              <p><span className="font-medium">Pedido mínimo:</span> ${delivery.minOrderAmount}</p>
              <p><span className="font-medium">Tiempo de preparación:</span> {delivery.preparationTime} min</p>
            </div>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="p-6 rounded-lg border-2" style={{ borderColor: 'var(--jandi-light-blue)', backgroundColor: 'var(--jandi-background)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 w-5 h-5"
            style={{ accentColor: 'var(--jandi-light-blue)' }}
          />
          <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
            <p className="font-medium mb-1">Acepto los términos y condiciones *</p>
            <p className="opacity-70">
              He leído y acepto los{' '}
              <a href="#" className="underline" style={{ color: 'var(--jandi-light-blue)' }}>
                términos de servicio
              </a>{' '}
              y la{' '}
              <a href="#" className="underline" style={{ color: 'var(--jandi-light-blue)' }}>
                política de privacidad
              </a>{' '}
              de JANDI.
            </p>
          </div>
        </label>
      </div>

      {/* Final Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }}>
        <div className="text-2xl">⏱️</div>
        <div className="text-sm" style={{ color: '#92400E' }}>
          <p className="font-medium mb-1">Proceso de revisión</p>
          <p className="opacity-80">
            Una vez enviada tu solicitud, nuestro equipo la revisará en un plazo de 24-72 horas. 
            Te contactaremos por email con los próximos pasos.
          </p>
        </div>
      </div>
    </div>
  );
}
