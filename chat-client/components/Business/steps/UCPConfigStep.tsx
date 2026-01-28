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
import { CollapsibleSection } from '../../Shared/CollapsibleSection';
import { Tooltip } from '../../Shared/Tooltip';
import { ZoneSelector } from '../../Shared/ZoneSelector';
import { ToggleWithSubfields } from '../../Shared/ToggleWithSubfields';
import {
  BusinessConfiguration,
  BUSINESS_CATEGORIES,
  COUNTRIES,
  ESTIMATED_DELIVERY_TIMES,
  CANCELLATION_WINDOWS,
  CURRENCIES,
  WeekSchedule,
} from '../../../types/business-config.types';

interface UCPConfigStepProps {
  businessData: any;
  onValidationChange: (isValid: boolean) => void;
  data?: BusinessConfiguration;
  onChange?: (data: BusinessConfiguration) => void;
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

export function UCPConfigStep({ businessData, onValidationChange, data, onChange }: UCPConfigStepProps) {
  const [config, setConfig] = useState<BusinessConfiguration>(
    data || {
      identity: {
        legalName: businessData?.basicInfo?.legalName || '',
        displayName: businessData?.basicInfo?.businessName || '',
        category: businessData?.basicInfo?.businessType || 'other',
        country: businessData?.basicInfo?.address?.country || 'Argentina',
        city: businessData?.basicInfo?.address?.city || '',
        operatingRegions: [],
      },
      operations: {
        openingHours: businessData?.delivery?.business_hours || DAYS.reduce((acc, day) => ({
          ...acc,
          [day]: { open: '09:00', close: '18:00', closed: false },
        }), {} as WeekSchedule),
        deliveryMethods: {
          delivery: true,
          pickup: false,
        },
        deliveryZones: [],
        estimatedDeliveryTime: { min: 30, max: 45, unit: 'minutes' },
        pickupPreparationTime: 20,
      },
      payment: {
        methods: {
          cash: true,
          card: false,
          wallet: { mercadoPago: false },
        },
        timing: 'both',
      },
      policies: {
        returnPolicy: '',
        refundPolicy: '',
        cancellationWindow: 15,
        minimumOrderAmount: businessData?.delivery?.minOrderAmount || 0,
      },
      catalog: {
        sourceType: 'manual',
        currency: 'ARS',
      },
      contact: {
        email: businessData?.basicInfo?.email || '',
        phone: businessData?.basicInfo?.phone || '',
        responsiblePerson: '',
      },
    }
  );

  // Validación completa
  useEffect(() => {
    const isIdentityValid = !!(
      config.identity.legalName &&
      config.identity.displayName &&
      config.identity.category &&
      config.identity.country &&
      config.identity.city &&
      config.identity.operatingRegions.length > 0
    );

    const isOperationsValid = (() => {
      if (!config.operations.deliveryMethods.delivery && !config.operations.deliveryMethods.pickup) {
        return false;
      }
      if (config.operations.deliveryMethods.delivery) {
        if (!config.operations.deliveryZones || config.operations.deliveryZones.length === 0) return false;
        if (!config.operations.estimatedDeliveryTime) return false;
      }
      if (config.operations.deliveryMethods.pickup && !config.operations.pickupPreparationTime) {
        return false;
      }
      return true;
    })();

    const isPaymentValid = (() => {
      const hasMethod =
        config.payment.methods.cash ||
        config.payment.methods.card ||
        config.payment.methods.wallet.mercadoPago ||
        !!config.payment.methods.other;
      return hasMethod && !!config.payment.timing;
    })();

    const isPoliciesValid = !!(
      config.policies.returnPolicy &&
      config.policies.refundPolicy &&
      config.policies.cancellationWindow >= 0
    );

    const isCatalogValid = !!(config.catalog.sourceType && config.catalog.currency);

    const isContactValid = !!(
      config.contact.email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact.email) &&
      config.contact.phone &&
      config.contact.responsiblePerson
    );

    const isValid =
      isIdentityValid &&
      isOperationsValid &&
      isPaymentValid &&
      isPoliciesValid &&
      isCatalogValid &&
      isContactValid;

    onValidationChange(isValid);
    if (onChange) {
      onChange(config);
    }
  }, [config, onValidationChange, onChange]);

  const updateIdentity = (field: keyof BusinessConfiguration['identity'], value: any) => {
    setConfig({ ...config, identity: { ...config.identity, [field]: value } });
  };

  const updateOperations = (field: string, value: any) => {
    setConfig({ ...config, operations: { ...config.operations, [field]: value } });
  };

