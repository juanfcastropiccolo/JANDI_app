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

"""Config loader for business agent - loads configuration from Supabase."""

import logging
from typing import Any, Dict, Optional
from datetime import datetime, time
from .supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class BusinessConfig:
    """Configuración completa de un negocio cargada desde Supabase."""
    
    def __init__(self, business_id: str, data: Dict[str, Any]):
        self.business_id = business_id
        self._raw_data = data
        
        # Cargar business_config (configuración interna)
        self.business_config = data.get('business_config', {})
        
        # Cargar agent_card (A2A)
        self.agent_card = data.get('agent_card', {})
        
        # Cargar ucp_profile
        self.ucp_profile = data.get('ucp_profile', {})
        
        # Campos directos de la tabla
        self.business_name = data.get('business_name', '')
        self.legal_name = data.get('legal_name', '')
        self.operating_regions = data.get('operating_regions', [])
        self.delivery_methods = data.get('delivery_methods', {})
        self.delivery_zones = data.get('delivery_zones', [])
        self.estimated_delivery_time_min = data.get('estimated_delivery_time_min')
        self.estimated_delivery_time_max = data.get('estimated_delivery_time_max')
        self.pickup_preparation_time_minutes = data.get('pickup_preparation_time_minutes')
        self.payment_methods_supported = data.get('payment_methods_supported', {})
        self.payment_timing = data.get('payment_timing', 'both')
        self.return_policy = data.get('return_policy', '')
        self.refund_policy = data.get('refund_policy', '')
        self.cancellation_window_minutes = data.get('cancellation_window_minutes', 15)
        self.catalog_source_type = data.get('catalog_source_type', 'manual')
        self.price_currency = data.get('price_currency', 'ARS')
    
    @property
    def identity(self) -> Dict[str, Any]:
        """Retorna la identidad del negocio."""
        return self.business_config.get('identity', {})
    
    @property
    def operations(self) -> Dict[str, Any]:
        """Retorna la configuración operativa."""
        return self.business_config.get('operations', {})
    
    @property
    def fulfillment(self) -> Dict[str, Any]:
        """Retorna la configuración de fulfillment."""
        return self.business_config.get('fulfillment', {})
    
    @property
    def payment(self) -> Dict[str, Any]:
        """Retorna la configuración de pagos."""
        return self.business_config.get('payment', {})
    
    @property
    def policies(self) -> Dict[str, Any]:
        """Retorna las políticas comerciales."""
        return self.business_config.get('policies', {})
    
    @property
    def catalog(self) -> Dict[str, Any]:
        """Retorna la configuración del catálogo."""
        return self.business_config.get('catalog', {})
    
    @property
    def ops_contact(self) -> Dict[str, Any]:
        """Retorna el contacto de operaciones."""
        return self.business_config.get('opsContact', {})
    
    @property
    def skills(self) -> list:
        """Retorna los skills del Agent Card."""
        return self.agent_card.get('skills', [])
    
    @property
    def capabilities(self) -> list:
        """Retorna las capabilities UCP."""
        ucp = self.ucp_profile.get('ucp', {})
        return ucp.get('capabilities', [])
    
    def is_open_now(self) -> bool:
        """Verifica si el negocio está abierto ahora."""
        schedule = self.operations.get('schedule', {})
        now = datetime.now()
        day_name = now.strftime('%A').lower()  # monday, tuesday, etc.
        
        day_schedule = schedule.get(day_name)
        if not day_schedule or day_schedule.get('closed', False):
            return False
        
        try:
            open_time = time.fromisoformat(day_schedule.get('open', '00:00'))
            close_time = time.fromisoformat(day_schedule.get('close', '23:59'))
            current_time = now.time()
            
            return open_time <= current_time <= close_time
        except Exception as e:
            logger.warning(f"Error checking if business is open: {e}")
            return True  # Default to open if we can't determine
    
    def accepts_delivery_to_zone(self, zone: str) -> bool:
        """Verifica si el negocio hace delivery a una zona específica."""
        if not self.delivery_methods.get('delivery', False):
            return False
        
        # Normalizar zona para comparación
        zone_normalized = zone.lower().strip()
        
        # Verificar en delivery_zones
        for delivery_zone in self.delivery_zones:
            if zone_normalized in delivery_zone.lower():
                return True
        
        # Verificar en operating_regions
        for region in self.operating_regions:
            if zone_normalized in region.lower():
                return True
        
        return False
    
    def accepts_pickup(self) -> bool:
        """Verifica si el negocio acepta retiro en local."""
        return self.delivery_methods.get('pickup', False)
    
    def accepts_payment_method(self, method: str) -> bool:
        """Verifica si el negocio acepta un método de pago."""
        method_normalized = method.lower().strip()
        
        if method_normalized in ['cash', 'efectivo']:
            return self.payment_methods_supported.get('cash', False)
        
        if method_normalized in ['card', 'tarjeta', 'credito', 'debito']:
            return self.payment_methods_supported.get('card', False)
        
        if method_normalized in ['mercadopago', 'mp', 'wallet']:
            wallet = self.payment_methods_supported.get('wallet', {})
            return wallet.get('mercadoPago', False)
        
        # Verificar en 'other'
        other = self.payment_methods_supported.get('other', '')
        if other and method_normalized in other.lower():
            return True
        
        return False
    
    def get_minimum_order_amount(self) -> float:
        """Retorna el monto mínimo de pedido."""
        return self.policies.get('minimumOrder', 0)
    
    def get_cancellation_window_minutes(self) -> int:
        """Retorna la ventana de cancelación en minutos."""
        return self.policies.get('cancellationWindow', 15)
    
    def get_estimated_delivery_time(self) -> Optional[Dict[str, Any]]:
        """Retorna el tiempo estimado de delivery."""
        if not self.delivery_methods.get('delivery', False):
            return None
        
        delivery_config = self.fulfillment.get('delivery', {})
        return delivery_config.get('estimatedTime')
    
    def get_pickup_preparation_time(self) -> Optional[int]:
        """Retorna el tiempo de preparación para pickup en minutos."""
        if not self.delivery_methods.get('pickup', False):
            return None
        
        pickup_config = self.fulfillment.get('pickup', {})
        prep_time = pickup_config.get('preparationTime', {})
        return prep_time.get('value')
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte la configuración a diccionario."""
        return {
            'business_id': self.business_id,
            'business_name': self.business_name,
            'legal_name': self.legal_name,
            'identity': self.identity,
            'operations': self.operations,
            'fulfillment': self.fulfillment,
            'payment': self.payment,
            'policies': self.policies,
            'catalog': self.catalog,
            'ops_contact': self.ops_contact,
            'agent_card': self.agent_card,
            'ucp_profile': self.ucp_profile,
        }


class BusinessConfigLoader:
    """Cargador de configuraciones de negocios desde Supabase."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self._cache: Dict[str, BusinessConfig] = {}
    
    def load_business_config(self, business_id: str, use_cache: bool = True) -> Optional[BusinessConfig]:
        """
        Carga la configuración completa de un negocio desde Supabase.
        
        Args:
            business_id: ID del negocio
            use_cache: Si True, usa la configuración en caché si está disponible
        
        Returns:
            BusinessConfig o None si no se encuentra
        """
        # Verificar caché
        if use_cache and business_id in self._cache:
            logger.info(f"Loading business config from cache: {business_id}")
            return self._cache[business_id]
        
        # Cargar desde Supabase
        try:
            logger.info(f"Loading business config from Supabase: {business_id}")
            
            business_data = self.supabase.get_business(business_id)
            
            if not business_data:
                logger.warning(f"Business not found: {business_id}")
                return None
            
            # Verificar que el negocio esté activo
            if not business_data.get('is_active', False):
                logger.warning(f"Business is not active: {business_id}")
                return None
            
            # Crear BusinessConfig
            config = BusinessConfig(business_id, business_data)
            
            # Guardar en caché
            self._cache[business_id] = config
            
            logger.info(f"Business config loaded successfully: {config.business_name}")
            return config
            
        except Exception as e:
            logger.error(f"Error loading business config for {business_id}: {e}")
            return None
    
    def reload_business_config(self, business_id: str) -> Optional[BusinessConfig]:
        """
        Recarga la configuración de un negocio desde Supabase (ignora caché).
        
        Args:
            business_id: ID del negocio
        
        Returns:
            BusinessConfig o None si no se encuentra
        """
        # Limpiar caché
        if business_id in self._cache:
            del self._cache[business_id]
        
        return self.load_business_config(business_id, use_cache=False)
    
    def clear_cache(self):
        """Limpia toda la caché de configuraciones."""
        self._cache.clear()
        logger.info("Business config cache cleared")


# Singleton instance
_config_loader: Optional[BusinessConfigLoader] = None


def get_config_loader() -> BusinessConfigLoader:
    """Obtiene la instancia singleton del config loader."""
    global _config_loader
    if _config_loader is None:
        _config_loader = BusinessConfigLoader()
    return _config_loader


def load_business_config(business_id: str) -> Optional[BusinessConfig]:
    """
    Función helper para cargar la configuración de un negocio.
    
    Args:
        business_id: ID del negocio
    
    Returns:
        BusinessConfig o None si no se encuentra
    """
    loader = get_config_loader()
    return loader.load_business_config(business_id)
