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

interface ProductCSVUploadProps {
  businessId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface CSVRow {
  product_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  category?: string;
}

export function ProductCSVUpload({ businessId, onComplete, onCancel }: ProductCSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      rows.push({
        product_id: row.product_id || '',
        name: row.name || '',
        description: row.description || '',
        price: parseFloat(row.price) || 0,
        currency: row.currency || 'ARS',
        stock_quantity: parseInt(row.stock_quantity) || 0,
        category: row.category || '',
      });
    }

    return rows;
  };

  const validateCSV = (rows: CSVRow[]): string[] => {
    const errors: string[] = [];

    if (rows.length === 0) {
      errors.push('El archivo CSV está vacío');
      return errors;
    }

    rows.forEach((row, index) => {
      const lineNum = index + 2; // +2 porque línea 1 es header y empezamos en 0

      if (!row.product_id) {
        errors.push(`Línea ${lineNum}: Falta product_id`);
      }
      if (!row.name) {
        errors.push(`Línea ${lineNum}: Falta name`);
      }
      if (row.price <= 0) {
        errors.push(`Línea ${lineNum}: Precio inválido (${row.price})`);
      }
      if (row.stock_quantity < 0) {
        errors.push(`Línea ${lineNum}: Stock inválido (${row.stock_quantity})`);
      }
    });

    return errors;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setValidationErrors([]);

    // Parse and preview
    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      const errors = validateCSV(rows);

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setPreview(rows.slice(0, 5)); // Preview first 5 rows
      }
    } catch (err: any) {
      setError('Error al leer el archivo: ' + err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const errors = validateCSV(rows);

      if (errors.length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }

      // Insert products
      const productsToInsert = rows.map(row => ({
        business_id: businessId,
        product_id: row.product_id,
        name: row.name,
        description: row.description,
        price: row.price,
        currency: row.currency,
        stock_quantity: row.stock_quantity,
        category: row.category,
        stock_status: row.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
        low_stock_threshold: 5,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (insertError) throw insertError;

      onComplete();
    } catch (err: any) {
      console.error('Error uploading CSV:', err);
      setError(err.message || 'Error al subir productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--jandi-dark-blue)' }}>
          ⬆️ Subir Productos desde CSV
        </h2>

        {/* Instructions */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#1e40af' }}>
            📋 Formato del CSV
          </p>
          <p className="text-xs mb-2" style={{ color: '#1e40af' }}>
            El archivo debe tener las siguientes columnas (en este orden):
          </p>
          <code className="text-xs block p-2 rounded" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
            product_id,name,description,price,currency,stock_quantity,category
          </code>
          <p className="text-xs mt-2" style={{ color: '#1e40af' }}>
            Ejemplo: PIZZA-001,Pizza Napolitana,Pizza con tomate y mozzarella,425,ARS,50,pizzas
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#92400e' }}>
              ⚠️ Errores de validación:
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#92400e' }}>
              {validationErrors.slice(0, 10).map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
              {validationErrors.length > 10 && (
                <li>... y {validationErrors.length - 10} errores más</li>
              )}
            </ul>
          </div>
        )}

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
            Seleccionar archivo CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
            style={{ borderColor: '#d1d5db' }}
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
              Vista Previa (primeros 5 productos)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Precio</th>
                    <th className="px-4 py-2 text-left">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{row.product_id}</td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.currency} {row.price}</td>
                      <td className="px-4 py-2">{row.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-lg font-medium border-2 transition-all duration-200 hover:bg-gray-50"
            style={{ borderColor: '#d1d5db', color: 'var(--jandi-gray)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !file || validationErrors.length > 0}
            className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            {loading ? 'Subiendo...' : 'Subir Productos'}
          </button>
        </div>
      </div>
    </div>
  );
}
