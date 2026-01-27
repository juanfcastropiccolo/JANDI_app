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

"""Business discovery tools for JANDI agent."""

import logging
import os
from typing import List, Dict, Any, Optional
from supabase import create_client

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def search_businesses(
    category: Optional[str] = None,
    location: Optional[str] = None,
    keyword: Optional[str] = None
) -> Dict[str, Any]:
    """
    Busca negocios en el ecosistema JANDI.
    
    Esta herramienta permite a JANDI descubrir business_agents disponibles.
    
    Args:
        category: Categoría del negocio (restaurant, pharmacy, supermarket, etc.)
        location: Ubicación/zona (Centro, Nueva Córdoba, etc.)
        keyword: Palabra clave en el nombre del negocio
    
    Returns:
        Dict con lista de negocios encontrados y sus Agent Cards
    """
    try:
        logger.info(f"Searching businesses: category={category}, location={location}, keyword={keyword}")
        
        # Query Supabase
        query = supabase.table('businesses').select('*').eq('is_active', True)
        
        if category:
            query = query.eq('business_type', category)
        
        if location:
            query = query.contains('operating_regions', [location])
        
        if keyword:
            query = query.ilike('business_name', f'%{keyword}%')
        
        result = query.execute()
        
        # Formatear resultados con Agent Cards
        businesses = []
        for biz in result.data:
            business_info = {
                'business_id': biz['id'],
                'business_name': biz['business_name'],
                'category': biz.get('business_type', 'general'),
                'operating_regions': biz.get('operating_regions', []),
                'delivery_methods': biz.get('delivery_methods', {}),
                'agent_card': biz.get('agent_card', {}),
                'agent_url': f"http://localhost:10000/businesses/{biz['id']}/agent",
                'agent_card_url': f"http://localhost:10000/businesses/{biz['id']}/.well-known/agent.json"
            }
            businesses.append(business_info)
        
        logger.info(f"Found {len(businesses)} businesses")
        
        return {
            'success': True,
            'count': len(businesses),
            'businesses': businesses,
            'message': f"Encontré {len(businesses)} negocios que coinciden con tu búsqueda."
        }
        
    except Exception as e:
        logger.error(f"Error searching businesses: {e}")
        return {
            'success': False,
            'count': 0,
            'businesses': [],
            'error': str(e),
            'message': 'Hubo un error al buscar negocios. Por favor intenta nuevamente.'
        }


def get_business_details(business_id: str) -> Dict[str, Any]:
    """
    Obtiene detalles completos de un negocio específico.
    
    Args:
        business_id: ID del negocio
    
    Returns:
        Dict con información completa del negocio
    """
    try:
        logger.info(f"Getting business details for: {business_id}")
        
        result = supabase.table('businesses').select('*').eq('id', business_id).single().execute()
        
        if not result.data:
            return {
                'success': False,
                'error': 'Business not found',
                'message': f'No encontré el negocio con ID: {business_id}'
            }
        
        biz = result.data
        
        return {
            'success': True,
            'business': {
                'business_id': biz['id'],
                'business_name': biz['business_name'],
                'legal_name': biz.get('legal_name', ''),
                'category': biz.get('business_type', 'general'),
                'operating_regions': biz.get('operating_regions', []),
                'delivery_methods': biz.get('delivery_methods', {}),
                'delivery_zones': biz.get('delivery_zones', []),
                'payment_methods': biz.get('payment_methods_supported', {}),
                'payment_timing': biz.get('payment_timing', 'both'),
                'minimum_order': biz.get('min_order_amount', 0),
                'currency': biz.get('price_currency', 'ARS'),
                'agent_card': biz.get('agent_card', {}),
                'agent_url': f"http://localhost:10000/businesses/{biz['id']}/agent"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting business details: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': f'Error al obtener detalles del negocio: {business_id}'
        }
