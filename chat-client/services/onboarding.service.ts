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
   * Validar código de acceso (hash SHA-256)
   */
  private async validateAccessCode(code: string): Promise<boolean> {
    const normalized = (code ?? '').trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    
    // Hash SHA-256 del código válido "gala123"
    const validHash = 'b2760c8bd755fbc25864da592d01cd8464f97b821613b94539c0cb35860468cc';
    return hash === validHash;
  }

  /**
   * Guardar datos del onboarding en user_profiles
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<UserProfile> {
    const { identity, shopping, preferences, autonomy, payment, accessCode } = data.data;

    if (!identity || !shopping || !preferences || !autonomy || !payment || !accessCode) {
      throw new Error('All onboarding steps must be completed');
    }

    // Validar código de acceso
    const isValidCode = await this.validateAccessCode(accessCode.accessCode);
    if (!isValidCode) {
      throw new Error('Invalid access code. Please contact JANDI administration.');
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

    // Obtener email del usuario autenticado para el UPSERT
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // UPSERT en lugar de UPDATE: crea la fila si el trigger no la creó
    // (necesario cuando on_auth_user_created no dispara en replica mode)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: authUser?.email || '',
        onboarding_completed: true,
        full_name: identity.nickname,
        phone: identity.phone,
        auth_provider: (authUser?.app_metadata?.provider as 'email' | 'google') || 'email',
        is_active: true,
        user_type: 'consumer',
      }, { onConflict: 'id' });

    if (userError) throw userError;

    // También actualizar auth metadata para que futuros logins rutéen correctamente
    // sin depender de queries REST a public.users en el callback
    await supabase.auth.updateUser({
      data: { onboarding_completed: true, user_type: 'consumer' },
    });

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
