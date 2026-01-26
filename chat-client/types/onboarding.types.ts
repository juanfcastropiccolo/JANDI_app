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

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface IdentityData {
  nickname: string;
  email: string;
  phone: string;
  primaryAddress: Address;
  secondaryAddresses: Address[];
}

export interface ShoppingData {
  categories: string[];
  customCategories: string[];
}

export interface PreferencesData {
  priority: 'price' | 'brand' | 'quality' | 'consistency';
  outOfStockAction: 'replace' | 'notify';
  favoriteBrands: Record<string, string[]>;
}

export interface AutonomyData {
  autonomyLevel: 'full' | 'semi' | 'manual';
  maxAmountPerPurchase: number;
  maxAmountPerMonth: number;
  notificationPreference: 'always' | 'threshold' | 'never';
  summaryFrequency: 'daily' | 'weekly' | 'on_anomaly';
}

export interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export interface PaymentData {
  method: 'mercadopago' | 'card';
  mercadoPagoEmail?: string;
  cardData?: CardData;
}

export interface AccessCodeData {
  accessCode: string;
}

export interface OnboardingData {
  step: number;
  totalSteps: 6;
  data: {
    identity: IdentityData | null;
    shopping: ShoppingData | null;
    preferences: PreferencesData | null;
    autonomy: AutonomyData | null;
    payment: PaymentData | null;
    accessCode: AccessCodeData | null;
  };
}

export interface UserProfile {
  id: string;
  user_id: string;
  nickname?: string;
  primary_address?: Address;
  secondary_addresses?: Address[];
  shopping_categories?: string[];
  custom_categories?: string[];
  priority?: string;
  out_of_stock_action?: string;
  favorite_brands?: Record<string, string[]>;
  autonomy_level?: string;
  max_amount_per_purchase?: number;
  max_amount_per_month?: number;
  notification_preference?: string;
  summary_frequency?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingContextType {
  onboardingData: OnboardingData;
  currentStep: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateStepData: (step: number, data: Partial<OnboardingData['data']>) => void;
  submitOnboarding: () => Promise<void>;
  loading: boolean;
  error: string | null;
}
