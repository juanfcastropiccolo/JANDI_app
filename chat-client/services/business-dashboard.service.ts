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

import { supabase } from './supabase';

export interface DashboardStats {
  productCount: number;
  pendingOrders: number;
  totalRevenue: number;
  ordersCount: number;
}

export class BusinessDashboardService {
  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(businessId: string): Promise<DashboardStats> {
    try {
      // Obtener conteo de productos
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);

      // Obtener órdenes de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders } = await supabase
        .from('orders')
        .select('status, total')
        .eq('business_id', businessId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      return {
        productCount: productCount || 0,
        pendingOrders,
        totalRevenue,
        ordersCount: orders?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        productCount: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        ordersCount: 0,
      };
    }
  }

  /**
   * Obtener órdenes recientes
   */
  async getRecentOrders(businessId: string, limit = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:user_id(email, full_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Actualizar estado de orden
   */
  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Crear evento de cambio de estado
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'status_changed',
      event_data: { new_status: status },
    });

    return data;
  }

  /**
   * Obtener negocio por ID
   */
  async getBusinessById(businessId: string) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) throw error;
    return data;
  }
}

export const businessDashboardService = new BusinessDashboardService();
