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

import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-lg"
      style={{
        backgroundColor: '#FEE2E2',
        border: '1px solid #EF4444',
      }}
    >
      <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#DC2626' }} />
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-sm font-medium hover:underline"
          style={{ color: '#DC2626' }}
        >
          Cerrar
        </button>
      )}
    </div>
  );
}
