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
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface OrderDetailProps {
  order: any;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderDetail({ order, onClose, onStatusChange }: OrderDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      pending: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
      processing: { bg: '#dbeafe', text: '#1e40af', label: 'En Proceso' },
      completed: { bg: '#d1fae5', text: '#065f46', label: 'Completado' },
      cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelado' },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ backgroundColor: badge.bg, color: badge.text }}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 mb-6 text-sm font-medium hover:underline"
        style={{ color: 'var(--jandi-light-blue)' }}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a órdenes
      </button>

      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              Orden #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              {new Date(order.created_at).toLocaleString('es-AR', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(order.status)}
            <p className="text-2xl font-bold mt-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
            👤 Información del Cliente
          </h3>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
            <p className="text-sm mb-1">
              <span className="font-medium">Nombre:</span> {order.user?.full_name || 'No especificado'}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Email:</span> {order.user?.email || 'No especificado'}
            </p>
            {order.delivery_address && (
              <p className="text-sm">
                <span className="font-medium">Dirección:</span> {order.delivery_address}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
            📦 Productos
          </h3>
          <div className="space-y-2">
            {order.order_items?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: 'var(--jandi-background)' }}
              >
                <div className="flex-1">
                  <p className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                    {item.product_name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                    Cantidad: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
                  {formatCurrency(item.quantity * item.price)}
                </p>
              </div>
            )) || (
              <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                No hay items en esta orden
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
          <div className="flex justify-between mb-2">
            <span className="text-sm">Subtotal:</span>
            <span className="font-medium">{formatCurrency(order.subtotal || order.total)}</span>
          </div>
          {order.delivery_fee && (
            <div className="flex justify-between mb-2">
              <span className="text-sm">Envío:</span>
              <span className="font-medium">{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-xl" style={{ color: 'var(--jandi-dark-blue)' }}>
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(order.id, 'processing')}
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#3b82f6' }}
              >
                ✓ Aceptar Orden
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de rechazar esta orden?')) {
                    onStatusChange(order.id, 'cancelled');
                  }
                }}
                className="flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: '#ef4444' }}
              >
                ✗ Rechazar Orden
              </button>
            </>
          )}
          {order.status === 'processing' && (
            <button
              onClick={() => onStatusChange(order.id, 'completed')}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: '#10b981' }}
            >
              ✓ Marcar como Completada
            </button>
          )}
          {(order.status === 'completed' || order.status === 'cancelled') && (
            <div className="w-full p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
              <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                Esta orden ya fue {order.status === 'completed' ? 'completada' : 'cancelada'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
