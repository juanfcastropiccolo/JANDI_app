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

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

interface BusinessLoginFormProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (businessId?: string) => void;
}

export function BusinessLoginForm({ 
  onNavigateToRegister, 
  onLoginSuccess 
}: BusinessLoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const emailConfirmed = location.state?.emailConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Iniciar sesión
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      console.log('✅ Login exitoso:', data.user?.email);

      // 2. Verificar que sea usuario de negocio
      const userType = data.user?.user_metadata?.user_type;
      if (userType !== 'business') {
        await supabase.auth.signOut();
        throw new Error('Esta cuenta no es de tipo negocio. Por favor usa el login de usuarios.');
      }

      // 3. Verificar si tiene negocio creado
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', data.user.email)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        // Error diferente a "no encontrado"
        throw businessError;
      }

      // 4. Redirigir según tenga o no negocio
      if (business) {
        // Ya tiene negocio → al dashboard
        console.log('✅ Usuario tiene negocio:', business.id);
        onLoginSuccess(business.id);
      } else {
        // No tiene negocio → al onboarding
        console.log('ℹ️ Usuario sin negocio, redirigiendo a onboarding');
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/JANDI_LOGO_COMPLETO.png" alt="JANDI" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            Iniciar Sesión
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Accede a tu panel de negocio
          </p>
        </div>

        {/* Email Confirmed Message */}
        {emailConfirmed && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }}>
            <p className="text-sm text-green-800">
              ✅ Email confirmado exitosamente. Ya puedes iniciar sesión.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@negocio.com"
              required
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Tu contraseña"
              required
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={onNavigateToRegister}
              className="font-medium underline"
              style={{ color: 'var(--jandi-light-blue)' }}
            >
              Registrarse
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
