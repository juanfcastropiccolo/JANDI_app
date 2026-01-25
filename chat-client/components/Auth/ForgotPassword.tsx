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
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { ErrorMessage } from '../Shared/ErrorMessage';
import { SuccessMessage } from '../Shared/SuccessMessage';

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
}

export function ForgotPassword({ onNavigateToLogin }: ForgotPasswordProps) {
  const { resetPassword, loading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Error al enviar el email. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <button
          onClick={onNavigateToLogin}
          className="flex items-center gap-2 mb-6 text-sm font-medium hover:underline"
          style={{ color: 'var(--jandi-dark-blue)' }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver al login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/JANDI_LOGO_COMPLETO.png"
            alt="JANDI"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            Recuperar contraseña
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Te enviaremos un link para restablecer tu contraseña
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {success && (
            <div className="mb-6">
              <SuccessMessage 
                message="¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña."
                onDismiss={() => setSuccess(false)}
              />
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                    style={{
                      borderColor: 'var(--jandi-gray-light)',
                      backgroundColor: loading ? 'var(--jandi-gray-light)' : 'white',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: 'var(--jandi-light-blue)' }}
              >
                {loading ? <LoadingSpinner size="sm" color="white" /> : 'Enviar email'}
              </button>
            </form>
          )}

          {success && (
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              Volver al login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
