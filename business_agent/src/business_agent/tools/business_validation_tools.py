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

"""Business validation tools - Dynamic validation based on business configuration."""

import logging
from typing import Dict, Any, Optional
from ..config_loader import BusinessConfig

logger = logging.getLogger(__name__)


def validate_delivery_zone(config: BusinessConfig, zone: str) -> Dict[str, Any]:
    """
    Valida si el negocio hace delivery a una zona específica.
    
    Args:
        config: Configuración del negocio
        zone: Zona de delivery solicitada
    
    Returns:
        Dict con el resultado de la validación
    """
    try:
        # Verificar si el negocio ofrece delivery
        if not config.delivery_methods.get('delivery', False):
            return {
                'valid': False,
                'reason': f"{config.business_name} no ofrece servicio de delivery. Solo retiro en local.",
                'alternatives': ['pickup'] if config.accepts_pickup() else []
            }
        
        # Verificar si la zona está en el área de cobertura
        if config.accepts_delivery_to_zone(zone):
            estimated_time = config.get_estimated_delivery_time()
            return {
                'valid': True,
                'zone': zone,
                'estimated_time': estimated_time,
                'message': f"¡Sí! Hacemos delivery a {zone}. Tiempo estimado: {estimated_time.get('min')}-{estimated_time.get('max')} {estimated_time.get('unit', 'minutos')}."
            }
        else:
            # Zona no cubierta
            covered_zones = config.delivery_zones
            return {
                'valid': False,
                'reason': f"Lo siento, {zone} no está en nuestra área de cobertura para delivery.",
                'covered_zones': covered_zones,
                'alternatives': ['pickup'] if config.accepts_pickup() else [],
                'message': f"Hacemos delivery a: {', '.join(covered_zones)}. ¿Alguna de estas zonas te queda cerca?"
            }
            
    except Exception as e:
        logger.error(f"Error validating delivery zone: {e}")
        return {
            'valid': False,
            'reason': 'Error al validar la zona de delivery',
            'error': str(e)
        }


def check_opening_hours(config: BusinessConfig) -> Dict[str, Any]:
    """
    Verifica si el negocio está abierto actualmente.
    
    Args:
        config: Configuración del negocio
    
    Returns:
        Dict con el estado de apertura
    """
    try:
        is_open = config.is_open_now()
        schedule = config.operations.get('schedule', {})
        
        from datetime import datetime
        now = datetime.now()
        day_name = now.strftime('%A').lower()
        day_schedule = schedule.get(day_name, {})
        
        if is_open:
            close_time = day_schedule.get('close', '23:59')
            return {
                'is_open': True,
                'message': f"¡Sí! {config.business_name} está abierto ahora. Cerramos a las {close_time}.",
                'close_time': close_time
            }
        else:
            # Encontrar próximo horario de apertura
            next_open = _find_next_opening(schedule, now)
            return {
                'is_open': False,
                'message': f"Lo siento, {config.business_name} está cerrado ahora.",
                'next_opening': next_open,
                'full_schedule': schedule
            }
            
    except Exception as e:
        logger.error(f"Error checking opening hours: {e}")
        return {
            'is_open': True,  # Default to open on error
            'message': f"Puedes hacer tu pedido ahora en {config.business_name}.",
            'error': str(e)
        }


def validate_minimum_order(config: BusinessConfig, order_amount: float) -> Dict[str, Any]:
    """
    Valida si el monto del pedido cumple con el mínimo requerido.
    
    Args:
        config: Configuración del negocio
        order_amount: Monto total del pedido
    
    Returns:
        Dict con el resultado de la validación
    """
    try:
        minimum = config.get_minimum_order_amount()
        
        if minimum == 0:
            return {
                'valid': True,
                'message': f"{config.business_name} no tiene monto mínimo de pedido."
            }
        
        if order_amount >= minimum:
            return {
                'valid': True,
                'order_amount': order_amount,
                'minimum_amount': minimum,
                'message': f"Perfecto, tu pedido cumple con el monto mínimo de ${minimum}."
            }
        else:
            missing = minimum - order_amount
            return {
                'valid': False,
                'order_amount': order_amount,
                'minimum_amount': minimum,
                'missing_amount': missing,
                'message': f"El monto mínimo de pedido es ${minimum}. Te faltan ${missing:.2f} para alcanzarlo. ¿Querés agregar algo más?"
            }
            
    except Exception as e:
        logger.error(f"Error validating minimum order: {e}")
        return {
            'valid': True,  # Default to valid on error
            'error': str(e)
        }


def check_payment_method(config: BusinessConfig, payment_method: str) -> Dict[str, Any]:
    """
    Verifica si el negocio acepta un método de pago específico.
    
    Args:
        config: Configuración del negocio
        payment_method: Método de pago solicitado
    
    Returns:
        Dict con el resultado de la verificación
    """
    try:
        accepts = config.accepts_payment_method(payment_method)
        
        if accepts:
            return {
                'accepted': True,
                'payment_method': payment_method,
                'message': f"Sí, {config.business_name} acepta {payment_method}."
            }
        else:
            # Listar métodos aceptados
            accepted_methods = []
            if config.payment_methods_supported.get('cash'):
                accepted_methods.append('efectivo')
            if config.payment_methods_supported.get('card'):
                accepted_methods.append('tarjeta')
            wallet = config.payment_methods_supported.get('wallet', {})
            if wallet.get('mercadoPago'):
                accepted_methods.append('Mercado Pago')
            other = config.payment_methods_supported.get('other')
            if other:
                accepted_methods.append(other)
            
            return {
                'accepted': False,
                'payment_method': payment_method,
                'accepted_methods': accepted_methods,
                'message': f"Lo siento, {config.business_name} no acepta {payment_method}. Aceptamos: {', '.join(accepted_methods)}."
            }
            
    except Exception as e:
        logger.error(f"Error checking payment method: {e}")
        return {
            'accepted': True,  # Default to accepted on error
            'error': str(e)
        }