  const updatePayment = (field: string, value: any) => {
    setConfig({ ...config, payment: { ...config.payment, [field]: value } });
  };

  const updatePolicies = (field: keyof BusinessConfiguration['policies'], value: any) => {
    setConfig({ ...config, policies: { ...config.policies, [field]: value } });
  };

  const updateCatalog = (field: keyof BusinessConfiguration['catalog'], value: any) => {
    setConfig({ ...config, catalog: { ...config.catalog, [field]: value } });
  };

  const updateContact = (field: keyof BusinessConfiguration['contact'], value: any) => {
    setConfig({ ...config, contact: { ...config.contact, [field]: value } });
  };

  const handleHoursChange = (day: string, field: string, value: any) => {
    setConfig({
      ...config,
      operations: {
        ...config.operations,
        openingHours: {
          ...config.operations.openingHours,
          [day]: { ...config.operations.openingHours[day], [field]: value },
        },
      },
    });
  };

  // Validaciones por sección
  const isIdentityComplete = !!(
    config.identity.legalName &&
    config.identity.displayName &&
    config.identity.category &&
    config.identity.country &&
    config.identity.city &&
    config.identity.operatingRegions.length > 0
  );

  const isOperationsComplete = (() => {
    if (!config.operations.deliveryMethods.delivery && !config.operations.deliveryMethods.pickup) return false;
    if (config.operations.deliveryMethods.delivery) {
      if (!config.operations.deliveryZones || config.operations.deliveryZones.length === 0) return false;
      if (!config.operations.estimatedDeliveryTime) return false;
    }
    if (config.operations.deliveryMethods.pickup && !config.operations.pickupPreparationTime) return false;
    return true;
  })();

  const isPaymentComplete = (() => {
    const hasMethod =
      config.payment.methods.cash ||
      config.payment.methods.card ||
      config.payment.methods.wallet.mercadoPago ||
      !!config.payment.methods.other;
    return hasMethod && !!config.payment.timing;
  })();

  const isPoliciesComplete = !!(
    config.policies.returnPolicy &&
    config.policies.refundPolicy &&
    config.policies.cancellationWindow >= 0
  );

  const isCatalogComplete = !!(config.catalog.sourceType && config.catalog.currency);

  const isContactComplete = !!(
    config.contact.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact.email) &&
    config.contact.phone &&
    config.contact.responsiblePerson
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Configuración de tu negocio
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Completá la información para que podamos configurar tu tienda y empezar a recibir pedidos
        </p>
      </div>

