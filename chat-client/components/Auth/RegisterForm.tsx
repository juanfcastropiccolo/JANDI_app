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
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { ErrorMessage } from '../Shared/ErrorMessage';
import { GoogleAuthButton } from './GoogleAuthButton';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export function RegisterForm({
  onNavigateToLogin,
  onRegisterSuccess,
}: RegisterFormProps) {
  const { register, loading, error } = useAuthContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validaciones
    if (!fullName || !email || !password || !confirmPassword) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    try {
      await register({ email, password, full_name: fullName });
      onRegisterSuccess();
    } catch (err) {
      console.error('Register error:', err);
      setLocalError('Error al registrarse. Por favor intenta nuevamente.');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--jandi-background)' }}>
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
            Crear cuenta
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Comienza tu experiencia con JANDI
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {displayError && (
            <div className="mb-6">
              <ErrorMessage message={displayError} onDismiss={() => setLocalError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Nombre completo
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{
                    borderColor: 'var(--jandi-gray-light)',
                    backgroundColor: loading ? 'var(--jandi-gray-light)' : 'white',
                  }}
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{
                    borderColor: 'var(--jandi-gray-light)',
                    backgroundColor: loading ? 'var(--jandi-gray-light)' : 'white',
                  }}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
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
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'Crear cuenta'}
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

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-medium hover:underline"
                style={{ color: 'var(--jandi-light-blue)' }}
                disabled={loading}
              >
                Ingresá
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
