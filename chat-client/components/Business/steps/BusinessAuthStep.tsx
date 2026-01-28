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

import React, { useEffect, useState } from 'react';
import { EnvelopeIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../../services/auth.service';

interface BusinessAuthData {
  email: string;
  password: string;
  userId?: string;
}

interface BusinessAuthStepProps {
  data: BusinessAuthData | null;
  onChange: (data: BusinessAuthData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function BusinessAuthStep({ data, onChange, onValidationChange }: BusinessAuthStepProps) {
  const [formData, setFormData] = useState({
    email: data?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Validar fortaleza de contraseña
  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) return 'weak';
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (password.length >= 12 && score >= 3) return 'strong';
    if (password.length >= 8 && score >= 2) return 'medium';
    return 'weak';
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  useEffect(() => {
    // Validar si puede proceder
    const isValid = 
      success && 
      !!data?.userId &&
      !!data?.email;
    
    onValidationChange(isValid);
  }, [success, data, onValidationChange]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    if (!formData.email) return 'Por favor ingresa tu email';
    if (!validateEmail(formData.email)) return 'Email inválido';
    if (!formData.password) return 'Por favor ingresa una contraseña';
    if (formData.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
    if (!acceptTerms) return 'Debes aceptar los términos y condiciones';
    return null;
  };

  const handleSignUp = async () => {
    setError(null);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      
      // Crear usuario en Supabase Auth
      const { user } = await authService.signUpBusiness(
        formData.email,
        formData.password
      );

      if (user) {
        setSuccess(true);
        onChange({
          email: user.email!,
          password: formData.password,
          userId: user.id,
        });
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      
      // Mensajes de error más amigables
      if (err.message?.includes('already registered')) {
        setError('Este email ya está registrado. Por favor, inicia sesión o usa otro email.');
      } else if (err.message?.includes('Invalid email')) {
        setError('Email inválido. Por favor verifica el formato.');
      } else if (err.message?.includes('Password')) {
        setError('La contraseña no cumple con los requisitos mínimos.');
      } else {
        setError(err.message || 'Error al crear la cuenta. Por favor intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'strong': return '#10b981';
      default: return '#d1d5db';
    }
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircleIcon className="w-10 h-10" style={{ color: '#10b981' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Cuenta creada exitosamente!
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--jandi-gray)' }}>
            Tu cuenta ha sido creada con el email: <strong>{formData.email}</strong>
          </p>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
            <p className="text-sm" style={{ color: '#1e40af' }}>
              ✓ Sesión iniciada automáticamente<br />
              ✓ Ahora puedes continuar con el registro de tu negocio
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Crear tu cuenta
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Primero necesitamos crear tu cuenta de usuario
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
          <p className="text-sm" style={{ color: '#dc2626' }}>
            ❌ {error}
          </p>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Email del negocio *
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="tu-negocio@ejemplo.com"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
            disabled={loading}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
          Este será tu email para iniciar sesión
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Contraseña *
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Mínimo 8 caracteres"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
            disabled={loading}
          />
        </div>
        {passwordStrength && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                Fortaleza: <span style={{ color: getPasswordStrengthColor(), fontWeight: 'bold' }}>
                  {getPasswordStrengthLabel()}
                </span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                  backgroundColor: getPasswordStrengthColor(),
                }}
              />
            </div>
          </div>
        )}
        <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
          Usa al menos 8 caracteres con mayúsculas, minúsculas y números
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Confirmar contraseña *
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Repite tu contraseña"
            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
            disabled={loading}
          />
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
            ❌ Las contraseñas no coinciden
          </p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 w-5 h-5"
            style={{ accentColor: 'var(--jandi-light-blue)' }}
            disabled={loading}
          />
          <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
            <p className="font-medium mb-1">Acepto los términos y condiciones *</p>
            <p className="opacity-70">
              He leído y acepto los{' '}
              <a href="#" className="underline" style={{ color: 'var(--jandi-light-blue)' }}>
                términos de servicio
              </a>{' '}
              y la{' '}
              <a href="#" className="underline" style={{ color: 'var(--jandi-light-blue)' }}>
                política de privacidad
              </a>{' '}
              de JANDI.
            </p>
          </div>
        </label>
      </div>

      {/* Create Account Button */}
      <button
        onClick={handleSignUp}
        disabled={loading || !acceptTerms}
        className="w-full py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--jandi-light-blue)' }}
      >
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </button>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
        <div className="text-2xl">💡</div>
        <div className="text-sm" style={{ color: '#92400e' }}>
          <p className="font-medium mb-1">¿Por qué necesito crear una cuenta?</p>
          <p className="opacity-80">
            Tu cuenta te permitirá gestionar tu negocio, ver órdenes, actualizar productos y configurar tu agente de ventas.
          </p>
        </div>
      </div>
    </div>
  );
}
