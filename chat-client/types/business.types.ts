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

import { Address } from './onboarding.types';

export interface Business {
  id: string;
  business_name: string;
  legal_name?: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  email: string;
  phone?: string;
  website_url?: string;
  address?: Address;
  tax_id?: string;
  business_type?: 'restaurant' | 'store' | 'pharmacy' | 'supermarket';
  legal_entity_type?: 'individual' | 'company';
  ucp_profile?: UCPProfile;
  business_hours?: BusinessHours;
  delivery_radius_km?: number;
  delivery_fee?: number;
  min_order_amount?: number;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // Campos de configuración del agente
  operating_regions: string[];
  delivery_methods: {
    delivery: boolean;
    pickup: boolean;
  };
  delivery_zones: string[];
  estimated_delivery_time_min?: number;
  estimated_delivery_time_max?: number;
  pickup_preparation_time_minutes?: number;
  payment_methods_supported: {
    cash: boolean;
    card: boolean;
    wallet: {
      mercadoPago: boolean;
    };
  };
  payment_timing?: string;
  return_policy?: string;
  refund_policy?: string;
  cancellation_window_minutes?: number;
  business_contact_email?: string;
  business_contact_phone?: string;
  responsible_person_name?: string;
  catalog_source_type: string;
  price_currency: string;
  agent_card: Record<string, unknown>;
  business_config: Record<string, unknown>;
}

export interface BusinessHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface UCPProfile {
  ucp: {
    version: string;
    services: Record<string, UCPService>;
    capabilities: UCPCapability[];
  };
  payment: {
    handlers: PaymentHandler[];
  };
  signing_keys?: JWK[];
}

export interface UCPService {
  version: string;
  spec: string;
  rest?: {
    schema: string;
    endpoint: string;
  };
  a2a?: {
    endpoint: string;
  };
}

export interface UCPCapability {
  name: string;
  version: string;
  spec: string;
  schema: string;
  extends?: string;
}

export interface PaymentHandler {
  id: string;
  name: string;
  version: string;
  spec: string;
  config_schema?: string;
  instrument_schemas?: string[];
  config?: Record<string, unknown>;
}

export interface JWK {
  kid: string;
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  use?: string;
  alg?: string;
}

export interface BusinessDocument {
  id: string;
  business_id: string;
  document_type: 'dni' | 'cuit' | 'menu' | 'contract' | 'bank_account';
  document_url: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Product {
  id: string;
  business_id: string;
  product_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  compare_at_price?: number;
  images?: string[];
  category?: string;
  subcategory?: string;
  brand?: string;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
  low_stock_threshold: number;
  attributes?: Record<string, unknown>;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}
