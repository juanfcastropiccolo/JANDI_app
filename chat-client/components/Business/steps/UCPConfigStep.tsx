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

import React, { useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface UCPConfigStepProps {
  businessData: any;
  onValidationChange: (isValid: boolean) => void;
}

export function UCPConfigStep({ businessData, onValidationChange }: UCPConfigStepProps) {
  useEffect(() => {
    // Este paso es automático, siempre válido
    onValidationChange(true);
  }, [onValidationChange]);

  const capabilities = [
    {
      name: 'Checkout',
      description: 'Gestión de carritos y proceso de compra',
      icon: '🛒',
    },
    {
      name: 'Fulfillment',
      description: 'Seguimiento y gestión de entregas',
      icon: '📦',
    },
    {
      name: 'Order Management',
      description: 'Administración de pedidos y estados',
      icon: '📋',
    },
    {
      name: 'Payment Processing',
      description: 'Procesamiento seguro de pagos',
      icon: '💳',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Configuración UCP
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Tu negocio estará integrado con el protocolo Universal Commerce
        </p>
      </div>

      {/* UCP Info */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl">🔗</div>
          <div>
            <h3 className="font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              ¿Qué es UCP?
            </h3>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Universal Commerce Protocol es un estándar abierto que permite la interoperabilidad 
              entre plataformas, negocios y proveedores de pago. Tu negocio estará listo para 
              integrarse con agentes de IA y otras plataformas de comercio.
            </p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <h3 className="font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
          Capacidades habilitadas
        </h3>
        <div className="space-y-3">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border-2"
              style={{ borderColor: 'var(--jandi-light-blue)', backgroundColor: 'white' }}
            >
              <div className="text-2xl">{capability.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                    {capability.name}
                  </h4>
                  <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--jandi-gray)' }}>
                  {capability.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Details (Collapsible) */}
      <details className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <summary className="cursor-pointer font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
          Ver detalles técnicos
        </summary>
        <div className="mt-4 text-xs font-mono p-4 rounded bg-gray-900 text-green-400 overflow-x-auto">
          <pre>{JSON.stringify({
            ucp: {
              version: '2026-01-11',
              capabilities: [
                'dev.ucp.shopping.checkout',
                'dev.ucp.shopping.fulfillment',
                'dev.ucp.shopping.order',
              ],
            },
          }, null, 2)}</pre>
        </div>
      </details>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#DBEAFE', border: '1px solid #3B82F6' }}>
        <div className="text-2xl">ℹ️</div>
        <div className="text-sm" style={{ color: '#1E40AF' }}>
          <p className="font-medium mb-1">Configuración automática</p>
          <p className="opacity-80">
            JANDI configurará automáticamente todos los endpoints y schemas necesarios para que tu negocio funcione correctamente.
          </p>
        </div>
      </div>
    </div>
  );
}
