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

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface Step6AccessCodeProps {
  data: {
    accessCode?: string;
  };
  onChange: (data: { accessCode: string }) => void;
  onValidationChange: (isValid: boolean) => void;
}

// Código de acceso hasheado para seguridad
const ACCESS_CODE_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA-256 de "gala123"

function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  return crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  });
}

export function Step6AccessCode({ data, onChange, onValidationChange }: Step6AccessCodeProps) {
  const [accessCode, setAccessCode] = useState(data.accessCode || '');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Validar en cada cambio
    const validateCode = async () => {
      if (!accessCode) {
        onValidationChange(false);
        setError('');
        return;
      }

      if (accessCode.length !== 7) {
        onValidationChange(false);
        setError('');
        return;
      }

      setIsVerifying(true);
      const hash = await hashCode(accessCode);
      
      if (hash === ACCESS_CODE_HASH) {
        setError('');
        onValidationChange(true);
        onChange({ accessCode });
      } else {
        setError('Código de acceso incorrecto');
        onValidationChange(false);
      }
      setIsVerifying(false);
    };

    validateCode();
  }, [accessCode, onChange, onValidationChange]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 7);
    setAccessCode(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            <ShieldCheck size={32} style={{ color: 'var(--jandi-white)' }} />
          </div>
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--jandi-dark-blue)' }}
        >
          Acceso Administrativo
        </h2>
        <p
          className="text-base"
          style={{ color: 'var(--jandi-gray)' }}
        >
          JANDI se encuentra actualmente en fase de desarrollo
        </p>
      </div>

      {/* Información */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'rgba(8, 131, 149, 0.05)',
          borderColor: 'var(--jandi-light-blue)',
        }}
      >
        <div className="flex items-start gap-3">
          <Lock
            size={20}
            style={{ color: 'var(--jandi-light-blue)', marginTop: '2px' }}
          />
          <div className="flex-1">
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--jandi-dark-blue)' }}
            >
              Acceso Restringido
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--jandi-gray)' }}
            >
              Por el momento, solo usuarios administradores autorizados pueden acceder a la plataforma.
              Por favor, ingresá el código de acceso proporcionado por el equipo de JANDI.
            </p>
          </div>
        </div>
      </div>

      {/* Input de código */}
      <div className="space-y-2">
        <label
          htmlFor="accessCode"
          className="block text-sm font-medium"
          style={{ color: 'var(--jandi-dark-blue)' }}
        >
          Código de Acceso *
        </label>
        <input
          type="text"
          id="accessCode"
          value={accessCode}
          onChange={handleCodeChange}
          placeholder="Ingresá el código de 7 caracteres"
          maxLength={7}
          className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all text-center text-lg tracking-widest font-mono uppercase"
          style={{
            borderColor: error ? '#ef4444' : 'var(--jandi-gray-light)',
            backgroundColor: 'var(--jandi-white)',
            color: 'var(--jandi-dark-blue)',
          }}
          autoComplete="off"
          autoCapitalize="off"
        />
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
        {isVerifying && (
          <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
            Verificando código...
          </p>
        )}
        {accessCode.length === 7 && !error && !isVerifying && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <span>✓</span>
            <span>Código válido</span>
          </p>
        )}
      </div>

      {/* Nota de seguridad */}
      <div className="text-xs text-center" style={{ color: 'var(--jandi-gray)' }}>
        Si no tenés un código de acceso, contactá al equipo de JANDI en{' '}
        <a
          href="mailto:admin@jandi.com.ar"
          className="underline"
          style={{ color: 'var(--jandi-light-blue)' }}
        >
          admin@jandi.com.ar
        </a>
      </div>
    </div>
  );
}
