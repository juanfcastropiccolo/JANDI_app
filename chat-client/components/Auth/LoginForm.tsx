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
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { ErrorMessage } from '../Shared/ErrorMessage';
import { GoogleAuthButton } from './GoogleAuthButton';

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess: () => void;
}

export function LoginForm({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
}: LoginFormProps) {
  const { login, loading, error } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validaciones básicas
    if (!email || !password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    try {
      await login({ email, password });
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setLocalError('Email o contraseña incorrectos');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/JANDI_LOGO_COMPLETO.png"
            alt="JANDI"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            Bienvenido de vuelta
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Ingresa a tu cuenta de JANDI
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {displayError && (
            <div className="mb-6">
              <ErrorMessage message={displayError} onDismiss={() => setLocalError(null)} />
            </div>
          )}

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

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Contraseña
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{
                    borderColor: 'var(--jandi-gray-light)',
                    backgroundColor: loading ? 'var(--jandi-gray-light)' : 'white',
                  }}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--jandi-light-blue)' }}
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'Ingresar'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--jandi-gray-light)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white" style={{ color: 'var(--jandi-gray)' }}>
                o continuar con
              </span>
            </div>
          </div>

          {/* Google Auth Button */}
          <GoogleAuthButton />

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              ¿No tenés cuenta?{' '}
              <button
                onClick={onNavigateToRegister}
                className="font-medium hover:underline"
                style={{ color: 'var(--jandi-light-blue)' }}
                disabled={loading}
              >
                Registrate
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
