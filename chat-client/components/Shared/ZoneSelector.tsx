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
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ZoneSelectorProps {
  selected: string[];
  onAdd: (zone: string) => void;
  onRemove: (zone: string) => void;
  placeholder?: string;
}

export function ZoneSelector({ selected, onAdd, onRemove, placeholder = 'Agregar zona...' }: ZoneSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected zones */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((zone) => (
            <div
              key={zone}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: 'var(--jandi-light-blue)',
                color: 'white',
              }}
            >
              <span>{zone}</span>
              <button
                type="button"
                onClick={() => onRemove(zone)}
                className="hover:scale-110 transition-transform"
                aria-label={`Eliminar ${zone}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input to add new zone */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--jandi-light-blue)' }}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
