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
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}

interface CatalogData {
  products: ProductData[];
}

interface CatalogStepProps {
  data: CatalogData | null;
  onChange: (data: CatalogData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function CatalogStep({ data, onChange, onValidationChange }: CatalogStepProps) {
  const [products, setProducts] = useState<ProductData[]>(data?.products || []);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<ProductData>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
  });

  useEffect(() => {
    const isValid = products.length > 0;
    onValidationChange(isValid);
    onChange({ products });
  }, [products, onValidationChange, onChange]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      return;
    }

    const product: ProductData = {
      id: crypto.randomUUID(),
      name: newProduct.name!,
      description: newProduct.description || '',
      price: newProduct.price!,
      category: newProduct.category || 'General',
      stock: newProduct.stock || 0,
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', description: '', price: 0, category: '', stock: 0 });
    setShowForm(false);
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Catálogo de productos
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Agregá los productos o servicios que ofrecés
        </p>
      </div>

      {/* Products List */}
      {products.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 rounded-lg border-2"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            >
              <div className="flex-1">
                <h4 className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                  {product.name}
                </h4>
                <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                  ${product.price.toFixed(2)} • Stock: {product.stock}
                </p>
              </div>
              <button
                onClick={() => handleRemoveProduct(product.id)}
                className="p-2 rounded-full hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="w-5 h-5" style={{ color: '#EF4444' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Form */}
      {showForm ? (
        <div className="p-6 rounded-lg border-2" style={{ borderColor: 'var(--jandi-light-blue)', backgroundColor: 'var(--jandi-background)' }}>
          <h3 className="font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            Nuevo producto
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Nombre del producto *"
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Descripción"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)] resize-none"
              style={{ borderColor: 'var(--jandi-gray-light)' }}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Precio *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{ borderColor: 'var(--jandi-gray-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Categoría
                </label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="Ej: Snacks"
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{ borderColor: 'var(--jandi-gray-light)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                  Stock inicial
                </label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
                  style={{ borderColor: 'var(--jandi-gray-light)' }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddProduct}
                className="flex-1 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--jandi-light-blue)' }}
              >
                Agregar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'white',
                  color: 'var(--jandi-dark-blue)',
                  border: '2px solid var(--jandi-gray-light)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 rounded-lg border-2 border-dashed font-medium transition-all duration-200 hover:border-[var(--jandi-light-blue)] hover:bg-[var(--jandi-background)]"
          style={{ borderColor: 'var(--jandi-gray-light)', color: 'var(--jandi-dark-blue)' }}
        >
          <PlusIcon className="w-6 h-6 inline mr-2" />
          Agregar producto
        </button>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-2xl">💡</div>
        <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
          <p className="font-medium mb-1">Tip</p>
          <p className="opacity-70">
            Podés agregar más productos después desde tu panel de administración. Por ahora, agregá al menos uno para continuar.
          </p>
        </div>
      </div>
    </div>
  );
}
