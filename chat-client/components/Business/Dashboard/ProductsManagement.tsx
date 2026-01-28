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
import { useParams, useSearchParams } from 'react-router-dom';
import { BusinessHeader } from './BusinessHeader';
import { BusinessNavigation } from './BusinessNavigation';
import { LoadingSpinner } from '../../Shared/LoadingSpinner';
import { ProductForm } from './ProductForm';
import { ProductCSVUpload } from './ProductCSVUpload';
import { supabase } from '../../../services/supabase';
import type { Product } from '../../../types/business.types';

export function ProductsManagement() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadCSV, setShowUploadCSV] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (businessId) {
      loadProducts(businessId);
    }

    // Check URL params for actions
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowAddForm(true);
    } else if (action === 'upload') {
      setShowUploadCSV(true);
    }
  }, [businessId, searchParams]);

  const loadProducts = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', id)
        .order('name');

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert('Error al eliminar producto: ' + err.message);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (err: any) {
      console.error('Error toggling product:', err);
      alert('Error al actualizar producto: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (showAddForm || editingProduct) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <ProductForm
          businessId={businessId!}
          product={editingProduct}
          onSave={() => {
            setShowAddForm(false);
            setEditingProduct(null);
            setSearchParams({});
            loadProducts(businessId!);
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingProduct(null);
            setSearchParams({});
          }}
        />
      </div>
    );
  }

  if (showUploadCSV) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <ProductCSVUpload
          businessId={businessId!}
          onComplete={() => {
            setShowUploadCSV(false);
            setSearchParams({});
            loadProducts(businessId!);
          }}
          onCancel={() => {
            setShowUploadCSV(false);
            setSearchParams({});
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <BusinessHeader />
      <BusinessNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
              📦 Gestión de Productos
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--jandi-gray)' }}>
              Administrá el catálogo de tu negocio
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadCSV(true)}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#6b7280' }}
            >
              ⬆️ Subir CSV
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--jandi-light-blue)' }}
            >
              ➕ Agregar Producto
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Buscar productos..."
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: '#d1d5db' }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" message="Cargando productos..." />
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-red-600">❌ {error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-2xl mb-4">📦</p>
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              {searchTerm ? 'No se encontraron productos' : 'No hay productos todavía'}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--jandi-gray)' }}>
              {searchTerm 
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza agregando productos a tu catálogo'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: 'var(--jandi-light-blue)' }}
              >
                ➕ Agregar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--jandi-gray)' }}>
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--jandi-gray)' }}>
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--jandi-gray)' }}>
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--jandi-gray)' }}>
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--jandi-gray)' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                              <span className="text-2xl">📦</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                              {product.name}
                            </p>
                            {product.description && (
                              <p className="text-sm truncate max-w-xs" style={{ color: 'var(--jandi-gray)' }}>
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                          {formatCurrency(product.price)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p style={{ color: 'var(--jandi-dark-blue)' }}>
                          {product.stock_quantity}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            product.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {product.is_active ? '✓ Activo' : '✗ Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                            style={{ color: 'var(--jandi-light-blue)' }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
              <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                Mostrando {filteredProducts.length} de {products.length} productos
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
