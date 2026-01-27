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

"""User config loader for JANDI agent."""

import logging
import os
import uuid
from typing import Dict, Any, Optional
from supabase import create_client

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _is_uuid(value: str) -> bool:
    """Verifica si un string es un UUID válido."""
    try:
        uuid.UUID(value)
        return True
    except Exception:
        return False


def load_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Carga el perfil completo de un usuario desde Supabase.
    
    Args:
        user_id: ID del usuario
    
    Returns:
        Dict con el perfil del usuario o None si no se encuentra
    """
    if not user_id:
        logger.warning("No user_id provided")
        return None
    
    if not _is_uuid(user_id):
        logger.warning(f"Invalid user_id (expected UUID): {user_id}")
        return None
    
    try:
        logger.info(f"Loading user profile for: {user_id}")
        
        # Cargar desde user_profiles
        response = supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()
        
        if not response.data:
            logger.warning(f"User profile not found: {user_id}")
            return None
        
        profile = response.data
        
        # Agregar user_id al perfil
        profile['user_id'] = user_id
        
        # Valores por defecto si faltan
        profile.setdefault('nickname', 'Usuario')
        profile.setdefault('autonomy_level', 'low')
        profile.setdefault('priority', 'price')
        profile.setdefault('out_of_stock_action', 'ask')
        profile.setdefault('shopping_categories', [])
        profile.setdefault('custom_categories', [])
        profile.setdefault('favorite_brands', [])
        profile.setdefault('notification_preference', 'important_only')
        profile.setdefault('summary_frequency', 'weekly')
        
        logger.info(f"User profile loaded successfully: {profile.get('nickname')}")
        return profile
        
    except Exception as e:
        logger.error(f"Error loading user profile for {user_id}: {e}")
        return None


class UserConfigLoader:
    """Cargador de configuraciones de usuarios con caché."""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def load_user_profile(self, user_id: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """
        Carga el perfil de un usuario con soporte de caché.
        
        Args:
            user_id: ID del usuario
            use_cache: Si True, usa caché si está disponible
        
        Returns:
            Dict con el perfil del usuario o None
        """
        if use_cache and user_id in self._cache:
            logger.info(f"Loading user profile from cache: {user_id}")
            return self._cache[user_id]
        
        profile = load_user_profile(user_id)
        
        if profile:
            self._cache[user_id] = profile
        
        return profile
    
    def reload_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Recarga el perfil de un usuario desde DB (ignora caché).
        
        Args:
            user_id: ID del usuario
        
        Returns:
            Dict con el perfil del usuario o None
        """
        if user_id in self._cache:
            del self._cache[user_id]
        
        return self.load_user_profile(user_id, use_cache=False)
    
    def clear_cache(self):
        """Limpia toda la caché de perfiles."""
        self._cache.clear()
        logger.info("User profile cache cleared")


# Singleton instance
_config_loader: Optional[UserConfigLoader] = None


def get_user_config_loader() -> UserConfigLoader:
    """Obtiene la instancia singleton del user config loader."""
    global _config_loader
    if _config_loader is None:
        _config_loader = UserConfigLoader()
    return _config_loader
