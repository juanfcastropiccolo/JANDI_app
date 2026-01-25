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
import { CreditCardIcon } from '@heroicons/react/24/outline';
import type { PaymentData, CardData } from '../../types/onboarding.types';

interface Step5PaymentProps {
  data: PaymentData | null;
  onChange: (data: { payment: Partial<PaymentData> }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step5Payment({ data, onChange, onValidationChange }: Step5PaymentProps) {
  const [method, setMethod] = useState<'mercadopago' | 'card'>(data?.method || 'card');
  const [cardData, setCardData] = useState<Partial<CardData>>({
    number: data?.cardData?.number || '',
    name: data?.cardData?.name || '',
    expiry: data?.cardData?.expiry || '',
    cvv: data?.cardData?.cvv || '',
  });
  const [mpEmail, setMpEmail] = useState(data?.mercadoPagoEmail || '');

  useEffect(() => {
    let isValid = false;

    if (method === 'card') {
      isValid =
        cardData.number?.length === 16 &&
        !!cardData.name &&
        !!cardData.expiry &&
        cardData.cvv?.length === 3;
    } else if (method === 'mercadopago') {
      isValid = !!mpEmail && mpEmail.includes('@');
    }

    onValidationChange(isValid);

    // Update parent
    onChange({
      payment: {
        method,
        cardData: method === 'card' ? (cardData as CardData) : undefined,
        mercadoPagoEmail: method === 'mercadopago' ? mpEmail : undefined,
      },
    });
  }, [method, cardData, mpEmail, onValidationChange, onChange]);

  const handleCardChange = (field: keyof CardData, value: string) => {
    let processedValue = value;

    // Format card number (solo números)
    if (field === 'number') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    }

    // Format expiry (MM/YY)
    if (field === 'expiry') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
      if (processedValue.length >= 2) {
        processedValue = processedValue.slice(0, 2) + '/' + processedValue.slice(2);
      }
    }

    // Format CVV (solo números)
    if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardData({ ...cardData, [field]: processedValue });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Listo. JANDI ya puede encargarse.
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Siempre bajo tus reglas.
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMethod('card')}
          className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: method === 'card' ? 'var(--jandi-light-blue)' : 'white',
            borderColor: method === 'card' ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
            color: method === 'card' ? 'white' : 'var(--jandi-dark-blue)',
          }}
        >
          <CreditCardIcon className="w-8 h-8 mx-auto mb-2" />
          <div className="text-sm font-medium">Tarjeta</div>
        </button>
        <button
          onClick={() => setMethod('mercadopago')}
          className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: method === 'mercadopago' ? 'var(--jandi-light-blue)' : 'white',
            borderColor: method === 'mercadopago' ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
            color: method === 'mercadopago' ? 'white' : 'var(--jandi-dark-blue)',
          }}
        >
          <div className="text-2xl mb-2">💳</div>
          <div className="text-sm font-medium">Mercado Pago</div>
        </button>
      </div>

      {/* Card Form */}
      {method === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Número de tarjeta *
            </label>
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => handleCardChange('number', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={16}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
              Modo testing: cualquier número de 16 dígitos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Nombre en la tarjeta *
            </label>
            <input
              type="text"
              value={cardData.name}
              onChange={(e) => handleCardChange('name', e.target.value)}
              placeholder="JUAN PEREZ"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Vencimiento *
              </label>
              <input
                type="text"
                value={cardData.expiry}
                onChange={(e) => handleCardChange('expiry', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: 'var(--jandi-gray-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                CVV *
              </label>
              <input
                type="text"
                value={cardData.cvv}
                onChange={(e) => handleCardChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={3}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: 'var(--jandi-gray-light)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mercado Pago Form */}
      {method === 'mercadopago' && (
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
            Email de Mercado Pago *
          </label>
          <input
            type="email"
            value={mpEmail}
            onChange={(e) => setMpEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Modo testing: cualquier email válido
          </p>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-gray-light)' }}>
        <div className="text-2xl">🔒</div>
        <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
          <p className="font-medium mb-1">Tus datos están seguros</p>
          <p className="opacity-70">
            Usamos encriptación de nivel bancario. Nunca guardamos tu CVV.
          </p>
        </div>
      </div>
    </div>
  );
}
