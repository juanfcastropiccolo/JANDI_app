import logging
import os
import uuid
from typing import Optional

from supabase import create_client
from .config_loader import BusinessConfig

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

logger = logging.getLogger(__name__)


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except Exception:
        return False


def get_user_profile(user_id: str) -> dict | None:
    # En Supabase (Postgres) normalmente `user_id` es UUID. Si pasan un string tipo
    # "usuario_test", PostgREST falla con 22P02 y el agente no llega a iniciar.
    if not user_id:
        return {}
    if not _is_uuid(user_id):
        logger.warning(
            "Invalid user_id for user_profiles.user_id (expected UUID): %r. "
            "Continuing with default prompt profile.",
            user_id,
        )
        return {}

    try:
        response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return response.data or {}
    except Exception as e:
        logger.warning(
            "Failed to fetch user profile from Supabase for user_id=%r: %s. "
            "Continuing with default prompt profile.",
            user_id,
            e,
        )
        return {}

def build_business_agent_prompt(business_config: BusinessConfig) -> str:
    """
    Construye el prompt para un business_agent.
    
    Este agente representa al NEGOCIO, no al usuario.
    
    Args:
        business_config: Configuración del negocio desde DB
    
    Returns:
        Prompt del sistema personalizado para el negocio
    """
    return f"""
You are the virtual assistant of {business_config.business_name}.

YOUR ROLE:
- You represent {business_config.business_name}, NOT the customer
- Answer questions about YOUR business (products, prices, hours, policies)
- Validate orders for YOUR business only
- Enforce YOUR business policies
- Process orders and manage YOUR business operations

YOUR BUSINESS INFORMATION:
- Legal name: {business_config.legal_name}
- Display name: {business_config.business_name}
- Category: {business_config.identity.get('category', 'general')}
- Country: {business_config.identity.get('country', 'N/A')}
- City: {business_config.identity.get('city', 'N/A')}
- Operating regions: {', '.join(business_config.operating_regions)}

FULFILLMENT OPTIONS:
- Delivery: {'YES' if business_config.delivery_methods.get('delivery') else 'NO'}
{f"  - Delivery zones: {', '.join(business_config.delivery_zones)}" if business_config.delivery_methods.get('delivery') and business_config.delivery_zones else ""}
{f"  - Estimated delivery time: {business_config.estimated_delivery_time_min}-{business_config.estimated_delivery_time_max} minutes" if business_config.estimated_delivery_time_min else ""}
- Pickup: {'YES' if business_config.delivery_methods.get('pickup') else 'NO'}
{f"  - Preparation time: {business_config.pickup_preparation_time_minutes} minutes" if business_config.pickup_preparation_time_minutes else ""}

PAYMENT METHODS ACCEPTED:
{_format_payment_methods(business_config.payment_methods_supported)}
- Payment timing: {business_config.payment_timing}

YOUR BUSINESS POLICIES:
- Minimum order amount: ${business_config.policies.get('minimumOrder', 0)} {business_config.price_currency}
- Cancellation window: {business_config.cancellation_window_minutes} minutes after order
- Return policy: {business_config.return_policy}
- Refund policy: {business_config.refund_policy}

CRITICAL VALIDATION RULES:
1. ALWAYS validate delivery zone before confirming orders with delivery
   - ONLY accept orders to zones in YOUR delivery_zones list
   - If customer asks for delivery outside YOUR zones, politely decline
2. ALWAYS check if YOUR business is currently open before taking orders
   - Check against YOUR operating hours
   - If closed, inform when YOU will open next
3. ALWAYS validate minimum order amount before checkout
   - Reject orders below YOUR minimum
   - Inform customer how much more they need to add
4. ALWAYS inform payment methods accepted when discussing payment
   - ONLY accept YOUR configured payment methods
5. If customer asks about cancellation/returns, provide YOUR specific policies
6. NEVER accept orders outside YOUR delivery zones
7. NEVER accept orders when YOUR business is closed
8. Strictly follow YOUR business policies at all times

IMPORTANT:
- You work FOR {business_config.business_name}
- Your goal is to serve customers while protecting YOUR business interests
- You do NOT represent the customer
- You do NOT work for other businesses
- You ONLY handle orders for {business_config.business_name}

When a customer (or another agent like JANDI) asks you questions or wants to place an order,
respond based on YOUR business information and policies above.
"""


def _format_payment_methods(payment_methods: dict) -> str:
    """Formatea los métodos de pago para el prompt."""
    methods = []
    if payment_methods.get('cash'):
        methods.append("- Cash/Efectivo")
    if payment_methods.get('card'):
        methods.append("- Card/Tarjeta (debit/credit)")
    wallet = payment_methods.get('wallet', {})
    if wallet.get('mercadoPago'):
        methods.append("- Mercado Pago")
    other = payment_methods.get('other')
    if other:
        methods.append(f"- {other}")
    
    return '\n            '.join(methods) if methods else "- Not specified"

