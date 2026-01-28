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
import { OrderDetail } from './OrderDetail';
import { businessDashboardService } from '../../../services/business-dashboard.service';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export function OrdersManagement() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (businessId) {
      loadOrders(businessId);
    }

    // Check if there's an orderId in URL
    const orderId = searchParams.get('orderId');
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) setSelectedOrder(order);
    }
  }, [businessId, searchParams]);

  const loadOrders = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await businessDashboardService.getRecentOrders(id, 100);
      setOrders(data);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await businessDashboardService.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Error al actualizar estado: ' + err.message);
    }
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
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.text }}
      >
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(o => o.status === status).length;
  };

  if (selectedOrder) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            📋 Gestión de Órdenes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--jandi-gray)' }}>
            Administrá las órdenes de tus clientes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterStatus === 'all'
                ? 'text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={filterStatus === 'all' ? { backgroundColor: 'var(--jandi-light-blue)' } : {}}
          >
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pendientes ({getStatusCount('pending')})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterStatus === 'processing'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            En Proceso ({getStatusCount('processing')})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Completadas ({getStatusCount('completed')})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filterStatus === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Canceladas ({getStatusCount('cancelled')})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" message="Cargando órdenes..." />
          </div>
        ) : error ? (
          <div className="p-6 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-red-600">❌ {error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-2xl mb-4">📭</p>
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
              No hay órdenes {filterStatus !== 'all' ? `en estado "${filterStatus}"` : ''}
            </p>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Las órdenes de tus clientes aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm mb-1" style={{ color: 'var(--jandi-gray)' }}>
                      👤 Cliente: {order.user?.full_name || order.user?.email || 'Anónimo'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                      🕐 {new Date(order.created_at).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
                      {formatCurrency(order.total)}
                    </p>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(order.id, 'processing');
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-white hover:opacity-80"
                            style={{ backgroundColor: '#3b82f6' }}
                          >
                            ✓ Aceptar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('¿Rechazar esta orden?')) {
                                handleStatusChange(order.id, 'cancelled');
                              }
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-white hover:opacity-80"
                            style={{ backgroundColor: '#ef4444' }}
                          >
                            ✗ Rechazar
                          </button>
                        </>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, 'completed');
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-white hover:opacity-80"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          ✓ Completar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
