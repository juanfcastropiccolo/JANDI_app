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
import { Tooltip } from './Tooltip';

interface ToggleWithSubfieldsProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  tooltip?: string;
  children?: React.ReactNode;
}

export function ToggleWithSubfields({ label, value, onChange, tooltip, children }: ToggleWithSubfieldsProps) {
  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
            {label}
          </label>
          {tooltip && <Tooltip content={tooltip} />}
        </div>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            value ? 'bg-[var(--jandi-light-blue)]' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={value}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              value ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Subfields (conditional) */}
      {value && children && (
        <div className="ml-6 pl-4 border-l-2" style={{ borderColor: 'var(--jandi-light-blue)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
