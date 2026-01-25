# Copyright 2026 UCP Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Supabase client for JANDI business agent."""

import os
from typing import Any, Dict, List, Optional
from supabase import create_client, Client

class SupabaseClient:
    """Cliente de Supabase para el agente de negocios."""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
        self.client: Client = create_client(supabase_url, supabase_key)
    
    # ============================================
    # USER OPERATIONS
    # ============================================
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene el perfil completo de un usuario."""
        try:
            response = self.client.table('user_profiles').select('*').eq('user_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene información básica del usuario."""
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    # ============================================
    # BUSINESS OPERATIONS
    # ============================================
    
    def get_active_businesses(self) -> List[Dict[str, Any]]:
        """Obtiene todos los negocios activos."""
        try:
            response = self.client.table('businesses').select('*').eq('is_active', True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting businesses: {e}")
            return []
    
    def get_business(self, business_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene un negocio específico."""
        try:
            response = self.client.table('businesses').select('*').eq('id', business_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting business: {e}")
            return None
    
    # ============================================
    # PRODUCT OPERATIONS
    # ============================================
    
    def get_business_products(
        self,
        business_id: str,
        category: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Obtiene productos de un negocio."""
        try:
            query = self.client.table('products').select('*').eq('business_id', business_id).eq('is_active', True)
            
            if category:
                query = query.eq('category', category)
            
            if search_query:
                query = query.ilike('name', f'%{search_query}%')
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting products: {e}")
            return []
    
    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene un producto específico."""
        try:
            response = self.client.table('products').select('*').eq('id', product_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting product: {e}")
            return None
    
    def update_product_stock(self, product_id: str, quantity: int) -> bool:
        """Actualiza el stock de un producto."""
        try:
            self.client.table('products').update({
                'stock_quantity': quantity
            }).eq('id', product_id).execute()
            return True
        except Exception as e:
            print(f"Error updating stock: {e}")
            return False
    
    # ============================================
    # ORDER OPERATIONS
    # ============================================
    
    def create_order(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Crea una nueva orden."""
        try:
            # Generar order_number único
            from datetime import datetime
            import random
            order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            
            order_data['order_number'] = order_number
            
            response = self.client.table('orders').insert(order_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating order: {e}")
            return None
    
    def update_order_status(self, order_id: str, status: str) -> bool:
        """Actualiza el estado de una orden."""
        try:
            self.client.table('orders').update({
                'status': status
            }).eq('id', order_id).execute()
            return True
        except Exception as e:
            print(f"Error updating order status: {e}")
            return False
    
    def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtiene las órdenes de un usuario."""
        try:
            response = self.client.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            return response.data or []
        except Exception as e:
            print(f"Error getting user orders: {e}")
            return []
    
    # ============================================
    # CONVERSATION OPERATIONS
    # ============================================
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene una conversación."""
        try:
            response = self.client.table('conversations').select('*').eq('id', conversation_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error getting conversation: {e}")
            return None
    
    def update_conversation_context(self, conversation_id: str, context_id: str, task_id: Optional[str] = None) -> bool:
        """Actualiza el contexto A2A de una conversación."""
        try:
            update_data = {'context_id': context_id}
            if task_id:
                update_data['task_id'] = task_id
            
            self.client.table('conversations').update(update_data).eq('id', conversation_id).execute()
            return True
        except Exception as e:
            print(f"Error updating conversation context: {e}")
            return False

# Singleton instance
_supabase_client: Optional[SupabaseClient] = None

def get_supabase_client() -> SupabaseClient:
    """Obtiene la instancia singleton del cliente de Supabase."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client
