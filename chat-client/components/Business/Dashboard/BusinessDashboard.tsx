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
import { useParams, Link } from 'react-router-dom';
import { BusinessHeader } from './BusinessHeader';
import { BusinessNavigation } from './BusinessNavigation';
import { LoadingSpinner } from '../../Shared/LoadingSpinner';
import { businessDashboardService, type DashboardStats } from '../../../services/business-dashboard.service';

export function BusinessDashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId) {
      loadDashboardData(businessId);
    }
  }, [businessId]);

  const loadDashboardData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, ordersData] = await Promise.all([
        businessDashboardService.getDashboardStats(id),
        businessDashboardService.getRecentOrders(id, 5),
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

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
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: badge.bg, color: badge.text }}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" message="Cargando dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <BusinessHeader />
        <BusinessNavigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="p-6 rounded-lg" style={{ backgroundColor: '#fee', border: '1px solid #f87171' }}>
            <p className="text-red-600">❌ {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <BusinessHeader />
      <BusinessNavigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Bienvenido a tu Dashboard! 👋
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--jandi-gray)' }}>
            Aquí puedes gestionar tu negocio, productos y órdenes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Productos */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📦</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                Total
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Productos
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
              {stats?.productCount || 0}
            </p>
          </div>

          {/* Órdenes Pendientes */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📋</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                Pendientes
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Órdenes
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
              {stats?.pendingOrders || 0}
            </p>
          </div>

          {/* Total Órdenes */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📈</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                30 días
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Total Órdenes
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
              {stats?.ordersCount || 0}
            </p>
          </div>

          {/* Ventas */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                30 días
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
              Ventas
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--jandi-dark-blue)' }}>
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
        </div>

        {/* Órdenes Recientes */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
              📋 Órdenes Recientes
            </h2>
            <Link
              to={`/business/orders/${businessId}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--jandi-light-blue)' }}
            >
              Ver todas →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg mb-2" style={{ color: 'var(--jandi-gray)' }}>
                📭 No hay órdenes todavía
              </p>
              <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                Las órdenes de tus clientes aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg border hover:border-[var(--jandi-light-blue)] transition-colors"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                          #{order.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
                        Cliente: {order.user?.full_name || order.user?.email || 'Anónimo'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
                        {new Date(order.created_at).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: 'var(--jandi-dark-blue)' }}>
                        {formatCurrency(order.total)}
                      </p>
                      <Link
                        to={`/business/orders/${businessId}?orderId=${order.id}`}
                        className="text-sm hover:underline"
                        style={{ color: 'var(--jandi-light-blue)' }}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--jandi-dark-blue)' }}>
            🔗 Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to={`/business/products/${businessId}?action=add`}
              className="p-4 rounded-lg border-2 border-dashed hover:border-[var(--jandi-light-blue)] transition-colors text-center"
              style={{ borderColor: '#d1d5db' }}
            >
              <span className="text-3xl block mb-2">➕</span>
              <span className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Agregar Producto
              </span>
            </Link>

            <Link
              to={`/business/products/${businessId}?action=upload`}
              className="p-4 rounded-lg border-2 border-dashed hover:border-[var(--jandi-light-blue)] transition-colors text-center"
              style={{ borderColor: '#d1d5db' }}
            >
              <span className="text-3xl block mb-2">⬆️</span>
              <span className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Subir CSV
              </span>
            </Link>

            <Link
              to={`/business/config/${businessId}`}
              className="p-4 rounded-lg border-2 border-dashed hover:border-[var(--jandi-light-blue)] transition-colors text-center"
              style={{ borderColor: '#d1d5db' }}
            >
              <span className="text-3xl block mb-2">⚙️</span>
              <span className="font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                Configurar Agente
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
