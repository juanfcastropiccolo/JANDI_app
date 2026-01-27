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

"""JANDI Agent - Personal shopping assistant for users."""

import logging
from typing import Dict, Any
from google.adk.agents import Agent
from .prompt import build_jandi_prompt
from .tools.business_discovery import search_businesses, get_business_details
from .tools.a2a_client import communicate_with_business, place_order_via_business

logger = logging.getLogger(__name__)


def create_jandi_agent(user_id: str, user_profile: Dict[str, Any]):
    """
    Crea un agente JANDI personalizado para un usuario.
    
    JANDI es el asistente personal de compras del usuario.
    Representa al USUARIO, no a ningún negocio.
    
    Args:
        user_id: ID del usuario (requerido)
        user_profile: Perfil del usuario desde DB (requerido)
    
    Returns:
        Agent: Agente JANDI configurado para el usuario
    """
    logger.info(f"Creating JANDI agent for user: {user_id}")
    
    # Construir prompt personalizado del usuario
    JANDI_PROMPT = build_jandi_prompt(user_profile)
    
    # Nombre y descripción del agente
    nickname = user_profile.get("nickname", "Usuario")
    agent_name = f"jandi_{user_id}"
    agent_description = f"JANDI - Asistente personal de compras de {nickname}"
    
    # Crear agente
    jandi = Agent(
        name=agent_name,
        model="gemini-2.0-flash-exp",
        description=agent_description,
        instruction=JANDI_PROMPT,
        tools=[
            # Herramientas de JANDI para descubrir y comunicarse con negocios
            search_businesses,           # Buscar negocios por categoría/ubicación/keyword
            get_business_details,        # Obtener detalles de un negocio específico
            communicate_with_business,   # Enviar mensajes a business_agents vía A2A
            place_order_via_business,    # Hacer pedidos a través de business_agents
            # TODO: Agregar más herramientas:
            # - compare_business_options: Comparar opciones de múltiples negocios
            # - get_user_order_history: Historial de pedidos del usuario
            # - get_user_preferences: Obtener preferencias actualizadas
            # - update_user_preferences: Actualizar preferencias
        ],
    )
    
    logger.info(f"JANDI agent created successfully for: {nickname}")
    return jandi
