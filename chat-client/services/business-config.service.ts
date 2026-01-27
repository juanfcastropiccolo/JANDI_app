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

import { supabase } from './supabase';
import { BusinessConfiguration } from '../types/business-config.types';

/**
 * Servicio para gestionar la configuración completa del agente de negocio.
 * Mapea la configuración del frontend a:
 * - Agent Card A2A (para discovery)
 * - Business Configuration (interno)
 * - UCP Profile (comercio)
 */
export class BusinessConfigService {
  /**
   * Genera el Agent Card A2A según la especificación v0.2.1
   */
  generateAgentCard(businessId: string, config: BusinessConfiguration): any {
    const baseUrl = `https://agents.jandi.app/${businessId}`;
    
    // Generar skills dinámicamente según configuración
    const skills = [];

    // Skill: Ver menú (siempre presente)
    skills.push({
      id: 'browse-menu',
      name: 'Ver Menú',
      description: `Muestra el catálogo de productos de ${config.identity.displayName}`,
      tags: ['menu', 'catalogo', 'productos', config.identity.category],
      examples: [
        '¿Qué productos tienen?',
        'Mostrame el menú',
        '¿Cuánto sale?',
      ],
    });

    // Skill: Realizar pedido (siempre presente)
    const orderExamples = ['Quiero hacer un pedido'];
    if (config.operations.deliveryMethods.delivery) {
      orderExamples.push(`Quiero delivery a ${config.operations.deliveryZones?.[0] || 'mi zona'}`);
    }
    if (config.operations.deliveryMethods.pickup) {
      orderExamples.push('Quiero retirar en el local');
    }

    skills.push({
      id: 'place-order',
      name: 'Realizar Pedido',
      description: `Permite realizar un pedido${config.operations.deliveryMethods.delivery ? ' para delivery' : ''}${config.operations.deliveryMethods.pickup ? ' o retiro en local' : ''}`,
      tags: ['pedido', 'orden', 'compra'],
      examples: orderExamples,
    });

    // Skill: Delivery (si está habilitado)
    if (config.operations.deliveryMethods.delivery) {
      skills.push({
        id: 'check-delivery',
        name: 'Consultar Delivery',
        description: `Delivery disponible en: ${config.operations.deliveryZones?.join(', ')}`,
        tags: ['delivery', 'envio', 'zona'],
        examples: [
          '¿Hacen delivery a mi zona?',
          '¿Cuánto tardan en entregar?',
        ],
      });
    }

    // Skill: Horarios (siempre presente)
    skills.push({
      id: 'check-hours',
      name: 'Horarios de Atención',
      description: 'Informa los horarios de atención del local',
      tags: ['horario', 'abierto', 'cerrado'],
      examples: ['¿Están abiertos ahora?', '¿Hasta qué hora atienden?'],
    });

    // Skill: Métodos de pago (siempre presente)
    skills.push({
      id: 'payment-info',
      name: 'Métodos de Pago',
      description: 'Informa sobre los métodos de pago aceptados',
      tags: ['pago', 'efectivo', 'tarjeta'],
      examples: ['¿Puedo pagar con tarjeta?', '¿Aceptan efectivo?'],
    });

    // Skill: Políticas (siempre presente)
    skills.push({
      id: 'policies',
      name: 'Políticas del Negocio',
      description: 'Informa sobre políticas de devolución, cancelación y reembolsos',
      tags: ['politica', 'devolucion', 'cancelacion'],
      examples: ['¿Puedo cancelar mi pedido?', '¿Cuál es la política de devoluciones?'],
    });

    return {
      name: config.identity.displayName,
      description: `Asistente virtual de ${config.identity.displayName}, ${this.getCategoryLabel(config.identity.category)} ubicado en ${config.identity.city}, ${config.identity.country}. ${config.operations.deliveryMethods.delivery ? `Delivery disponible en: ${config.operations.deliveryZones?.join(', ')}.` : ''} ${config.operations.deliveryMethods.pickup ? 'Retiro en local disponible.' : ''}`,
      url: `${baseUrl}/a2a`,
      provider: {
        organization: config.identity.legalName,
        url: `https://jandi.app/negocios/${businessId}`,
      },
      version: '1.0.0',
      documentationUrl: `https://jandi.app/docs/agents/${businessId}`,
      capabilities: {
        streaming: true,
        pushNotifications: true,
        stateTransitionHistory: false,
      },
      securitySchemes: {
        jandi_auth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      security: [{ jandi_auth: [] }],
      defaultInputModes: ['text/plain', 'application/json'],
      defaultOutputModes: ['text/plain', 'application/json'],
      skills,
      supportsAuthenticatedExtendedCard: true,
    };
  }

  /**
   * Genera la configuración interna del negocio
   */
  generateBusinessConfig(config: BusinessConfiguration): any {
    return {
      identity: config.identity,
      operations: {
        timezone: this.getTimezone(config.identity.country, config.identity.city),
        schedule: config.operations.openingHours,
      },
      fulfillment: {
        delivery: {
          enabled: config.operations.deliveryMethods.delivery,
          zones: config.operations.deliveryZones || [],
          estimatedTime: config.operations.estimatedDeliveryTime,
        },
        pickup: {
          enabled: config.operations.deliveryMethods.pickup,
          preparationTime: config.operations.pickupPreparationTime
            ? { value: config.operations.pickupPreparationTime, unit: 'minutes' }
            : null,
        },
      },
      payment: {
        methods: this.getPaymentMethodsList(config.payment.methods),
        timing: config.payment.timing,
        currency: config.catalog.currency,
      },
      policies: {
        minimumOrder: config.policies.minimumOrderAmount,
        cancellationWindow: config.policies.cancellationWindow,
        returnPolicy: config.policies.returnPolicy,
        refundPolicy: config.policies.refundPolicy,
      },
      catalog: {
        sourceType: config.catalog.sourceType,
        lastUpdated: new Date().toISOString(),
      },
      opsContact: config.contact,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Genera el UCP Profile con capabilities y extensions
   */
  generateUCPProfile(businessId: string, config: BusinessConfiguration): any {
    const capabilities = ['dev.ucp.shopping.checkout', 'dev.ucp.shopping.order'];

    // Agregar capabilities según delivery/pickup
    if (config.operations.deliveryMethods.delivery) {
      capabilities.push('dev.ucp.shopping.fulfillment.delivery');
    }
    if (config.operations.deliveryMethods.pickup) {
      capabilities.push('dev.ucp.shopping.fulfillment.pickup');
    }

    return {
      ucp: {
        version: '2026-01-11',
        services: {
          'dev.ucp.shopping': {
            version: '2026-01-11',
            endpoint: `https://agents.jandi.app/${businessId}/ucp`,
          },
        },
        capabilities,
        extensions: {
          'com.jandi.payment': {
            handlers: this.getPaymentMethodsList(config.payment.methods),
            timing: config.payment.timing,
          },
          'com.jandi.fulfillment': {
            delivery: config.operations.deliveryMethods.delivery
              ? {
                  enabled: true,
                  zones: config.operations.deliveryZones,
                  estimatedTime: config.operations.estimatedDeliveryTime,
                }
              : { enabled: false },
            pickup: config.operations.deliveryMethods.pickup
              ? {
                  enabled: true,
                  preparationTime: {
                    value: config.operations.pickupPreparationTime,
                    unit: 'minutes',
                  },
                }
              : { enabled: false },
          },
          'com.jandi.policies': {
            minimumOrder: {
              amount: config.policies.minimumOrderAmount,
              currency: config.catalog.currency,
            },
            cancellation: {
              window: { value: config.policies.cancellationWindow, unit: 'minutes' },
            },
            returns: {
              description: config.policies.returnPolicy,
            },
            refunds: {
              description: config.policies.refundPolicy,
            },
          },
          'com.jandi.catalog': {
            sourceType: config.catalog.sourceType,
            currency: config.catalog.currency,
          },
        },
      },
    };
  }

  /**
   * Guarda la configuración completa en Supabase
   */
  async saveConfiguration(businessId: string, config: BusinessConfiguration): Promise<void> {
    const agentCard = this.generateAgentCard(businessId, config);
    const businessConfig = this.generateBusinessConfig(config);
    const ucpProfile = this.generateUCPProfile(businessId, config);

    const { error } = await supabase
      .from('businesses')
      .update({
        // Campos específicos
        operating_regions: config.identity.operatingRegions,
        delivery_methods: config.operations.deliveryMethods,
        delivery_zones: config.operations.deliveryZones || [],
        estimated_delivery_time_min: config.operations.estimatedDeliveryTime?.min,
        estimated_delivery_time_max: config.operations.estimatedDeliveryTime?.max,
        pickup_preparation_time_minutes: config.operations.pickupPreparationTime,
        payment_methods_supported: config.payment.methods,
        payment_timing: config.payment.timing,
        return_policy: config.policies.returnPolicy,
        refund_policy: config.policies.refundPolicy,
        cancellation_window_minutes: config.policies.cancellationWindow,
        business_contact_email: config.contact.email,
        business_contact_phone: config.contact.phone,
        responsible_person_name: config.contact.responsiblePerson,
        catalog_source_type: config.catalog.sourceType,
        price_currency: config.catalog.currency,
        // Snapshots JSON
        agent_card: agentCard,
        business_config: businessConfig,
        ucp_profile: ucpProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (error) throw error;
  }

  /**
   * Helpers
   */
  private getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      restaurant: 'restaurante',
      supermarket: 'supermercado',
      pharmacy: 'farmacia',
      clothing: 'tienda de ropa',
      electronics: 'tienda de electrónica',
      bookstore: 'librería',
      florist: 'floristería',
      bakery: 'panadería',
      other: 'negocio',
    };
    return labels[category] || 'negocio';
  }

  private getTimezone(country: string, city: string): string {
    // Simplificado - en producción usar librería de timezones
    const timezones: { [key: string]: string } = {
      Argentina: 'America/Argentina/Buenos_Aires',
      Chile: 'America/Santiago',
      Uruguay: 'America/Montevideo',
      Paraguay: 'America/Asuncion',
      Brasil: 'America/Sao_Paulo',
    };
    return timezones[country] || 'America/Buenos_Aires';
  }

  private getPaymentMethodsList(methods: BusinessConfiguration['payment']['methods']): string[] {
    const list = [];
    if (methods.cash) list.push('cash');
    if (methods.card) list.push('card');
    if (methods.wallet.mercadoPago) list.push('mercadopago');
    if (methods.other) list.push(methods.other);
    return list;
  }
}

export const businessConfigService = new BusinessConfigService();