def get_cancellation_policy(config: BusinessConfig) -> Dict[str, Any]:
    """
    Obtiene la política de cancelación del negocio.
    
    Args:
        config: Configuración del negocio
    
    Returns:
        Dict con la política de cancelación
    """
    try:
        window_minutes = config.get_cancellation_window_minutes()
        
        if window_minutes == 0:
            return {
                'allows_cancellation': False,
                'message': f"{config.business_name} no permite cancelaciones una vez confirmado el pedido.",
                'policy': config.policies.get('cancellationPolicy', '')
            }
        else:
            return {
                'allows_cancellation': True,
                'window_minutes': window_minutes,
                'message': f"Podés cancelar tu pedido hasta {window_minutes} minutos después de confirmarlo.",
                'policy': config.policies.get('cancellationPolicy', '')
            }
            
    except Exception as e:
        logger.error(f"Error getting cancellation policy: {e}")
        return {
            'allows_cancellation': True,
            'window_minutes': 15,
            'error': str(e)
        }


def get_return_policy(config: BusinessConfig) -> Dict[str, Any]:
    """
    Obtiene la política de devoluciones del negocio.
    
    Args:
        config: Configuración del negocio
    
    Returns:
        Dict con la política de devoluciones
    """
    try:
        return {
            'return_policy': config.return_policy,
            'refund_policy': config.refund_policy,
            'message': f"Política de devoluciones de {config.business_name}: {config.return_policy}"
        }
    except Exception as e:
        logger.error(f"Error getting return policy: {e}")
        return {
            'return_policy': 'Consultar con el negocio',
            'error': str(e)
        }


def get_fulfillment_options(config: BusinessConfig, user_zone: Optional[str] = None) -> Dict[str, Any]:
    """
    Obtiene las opciones de fulfillment disponibles para el usuario.
    
    Args:
        config: Configuración del negocio
        user_zone: Zona del usuario (opcional)
    
    Returns:
        Dict con las opciones de fulfillment
    """
    try:
        options = []
        
        # Delivery
        if config.delivery_methods.get('delivery', False):
            delivery_option = {
                'type': 'delivery',
                'available': True,
                'estimated_time': config.get_estimated_delivery_time(),
                'zones': config.delivery_zones
            }
            
            # Si el usuario proporcionó una zona, validar
            if user_zone:
                delivery_option['available_for_user'] = config.accepts_delivery_to_zone(user_zone)
            
            options.append(delivery_option)
        
        # Pickup
        if config.delivery_methods.get('pickup', False):
            pickup_option = {
                'type': 'pickup',
                'available': True,
                'preparation_time_minutes': config.get_pickup_preparation_time()
            }
            options.append(pickup_option)
        
        return {
            'business_name': config.business_name,
            'options': options,
            'message': _format_fulfillment_message(config, options, user_zone)
        }
        
    except Exception as e:
        logger.error(f"Error getting fulfillment options: {e}")
        return {
            'options': [],
            'error': str(e)
        }


def _find_next_opening(schedule: Dict[str, Any], current_datetime) -> Optional[str]:
    """Encuentra el próximo horario de apertura."""
    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    current_day_index = current_datetime.weekday()
    
    # Buscar en los próximos 7 días
    for i in range(1, 8):
        next_day_index = (current_day_index + i) % 7
        next_day_name = days_order[next_day_index]
        day_schedule = schedule.get(next_day_name, {})
        
        if not day_schedule.get('closed', False):
            open_time = day_schedule.get('open', '09:00')
            day_label = _get_day_label(i)
            return f"{day_label} a las {open_time}"
    
    return None


def _get_day_label(days_ahead: int) -> str:
    """Convierte días adelante en etiqueta legible."""
    if days_ahead == 1:
        return "mañana"
    elif days_ahead == 2:
        return "pasado mañana"
    else:
        days_map = {
            0: "lunes", 1: "martes", 2: "miércoles", 3: "jueves",
            4: "viernes", 5: "sábado", 6: "domingo"
        }
        from datetime import datetime, timedelta
        future_date = datetime.now() + timedelta(days=days_ahead)
        return days_map.get(future_date.weekday(), "próximamente")


def _format_fulfillment_message(config: BusinessConfig, options: list, user_zone: Optional[str]) -> str:
    """Formatea el mensaje de opciones de fulfillment."""
    messages = []
    
    for option in options:
        if option['type'] == 'delivery':
            if user_zone:
                if option.get('available_for_user', False):
                    est_time = option['estimated_time']
                    messages.append(f"✅ Delivery a {user_zone}: {est_time['min']}-{est_time['max']} {est_time.get('unit', 'minutos')}")
                else:
                    messages.append(f"❌ Delivery a {user_zone} no disponible")
            else:
                est_time = option['estimated_time']
                messages.append(f"🚚 Delivery disponible: {est_time['min']}-{est_time['max']} {est_time.get('unit', 'minutos')}")
        
        elif option['type'] == 'pickup':
            prep_time = option['preparation_time_minutes']
            messages.append(f"🏪 Retiro en local: listo en {prep_time} minutos")
    
    return f"{config.business_name} ofrece: " + " | ".join(messages)
