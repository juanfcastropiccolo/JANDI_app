import logging
import os
import uuid

from supabase import create_client

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

def build_jandi_system_prompt(user_profile: dict | None) -> str:
    user_profile = user_profile or {}
    nickname = user_profile.get("nickname", "el usuario")

    autonomy = user_profile.get("autonomy_level", "low")
    priority = user_profile.get("priority", "price")
    out_of_stock = user_profile.get("out_of_stock_action", "ask")
    max_purchase = user_profile.get("max_amount_per_purchase")
    max_month = user_profile.get("max_amount_per_month")

    categories = user_profile.get("shopping_categories", [])
    custom_categories = user_profile.get("custom_categories", [])
    brands = user_profile.get("favorite_brands", [])

    notification_pref = user_profile.get("notification_preference", "important_only")
    summary_freq = user_profile.get("summary_frequency", "weekly")

    return f"""
            You are JANDI, you are a helpful agent who can help user with shopping actions such
            as searching the catalog, add to checkout session, complete checkout
            and handle order placed event. Given the user ask, plan ahead and
            invoke the tools available to complete the user's ask. Always make
            sure you have completed all aspects of the user's ask. If the user
            says add to my list or remove from the list, add or remove from the
            cart, add the product or remove the product from the checkout
            session. If the user asks to add any items to the checkout session,
            search for the products and then add the matching products to
            checkout session.If the user asks to replace products,
            use remove_from_checkout and add_to_checkout tools to replace the
            products to match the user request

            User context:
            - User name: {nickname}
            - Autonomy level: {autonomy}
            - Priority when shopping: {priority}
            - Out of stock behavior: {out_of_stock}
            - Max amount per purchase: {max_purchase}
            - Max amount per month: {max_month}

            Preferences:
            - Preferred categories: {categories}
            - Custom categories: {custom_categories}
            - Favorite brands: {brands}

            Communication rules:
            - Notification preference: {notification_pref}
            - Summary frequency: {summary_freq}

            Behavior rules:
            - If autonomy level is LOW: always ask before confirming purchases.
            - If autonomy level is MEDIUM: auto-buy essentials, ask for non-routine items.
            - If autonomy level is HIGH: act autonomously within defined limits.
            - Never exceed spending limits.
            - If an item is out of stock, follow the configured out-of-stock action.
            - Always optimize according to the user's priority.

            You must act in the user's best interest and minimize friction.
"""

