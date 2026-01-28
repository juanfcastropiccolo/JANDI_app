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
import type { Business, UCPProfile, Product } from '../types/business.types';

export class BusinessService {
  /**
   * Generar perfil UCP para un negocio
   */
  generateUCPProfile(businessId: string): UCPProfile {
    const baseUrl = `https://api.jandi.app/businesses/${businessId}`;

    return {
      ucp: {
        version: '2026-01-11',
        services: {
          'dev.ucp.shopping': {
            version: '2026-01-11',
            spec: 'https://ucp.dev/specification/overview',
            rest: {
              schema: 'https://ucp.dev/services/shopping/rest.openapi.json',
              endpoint: `${baseUrl}/ucp`,
            },
            a2a: {
              endpoint: `${baseUrl}/.well-known/agent-card.json`,
            },
          },
        },
        capabilities: [
          {
            name: 'dev.ucp.shopping.checkout',
            version: '2026-01-11',
            spec: 'https://ucp.dev/specification/checkout',
            schema: 'https://ucp.dev/schemas/shopping/checkout.json',
          },
          {
            name: 'dev.ucp.shopping.fulfillment',
            version: '2026-01-11',
            spec: 'https://ucp.dev/specification/fulfillment',
            schema: 'https://ucp.dev/schemas/shopping/fulfillment.json',
            extends: 'dev.ucp.shopping.checkout',
          },
          {
            name: 'dev.ucp.shopping.order',
            version: '2026-01-11',
            spec: 'https://ucp.dev/specification/order',
            schema: 'https://ucp.dev/schemas/shopping/order.json',
          },
        ],
      },
      payment: {
        handlers: [
          {
            id: crypto.randomUUID(),
            name: 'com.jandi.payment',
            version: '2026-01-11',
            spec: 'https://jandi.app/specs/payment',
            config_schema: 'https://jandi.app/schemas/payment-config.json',
            instrument_schemas: [
              'https://ucp.dev/schemas/shopping/types/card_payment_instrument.json',
            ],
            config: {
              type: 'CARD',
              tokenization_specification: {
                type: 'PUSH',
                parameters: {
                  token_retrieval_url: `${baseUrl}/payment/tokens`,
                },
              },
            },
          },
        ],
      },
    };
  }

  /**
   * Crear un nuevo negocio
   */
  async createBusiness(businessData: Partial<Business>): Promise<Business> {
    // Mapear los datos del formulario a los campos de la base de datos
    const dbData = {
      // Campos básicos (mapeo camelCase -> snake_case)
      business_name: businessData.businessName,
      legal_name: businessData.legalName,
      description: businessData.description,
      email: businessData.email,
      phone: businessData.phone,
      website_url: businessData.website_url,
      address: businessData.address,
      
      // Campos legales
      tax_id: businessData.taxId,
      business_type: businessData.businessType,
      legal_entity_type: businessData.legalEntityType,
      
      // Campos de delivery (desde DeliveryStep)
      delivery_radius_km: businessData.delivery_radius_km,
      delivery_fee: businessData.delivery_fee,
      min_order_amount: businessData.min_order_amount,
      
      // Campos nuevos con valores por defecto seguros
      operating_regions: businessData.operating_regions || [],
      delivery_methods: businessData.delivery_methods || { delivery: true, pickup: false },
      delivery_zones: businessData.delivery_zones || [],
      estimated_delivery_time_min: businessData.estimated_delivery_time_min,
      estimated_delivery_time_max: businessData.estimated_delivery_time_max,
      pickup_preparation_time_minutes: businessData.pickup_preparation_time_minutes,
      payment_methods_supported: businessData.payment_methods_supported || { 
        cash: true, 
        card: false, 
        wallet: { mercadoPago: false } 
      },
      payment_timing: businessData.payment_timing || 'both',
      return_policy: businessData.return_policy,
      refund_policy: businessData.refund_policy,
      cancellation_window_minutes: businessData.cancellation_window_minutes || 15,
      business_contact_email: businessData.business_contact_email,
      business_contact_phone: businessData.business_contact_phone,
      responsible_person_name: businessData.responsible_person_name,
      catalog_source_type: businessData.catalog_source_type || 'manual',
      price_currency: businessData.price_currency || 'ARS',
      
      // JSON fields con defaults seguros
      agent_card: businessData.agent_card || {},
      business_config: businessData.business_config || {},
      
      // Estados iniciales
      is_active: false,
      is_verified: false,
      onboarding_completed: false,
    };

    // Remover valores undefined para que la BD use sus defaults
    const cleanedData = Object.fromEntries(
      Object.entries(dbData).filter(([_, v]) => v !== undefined)
    );

    console.log('Creating business with data:', JSON.stringify(cleanedData, null, 2));

    const { data, error } = await supabase
      .from('businesses')
      .insert(cleanedData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Error al crear negocio: ${error.message}`);
    }

    // Generar y guardar UCP profile
    const ucpProfile = this.generateUCPProfile(data.id);
    await this.updateUCPProfile(data.id, ucpProfile);

    return data as Business;
  }

  /**
   * Actualizar perfil UCP
   */
  async updateUCPProfile(businessId: string, ucpProfile: UCPProfile): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .update({ ucp_profile: ucpProfile })
      .eq('id', businessId);

    if (error) throw error;
  }

  /**
   * Subir documento
   */
  async uploadDocument(
    businessId: string,
    file: File,
    documentType: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${businessId}/${documentType}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('business-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('business-documents')
      .getPublicUrl(fileName);

    // Guardar referencia en la tabla
    await supabase.from('business_documents').insert({
      business_id: businessId,
      document_type: documentType,
      document_url: publicUrl,
    });

    return publicUrl;
  }

  /**
   * Subir logo
   */
  async uploadLogo(businessId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${businessId}/logo.${fileExt}`;

    const { error } = await supabase.storage
      .from('business-logos')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('business-logos')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Crear productos en batch
   */
  async createProducts(businessId: string, products: Partial<Product>[]): Promise<Product[]> {
    const productsWithBusinessId = products.map((p) => ({
      ...p,
      business_id: businessId,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(productsWithBusinessId)
      .select();

    if (error) throw error;
    return data as Product[];
  }

  /**
   * Obtener negocios activos
   */
  async getActiveBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Business[];
  }

  /**
   * Obtener productos de un negocio
   */
  async getBusinessProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as Product[];
  }
}

export const businessService = new BusinessService();
