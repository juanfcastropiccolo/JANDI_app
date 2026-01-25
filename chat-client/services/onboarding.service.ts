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
import type { OnboardingData, UserProfile } from '../types/onboarding.types';

export class OnboardingService {
  /**
   * Guardar datos del onboarding en user_profiles
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<UserProfile> {
    const { identity, shopping, preferences, autonomy, payment } = data.data;

    if (!identity || !shopping || !preferences || !autonomy || !payment) {
      throw new Error('All onboarding steps must be completed');
    }

    // Preparar datos para user_profiles
    const profileData = {
      user_id: userId,
      nickname: identity.nickname,
      primary_address: identity.primaryAddress,
      secondary_addresses: identity.secondaryAddresses,
      shopping_categories: shopping.categories,
      custom_categories: shopping.customCategories,
      priority: preferences.priority,
      out_of_stock_action: preferences.outOfStockAction,
      favorite_brands: preferences.favoriteBrands,
      autonomy_level: autonomy.autonomyLevel,
      max_amount_per_purchase: autonomy.maxAmountPerPurchase,
      max_amount_per_month: autonomy.maxAmountPerMonth,
      notification_preference: autonomy.notificationPreference,
      summary_frequency: autonomy.summaryFrequency,
    };

    // Insertar o actualizar perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (profileError) throw profileError;

    // Guardar método de pago (tokenizado)
    if (payment.method === 'card' && payment.cardData) {
      await this.savePaymentMethod(userId, payment);
    }

    // Actualizar usuario como onboarding completado
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        onboarding_completed: true,
        full_name: identity.nickname,
        phone: identity.phone,
      })
      .eq('id', userId);

    if (userError) throw userError;

    return profile as UserProfile;
  }

  /**
   * Guardar método de pago (mockup tokenizado)
   */
  private async savePaymentMethod(userId: string, paymentData: OnboardingData['data']['payment']): Promise<void> {
    if (!paymentData || paymentData.method !== 'card' || !paymentData.cardData) {
      return;
    }

    const { cardData } = paymentData;

    // Tokenizar tarjeta (mockup)
    const token = this.tokenizeCard(cardData);

    const paymentMethod = {
      user_id: userId,
      handler_id: 'jandi_payment_provider',
      handler_name: 'com.jandi.payment',
      type: 'card',
      brand: this.detectCardBrand(cardData.number),
      last_digits: cardData.number.slice(-4),
      expiry_month: parseInt(cardData.expiry.split('/')[0]),
      expiry_year: parseInt('20' + cardData.expiry.split('/')[1]),
      token_reference: token,
      is_default: true,
      is_active: true,
    };

    const { error } = await supabase
      .from('payment_methods')
      .insert(paymentMethod);

    if (error) throw error;
  }

  /**
   * Tokenizar tarjeta (mockup para testing)
   */
  private tokenizeCard(cardData: { number: string; name: string; expiry: string; cvv: string }): string {
    // En producción, esto llamaría a Mercado Pago o PSP
    // Para testing, generar token aleatorio
    return `tok_${crypto.randomUUID()}`;
  }

  /**
   * Detectar marca de tarjeta
   */
  private detectCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber.charAt(0);
    const firstTwoDigits = cardNumber.substring(0, 2);

    if (firstDigit === '4') return 'visa';
    if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) return 'mastercard';
    if (['34', '37'].includes(firstTwoDigits)) return 'amex';
    
    return 'unknown';
  }

  /**
   * Obtener perfil del usuario
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No profile found
      throw error;
    }

    return data as UserProfile;
  }
}

export const onboardingService = new OnboardingService();
