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
import { motion } from 'framer-motion';
import type { ShoppingData } from '../../types/onboarding.types';

const CATEGORIES = [
  { id: 'supermercado', label: 'Supermercado / Almacén', icon: '🥦' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧼' },
  { id: 'mascotas', label: 'Mascotas', icon: '🐶' },
  { id: 'farmacia', label: 'Farmacia', icon: '💊' },
  { id: 'bebidas', label: 'Bebidas', icon: '🍷' },
  { id: 'bebes', label: 'Bebés', icon: '👶' },
  { id: 'reposicion', label: 'Reposición básica', icon: '🧻' },
];

interface Step2ShoppingProps {
  data: ShoppingData | null;
  onChange: (data: { shopping: Partial<ShoppingData> }) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function Step2Shopping({ data, onChange, onValidationChange }: Step2ShoppingProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(data?.categories || []);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    const isValid = selectedCategories.length > 0;
    onValidationChange(isValid);
  }, [selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(updated);
    onChange({ shopping: { categories: updated, customCategories: [] } });
  };

  const handleCustomAdd = () => {
    if (customInput.trim()) {
      const updated = [...selectedCategories, customInput.trim()];
      setSelectedCategories(updated);
      onChange({ shopping: { categories: updated, customCategories: [] } });
      setCustomInput('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          ¿En qué te puede ayudar JANDI?
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Elegí las cosas que comprás seguido. Esto no te ata a nada.
        </p>
      </div>

      {/* Category Chips */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <motion.button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 p-4 rounded-lg border-2 font-medium transition-all duration-200"
              style={{
                backgroundColor: isSelected ? 'var(--jandi-light-blue)' : 'white',
                borderColor: isSelected ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
                color: isSelected ? 'white' : 'var(--jandi-dark-blue)',
              }}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm">{category.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Input */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          ¿Algo más que compres seguido?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomAdd()}
            placeholder="Ej: Electrónica, Libros..."
            className="flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: 'var(--jandi-gray-light)' }}
          />
          <button
            onClick={handleCustomAdd}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Selected Count */}
      <p className="text-sm text-center" style={{ color: 'var(--jandi-gray)' }}>
        {selectedCategories.length} categoría{selectedCategories.length !== 1 ? 's' : ''} seleccionada{selectedCategories.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
