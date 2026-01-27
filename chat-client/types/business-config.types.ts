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

/**
 * Tipos para la configuración completa del agente de negocio.
 * Esta configuración se mapea automáticamente a:
 * - Agent Card A2A (para discovery)
 * - Business Configuration (interno)
 * - UCP Profile (comercio)
 */

export interface BusinessConfiguration {
  // Sección 1: Identidad y alcance
  identity: {
    legalName: string;
    displayName: string;
    category: BusinessCategory;
    country: string;
    city: string;
    operatingRegions: string[];
  };
  
  // Sección 2: Operación y entrega
  operations: {
    openingHours: WeekSchedule;
    deliveryMethods: {
      delivery: boolean;
      pickup: boolean;
    };
    deliveryZones?: string[];  // condicional si delivery=true
    estimatedDeliveryTime?: EstimatedTime;
    pickupPreparationTime?: number;  // minutos
  };
  
  // Sección 3: Métodos de pago
  payment: {
    methods: {
      cash: boolean;
      card: boolean;
      wallet: {
        mercadoPago: boolean;
      };
      other?: string;
    };
    timing: PaymentTiming;  // "online" | "on-delivery" | "both"
  };
  
  // Sección 4: Políticas comerciales
  policies: {
    returnPolicy: string;
    refundPolicy: string;
    cancellationWindow: number;  // minutos
    minimumOrderAmount: number;
  };
  
  // Sección 5: Gestión de catálogo
  catalog: {
    sourceType: CatalogSourceType;  // "manual" | "csv" | "api"
    currency: string;
  };
  
  // Sección 6: Contacto empresarial
  contact: {
    email: string;
    phone: string;
    responsiblePerson: string;
  };
}

export type BusinessCategory = 
  | 'restaurant'
  | 'supermarket'
  | 'pharmacy'
  | 'clothing'
  | 'electronics'
  | 'bookstore'
  | 'florist'
  | 'bakery'
  | 'other';

export interface WeekSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
  closed?: boolean;
}

export interface EstimatedTime {
  min: number;
  max: number;
  unit: 'minutes' | 'hours';
}

export type CatalogSourceType = 'manual' | 'csv' | 'api';
export type PaymentTiming = 'online' | 'on-delivery' | 'both';

// Constantes para los selects
export const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: 'restaurant', label: 'Restaurante / Comidas' },
  { value: 'supermarket', label: 'Supermercado / Almacén' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'clothing', label: 'Tienda de ropa' },
  { value: 'electronics', label: 'Electrónica' },
  { value: 'bookstore', label: 'Librería / Papelería' },
  { value: 'florist', label: 'Floristería' },
  { value: 'bakery', label: 'Panadería / Pastelería' },
  { value: 'other', label: 'Otro' },
];

export const COUNTRIES = [
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Brasil', label: 'Brasil' },
];

export const ESTIMATED_DELIVERY_TIMES: { value: EstimatedTime; label: string }[] = [
  { value: { min: 15, max: 30, unit: 'minutes' }, label: '15-30 minutos' },
  { value: { min: 30, max: 45, unit: 'minutes' }, label: '30-45 minutos' },
  { value: { min: 45, max: 60, unit: 'minutes' }, label: '45-60 minutos' },
  { value: { min: 60, max: 120, unit: 'minutes' }, label: '1-2 horas' },
  { value: { min: 120, max: 240, unit: 'minutes' }, label: 'Más de 2 horas' },
];

export const CANCELLATION_WINDOWS = [
  { value: 5, label: 'Hasta 5 minutos después' },
  { value: 15, label: 'Hasta 15 minutos después' },
  { value: 30, label: 'Hasta 30 minutos después' },
  { value: 60, label: 'Hasta 1 hora después' },
  { value: 0, label: 'No se permiten cancelaciones' },
];

export const CURRENCIES = [
  { value: 'ARS', label: 'ARS (Peso argentino)' },
  { value: 'USD', label: 'USD (Dólar estadounidense)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'BRL', label: 'BRL (Real brasileño)' },
  { value: 'CLP', label: 'CLP (Peso chileno)' },
];