      {/* SECCIÓN 1: Identidad y Alcance */}
      <CollapsibleSection
        title="Identidad y alcance"
        icon="🏢"
        defaultExpanded={true}
        isCompleted={isIdentityComplete}
      >
        <div className="space-y-4">
          {/* Nombre legal */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Nombre legal *
              <Tooltip content="Razón social registrada de tu negocio (ej: 'Pizzería Don Juan S.R.L.'). Aparecerá en documentos legales" />
            </label>
            <input
              type="text"
              value={config.identity.legalName}
              onChange={(e) => updateIdentity('legalName', e.target.value)}
              placeholder="Ej: Pizzería Don Juan S.R.L."
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Nombre comercial */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Nombre comercial *
              <Tooltip content="Nombre que verán tus clientes en la app (ej: 'Don Juan Pizzas'). Puede ser diferente al nombre legal" />
            </label>
            <input
              type="text"
              value={config.identity.displayName}
              onChange={(e) => updateIdentity('displayName', e.target.value)}
              placeholder="Ej: Don Juan Pizzas"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Categoría *
              <Tooltip content="Tipo de negocio. Ayuda a los clientes a encontrarte cuando buscan productos o servicios como los tuyos" />
            </label>
            <select
              value={config.identity.category}
              onChange={(e) => updateIdentity('category', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            >
              <option value="">Selecciona una categoría</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* País */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              País *
              <Tooltip content="País donde está registrado y opera tu negocio" />
            </label>
            <select
              value={config.identity.country}
              onChange={(e) => updateIdentity('country', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            >
              {COUNTRIES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Ciudad principal *
              <Tooltip content="Ciudad donde está ubicado tu local principal o punto de venta" />
            </label>
            <input
              type="text"
              value={config.identity.city}
              onChange={(e) => updateIdentity('city', e.target.value)}
              placeholder="Ej: Córdoba"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Regiones de operación */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Regiones de operación *
              <Tooltip content="Barrios, zonas o localidades donde realizás entregas o tenés presencia. Los clientes fuera de estas zonas no podrán hacer pedidos" />
            </label>
            <ZoneSelector
              selected={config.identity.operatingRegions}
              onAdd={(zone) => updateIdentity('operatingRegions', [...config.identity.operatingRegions, zone])}
              onRemove={(zone) =>
                updateIdentity(
                  'operatingRegions',
                  config.identity.operatingRegions.filter((z) => z !== zone)
                )
              }
              placeholder="Ej: Centro, Nueva Córdoba..."
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* SECCIÓN 2: Operación y Entrega */}
      <CollapsibleSection
        title="Operación y entrega"
        icon="🚚"
        defaultExpanded={false}
        isCompleted={isOperationsComplete}
      >
        <div className="space-y-6">
          {/* Horarios de atención */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
              Horarios de atención
              <Tooltip content="Horarios en que tu negocio está abierto para recibir pedidos. Fuera de estos horarios, los clientes no podrán realizar compras" />
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--jandi-background)' }}
                >
                  <input
                    type="checkbox"
                    checked={!config.operations.openingHours[day]?.closed}
                    onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--jandi-light-blue)' }}
                  />
                  <span className="w-24 text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                    {DAY_LABELS[day]}
                  </span>
                  {!config.operations.openingHours[day]?.closed ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={config.operations.openingHours[day]?.open || '09:00'}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        className="px-3 py-1 rounded border text-sm"
                        style={{ borderColor: 'var(--jandi-gray-light)' }}
                      />
                      <span style={{ color: 'var(--jandi-gray)' }}>-</span>
                      <input
                        type="time"
                        value={config.operations.openingHours[day]?.close || '18:00'}
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

          {/* Delivery */}
          <ToggleWithSubfields
            label="¿Ofrecés delivery?"
            value={config.operations.deliveryMethods.delivery}
            onChange={(val) =>
              updateOperations('deliveryMethods', { ...config.operations.deliveryMethods, delivery: val })
            }
            tooltip="Enviás pedidos a domicilio del cliente. Si lo activás, tendrás que configurar las zonas donde hacés entregas"
          >
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Zonas de delivery *
                  <Tooltip content="Barrios o zonas específicas donde hacés delivery. Los clientes fuera de estas zonas no podrán pedir delivery" />
                </label>
                <ZoneSelector
                  selected={config.operations.deliveryZones || []}
                  onAdd={(zone) => updateOperations('deliveryZones', [...(config.operations.deliveryZones || []), zone])}
                  onRemove={(zone) =>
                    updateOperations(
                      'deliveryZones',
                      (config.operations.deliveryZones || []).filter((z) => z !== zone)
                    )
                  }
                  placeholder="Ej: Centro, Alberdi..."
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Tiempo estimado de delivery *
                  <Tooltip content="Tiempo promedio que tardás en entregar un pedido desde que el cliente lo confirma. Este tiempo se mostrará al cliente" />
                </label>
                <select
                  value={JSON.stringify(config.operations.estimatedDeliveryTime)}
                  onChange={(e) => updateOperations('estimatedDeliveryTime', JSON.parse(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{ borderColor: 'var(--jandi-gray-light)' }}
                >
                  {ESTIMATED_DELIVERY_TIMES.map((time, idx) => (
                    <option key={idx} value={JSON.stringify(time.value)}>
                      {time.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ToggleWithSubfields>

          {/* Pickup */}
          <ToggleWithSubfields
            label="¿Ofrecés retiro en local?"
            value={config.operations.deliveryMethods.pickup}
            onChange={(val) =>
              updateOperations('deliveryMethods', { ...config.operations.deliveryMethods, pickup: val })
            }
            tooltip="Los clientes pueden retirar sus pedidos en tu negocio. Es una buena opción si querés ofrecer envío gratis"
          >
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Tiempo de preparación (minutos) *
                <Tooltip content="Tiempo que tardás en tener el pedido listo para que el cliente lo retire. Este tiempo se mostrará al cliente" />
              </label>
              <input
                type="number"
                value={config.operations.pickupPreparationTime || 20}
                onChange={(e) => updateOperations('pickupPreparationTime', Number(e.target.value))}
                min="5"
                step="5"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: 'var(--jandi-gray-light)' }}
              />
            </div>
          </ToggleWithSubfields>
        </div>
      </CollapsibleSection>

      {/* SECCIÓN 3: Métodos de Pago */}
      <CollapsibleSection
        title="Métodos de pago"
        icon="💳"
        defaultExpanded={false}
        isCompleted={isPaymentComplete}
      >
        <div className="space-y-4">
          <p className="text-sm mb-4" style={{ color: 'var(--jandi-gray)' }}>
            Indicá cómo pueden pagarte tus clientes
          </p>

          {/* Métodos aceptados */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.payment.methods.cash}
                onChange={(e) =>
                  updatePayment('methods', { ...config.payment.methods, cash: e.target.checked })
                }
                className="w-4 h-4"
                style={{ accentColor: 'var(--jandi-light-blue)' }}
              />
              <label className="flex items-center gap-2 font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Efectivo
                <Tooltip content="Aceptás pago en efectivo al momento de la entrega o retiro" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.payment.methods.card}
                onChange={(e) =>
                  updatePayment('methods', { ...config.payment.methods, card: e.target.checked })
                }
                className="w-4 h-4"
                style={{ accentColor: 'var(--jandi-light-blue)' }}
              />
              <label className="flex items-center gap-2 font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Tarjeta (débito/crédito)
                <Tooltip content="Aceptás pagos con tarjeta de débito o crédito (online o al momento de entrega/retiro)" />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.payment.methods.wallet.mercadoPago}
                onChange={(e) =>
                  updatePayment('methods', {
                    ...config.payment.methods,
                    wallet: { ...config.payment.methods.wallet, mercadoPago: e.target.checked },
                  })
                }
                className="w-4 h-4"
                style={{ accentColor: 'var(--jandi-light-blue)' }}
              />
              <label className="flex items-center gap-2 font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Mercado Pago
                <Tooltip content="Aceptás pagos con Mercado Pago u otras billeteras digitales" />
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Otro método (opcional)
                <Tooltip content="Si aceptás otro método de pago (ej: transferencia bancaria), especificá cuál" />
              </label>
              <input
                type="text"
                value={config.payment.methods.other || ''}
                onChange={(e) =>
                  updatePayment('methods', { ...config.payment.methods, other: e.target.value })
                }
                placeholder="Ej: Transferencia bancaria"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: 'var(--jandi-gray-light)' }}
              />
            </div>
          </div>

          {/* Momento de pago */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              ¿Cuándo cobras? *
              <Tooltip content="Momento en que el cliente realiza el pago: al confirmar el pedido (online) o al recibirlo/retirarlo" />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment-timing"
                  value="online"
                  checked={config.payment.timing === 'online'}
                  onChange={(e) => updatePayment('timing', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <span style={{ color: 'var(--jandi-dark-blue)' }}>Al realizar el pedido (online)</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment-timing"
                  value="on-delivery"
                  checked={config.payment.timing === 'on-delivery'}
                  onChange={(e) => updatePayment('timing', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <span style={{ color: 'var(--jandi-dark-blue)' }}>Al recibir/retirar el pedido</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment-timing"
                  value="both"
                  checked={config.payment.timing === 'both'}
                  onChange={(e) => updatePayment('timing', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <span style={{ color: 'var(--jandi-dark-blue)' }}>Ambas opciones disponibles</span>
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* SECCIÓN 4: Políticas Comerciales */}
      <CollapsibleSection
        title="Políticas comerciales"
        icon="📜"
        defaultExpanded={false}
        isCompleted={isPoliciesComplete}
      >
        <div className="space-y-4">
          <p className="text-sm mb-4" style={{ color: 'var(--jandi-gray)' }}>
            Definí las reglas para devoluciones, cancelaciones y pedidos
          </p>

          {/* Política de devoluciones */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Política de devoluciones *
              <Tooltip content="Explicá en qué casos aceptás devoluciones. Ej: 'Aceptamos devoluciones hasta 24hs si el producto tiene defectos'. Sé claro para evitar problemas" />
            </label>
            <textarea
              value={config.policies.returnPolicy}
              onChange={(e) => updatePolicies('returnPolicy', e.target.value)}
              placeholder="Ej: Aceptamos devoluciones hasta 24hs si el producto tiene defectos"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Política de reembolsos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Política de reembolsos *
              <Tooltip content="Explicá cómo y cuándo devolvés el dinero. Ej: 'Reembolso completo en 5-7 días hábiles'. Incluí el método de reembolso si es relevante" />
            </label>
            <textarea
              value={config.policies.refundPolicy}
              onChange={(e) => updatePolicies('refundPolicy', e.target.value)}
              placeholder="Ej: Reembolso completo en 5-7 días hábiles"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Ventana de cancelación */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Ventana de cancelación *
              <Tooltip content="Tiempo máximo en que el cliente puede cancelar su pedido sin cargo. Después de este tiempo, la cancelación quedará a tu criterio" />
            </label>
            <select
              value={config.policies.cancellationWindow}
              onChange={(e) => updatePolicies('cancellationWindow', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            >
              {CANCELLATION_WINDOWS.map((window) => (
                <option key={window.value} value={window.value}>
                  {window.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monto mínimo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Monto mínimo de pedido
              <Tooltip content="Monto mínimo que debe alcanzar un pedido para ser procesado. Dejá en 0 si no tenés monto mínimo" />
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold"
                style={{ color: 'var(--jandi-dark-blue)' }}
              >
                $
              </span>
              <input
                type="number"
                value={config.policies.minimumOrderAmount}
                onChange={(e) => updatePolicies('minimumOrderAmount', Number(e.target.value))}
                min="0"
                step="100"
                className="w-full pl-8 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: 'var(--jandi-gray-light)' }}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* SECCIÓN 5: Gestión de Catálogo */}
      <CollapsibleSection
        title="Gestión de catálogo"
        icon="📦"
        defaultExpanded={false}
        isCompleted={isCatalogComplete}
      >
        <div className="space-y-4">
          <p className="text-sm mb-4" style={{ color: 'var(--jandi-gray)' }}>
            Elegí cómo vas a actualizar tus productos y precios
          </p>

          {/* Método de carga */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Método de carga *
              <Tooltip content="Elegí cómo vas a mantener actualizado tu catálogo de productos: Manual (desde el panel web), CSV (subiendo un archivo), o API (integración avanzada)" />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="catalog-source"
                  value="manual"
                  checked={config.catalog.sourceType === 'manual'}
                  onChange={(e) => updateCatalog('sourceType', e.target.value as any)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <div>
                  <div style={{ color: 'var(--jandi-dark-blue)' }} className="font-medium">
                    Manual (desde el panel web de JANDI)
                  </div>
                  <div className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                    Agregás y editás productos directamente desde tu panel
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="catalog-source"
                  value="csv"
                  checked={config.catalog.sourceType === 'csv'}
                  onChange={(e) => updateCatalog('sourceType', e.target.value as any)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <div>
                  <div style={{ color: 'var(--jandi-dark-blue)' }} className="font-medium">
                    Archivo CSV (subirás un archivo cada vez que actualices)
                  </div>
                  <div className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                    Ideal si ya tenés tu catálogo en Excel o CSV
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                <input
                  type="radio"
                  name="catalog-source"
                  value="api"
                  disabled
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--jandi-light-blue)' }}
                />
                <div>
                  <div style={{ color: 'var(--jandi-dark-blue)' }} className="font-medium">
                    Integración API (próximamente)
                  </div>
                  <div className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                    Te contactaremos para configurar la integración
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Moneda */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Moneda *
              <Tooltip content="Moneda en que están expresados los precios de tus productos" />
            </label>
            <select
              value={config.catalog.currency}
              onChange={(e) => updateCatalog('currency', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* SECCIÓN 6: Contacto Empresarial */}
      <CollapsibleSection
        title="Contacto empresarial"
        icon="📞"
        defaultExpanded={false}
        isCompleted={isContactComplete}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <span className="text-xl">🔒</span>
            <p className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
              Estos datos son solo para uso interno de JANDI. Los clientes verán la información de contacto que
              configuraste en el paso 1 (Info Básica).
            </p>
          </div>

          {/* Email empresarial */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Email empresarial *
              <Tooltip content="Email para que JANDI pueda contactarte sobre tu cuenta, pedidos, o soporte. No es visible para los clientes" />
            </label>
            <input
              type="email"
              value={config.contact.email}
              onChange={(e) => updateContact('email', e.target.value)}
              placeholder="admin@tunegocio.com"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Teléfono de contacto *
              <Tooltip content="Teléfono para contacto directo con JANDI en caso de problemas o consultas. No es visible para los clientes" />
            </label>
            <input
              type="tel"
              value={config.contact.phone}
              onChange={(e) => updateContact('phone', e.target.value)}
              placeholder="+54 351 1234567"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>

          {/* Responsable */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Responsable *
              <Tooltip content="Nombre completo de la persona responsable del negocio o de la cuenta en JANDI" />
            </label>
            <input
              type="text"
              value={config.contact.responsiblePerson}
              onChange={(e) => updateContact('responsiblePerson', e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-2xl">💡</div>
        <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
          <p className="font-medium mb-1">Tip</p>
          <p className="opacity-70">
            Esta configuración se realiza una sola vez. Después podrás modificarla desde tu panel de administración.
          </p>
        </div>
      </div>
    </div>
  );
}
