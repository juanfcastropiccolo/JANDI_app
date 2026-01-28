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
import { supabase } from '../../../services/supabase';
import type { Product } from '../../../types/business.types';

interface ProductFormProps {
  businessId: string;
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({ businessId, product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    product_id: product?.product_id || '',
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    currency: product?.currency || 'ARS',
    stock_quantity: product?.stock_quantity || 0,
    category: product?.category || '',
    is_active: product?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (product) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            ...formData,
            business_id: businessId,
            stock_status: formData.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
            low_stock_threshold: 5,
          });

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--jandi-dark-blue)' }}>
          {product ? '✏️ Editar Producto' : '➕ Agregar Producto'}
        </h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product ID */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              ID del Producto (SKU) *
            </label>
            <input
              type="text"
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              placeholder="Ej: PIZZA-001"
              required
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Pizza Napolitana"
              required
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del producto..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Precio *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Stock and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Stock *
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                placeholder="0"
                min="0"
                required
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Pizzas"
                className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                style={{ borderColor: '#d1d5db' }}
              />
            </div>
          </div>

          {/* Active */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5"
                style={{ accentColor: 'var(--jandi-light-blue)' }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Producto activo (visible en el catálogo)
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-lg font-medium border-2 transition-all duration-200 hover:bg-gray-50"
              style={{ borderColor: '#d1d5db', color: 'var(--jandi-gray)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
