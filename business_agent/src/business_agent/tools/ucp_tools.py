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

"""UCP Tools para el agente de negocios JANDI."""

from typing import List, Dict, Any, Optional
from google.adk.tools.tool_context import ToolContext
from ..supabase_client import get_supabase_client

def get_business_catalog(
    tool_context: ToolContext,
    business_id: str,
    category: Optional[str] = None,
    search_query: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Obtiene el catálogo de productos de un negocio.
    
    Args:
        business_id: ID del negocio en JANDI
        category: Filtrar por categoría (opcional)
        search_query: Búsqueda por texto (opcional)
        
    Returns:
        Lista de productos en formato UCP Product schema
    """
    supabase = get_supabase_client()
    products = supabase.get_business_products(business_id, category, search_query)
    
    # Convertir a formato UCP
    ucp_products = []
    for product in products:
        ucp_product = {
            "productID": product['product_id'],
            "name": product['name'],
            "description": product.get('description', ''),
            "image": product.get('images', []),
            "brand": {"name": product.get('brand', '')},
            "offers": {
                "price": str(product['price']),
                "priceCurrency": product['currency'],
                "availability": "InStock" if product['stock_status'] == 'in_stock' else "OutOfStock",
            },
            "url": f"https://jandi.app/products/{product['id']}",
            "size": {"name": ""},
        }
        ucp_products.append(ucp_product)
    
    return ucp_products


def search_products_across_businesses(
    tool_context: ToolContext,
    search_query: str,
    category: Optional[str] = None,
    max_results: int = 20
) -> List[Dict[str, Any]]:
    """
    Busca productos en todos los negocios activos.
    
    Args:
        search_query: Texto a buscar
        category: Filtrar por categoría (opcional)
        max_results: Número máximo de resultados
        
    Returns:
        Lista de productos encontrados
    """
    supabase = get_supabase_client()
    businesses = supabase.get_active_businesses()
    
    all_products = []
    for business in businesses:
        products = supabase.get_business_products(
            business['id'],
            category=category,
            search_query=search_query
        )
        
        # Agregar info del negocio a cada producto
        for product in products:
            product['business'] = {
                'id': business['id'],
                'name': business['business_name'],
                'delivery_fee': business.get('delivery_fee', 0),
            }
            all_products.append(product)
        
        if len(all_products) >= max_results:
            break
    
    return all_products[:max_results]


def create_checkout_session(
    tool_context: ToolContext,
    user_id: str,
    business_id: str,
    line_items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Crea una sesión de checkout siguiendo UCP spec.
    
    Args:
        user_id: ID del usuario
        business_id: ID del negocio
        line_items: Items del carrito en formato UCP
        
    Returns:
        Checkout session con status, payment handlers, totals, etc.
    """
    supabase = get_supabase_client()
    
    # Obtener info del usuario y negocio
    user_profile = supabase.get_user_profile(user_id)
    business = supabase.get_business(business_id)
    
    if not business:
        raise ValueError(f"Business {business_id} not found")
    
    # Calcular totales
    subtotal = sum(item['item']['price'] * item['quantity'] for item in line_items)
    shipping = business.get('delivery_fee', 0) * 100  # Convertir a centavos
    tax = int(subtotal * 0.21)  # IVA 21% (ejemplo)
    total = subtotal + shipping + tax
    
    # Crear checkout object (UCP compliant)
    checkout = {
        "id": f"checkout_{user_id}_{business_id}",
        "status": "incomplete",
        "line_items": line_items,
        "currency": "ARS",
        "totals": {
            "subtotal": subtotal,
            "shipping": shipping,
            "tax": tax,
            "total": total,
        },
        "delivery_address": user_profile.get('primary_address') if user_profile else None,
        "payment": {
            "handlers": business.get('ucp_profile', {}).get('payment', {}).get('handlers', [])
        },
    }
    
    return checkout


def complete_checkout_order(
    tool_context: ToolContext,
    checkout_id: str,
    payment_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Completa un checkout y crea la orden.
    
    Args:
        checkout_id: ID del checkout
        payment_data: Datos de pago (UCP payment instrument)
        
    Returns:
        Orden creada con status
    """
    supabase = get_supabase_client()
    
    # Extraer info del checkout_id
    parts = checkout_id.split('_')
    user_id = parts[1]
    business_id = parts[2]
    
    # Aquí iría la lógica de procesamiento de pago
    # Por ahora, crear la orden directamente
    
    order_data = {
        'user_id': user_id,
        'business_id': business_id,
        'checkout_id': checkout_id,
        'line_items': [],  # Debería venir del checkout
        'subtotal': 0,
        'total': 0,
        'delivery_address': {},
        'payment_status': 'paid',
        'status': 'confirmed',
    }
    
    order = supabase.create_order(order_data)
    
    return {
        "status": "completed",
        "order_id": order['id'] if order else None,
        "order_number": order['order_number'] if order else None,
    }


def get_user_preferences(tool_context: ToolContext, user_id: str) -> Dict[str, Any]:
    """
    Obtiene las preferencias y configuración de autonomía del usuario.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Preferencias del usuario para toma de decisiones
    """
    supabase = get_supabase_client()
    profile = supabase.get_user_profile(user_id)
    
    if not profile:
        return {}
    
    return {
        "shopping_categories": profile.get('shopping_categories', []),
        "priority": profile.get('priority', 'price'),
        "out_of_stock_action": profile.get('out_of_stock_action', 'notify'),
        "favorite_brands": profile.get('favorite_brands', {}),
        "autonomy_level": profile.get('autonomy_level', 'semi'),
        "max_amount_per_purchase": float(profile.get('max_amount_per_purchase', 0)),
        "max_amount_per_month": float(profile.get('max_amount_per_month', 0)),
        "notification_preference": profile.get('notification_preference', 'threshold'),
    }


def get_order_status(tool_context: ToolContext, order_id: str) -> Dict[str, Any]:
    """
    Obtiene el estado actual de una orden.
    
    Args:
        order_id: ID de la orden
        
    Returns:
        Estado de la orden con tracking info
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.client.table('orders').select('*').eq('id', order_id).execute()
        if not response.data:
            return {"error": "Order not found"}
        
        order = response.data[0]
        return {
            "order_number": order['order_number'],
            "status": order['status'],
            "payment_status": order['payment_status'],
            "fulfillment_status": order.get('fulfillment_status'),
            "tracking_number": order.get('tracking_number'),
            "estimated_delivery": order.get('estimated_delivery_at'),
        }
    except Exception as e:
        return {"error": str(e)}
