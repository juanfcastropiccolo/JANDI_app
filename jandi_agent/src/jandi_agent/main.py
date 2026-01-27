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

"""JANDI Agent Server - Personal shopping assistant for users."""

import asyncio
import functools
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCard
import click
from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
import uvicorn

from .agent import create_jandi_agent
from .user_config_loader import load_user_profile

# Importar ADKAgentExecutor del business_agent (reutilizar)
import sys
business_agent_path = Path(__file__).parent.parent.parent.parent / "business_agent" / "src"
sys.path.insert(0, str(business_agent_path))
from business_agent.agent_executor import ADKAgentExecutor

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.addHandler(logging.StreamHandler())


def make_sync(func):
    """Wrap an async function to run synchronously."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return asyncio.run(func(*args, **kwargs))
    return wrapper


def generate_jandi_agent_card(user_profile: Dict[str, Any]) -> AgentCard:
    """
    Genera el Agent Card para JANDI (agente del usuario).
    
    Args:
        user_profile: Perfil del usuario
    
    Returns:
        AgentCard para JANDI
    """
    nickname = user_profile.get("nickname", "Usuario")
    
    return AgentCard.model_validate({
        "name": f"JANDI ({nickname})",
        "description": f"Asistente personal de compras de {nickname}",
        "url": f"https://jandi.app/users/{user_profile.get('user_id')}/agent",
        "provider": {
            "organization": "JANDI",
            "url": "https://jandi.app"
        },
        "version": "1.0.0",
        "capabilities": {
            "streaming": True,
            "pushNotifications": True,
            "stateTransitionHistory": False
        },
        "defaultInputModes": ["text/plain", "application/json"],
        "defaultOutputModes": ["text/plain", "application/json"],
        "skills": [
            {
                "id": "search-products",
                "name": "Buscar Productos",
                "description": "Busca productos en todos los negocios del ecosistema JANDI",
                "tags": ["search", "products", "shopping"],
                "examples": ["Quiero comprar pizza", "Buscar paracetamol"]
            },
            {
                "id": "compare-businesses",
                "name": "Comparar Negocios",
                "description": "Compara opciones de múltiples negocios según preferencias del usuario",
                "tags": ["compare", "businesses", "options"],
                "examples": ["¿Cuál es más barato?", "¿Cuál entrega más rápido?"]
            },
            {
                "id": "place-order",
                "name": "Realizar Pedido",
                "description": "Realiza pedidos en nombre del usuario",
                "tags": ["order", "purchase", "buy"],
                "examples": ["Hacer pedido", "Comprar esto"]
            }
        ]
    })


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=20000)
@click.option("--user-id", required=True, help="User ID (required)")
@make_sync
async def run(host, port, user_id):
    """Run a JANDI agent server for a specific user.
    
    This agent represents the USER, not any business.

    Args:
        host: The host to bind to.
        port: The port to listen on.
        user_id: User ID to load profile from database (required).

    """
    if not os.getenv("GOOGLE_API_KEY"):
        logger.error("GOOGLE_API_KEY must be set")
        exit(1)
    
    # Cargar perfil del usuario desde DB (REQUERIDO)
    logger.info(f"Loading user profile from database for user_id: {user_id}")
    user_profile = load_user_profile(user_id)
    
    if not user_profile:
        logger.error(f"User not found or not configured: {user_id}")
        logger.error("Make sure the user has completed registration.")
        exit(1)
    
    nickname = user_profile.get("nickname", "Usuario")
    logger.info(f"User profile loaded successfully for: {nickname}")
    
    # Generar Agent Card para JANDI
    jandi_agent_card = generate_jandi_agent_card(user_profile)
    
    # Crear JANDI agent (NO business_agent)
    logger.info(f"Creating JANDI agent for: {nickname}")
    jandi = create_jandi_agent(
        user_id=user_id,
        user_profile=user_profile
    )
    
    # A2A server
    task_store = InMemoryTaskStore()
    
    request_handler = DefaultRequestHandler(
        agent_executor=ADKAgentExecutor(agent=jandi),
        task_store=task_store,
    )
    
    a2a_app = A2AStarletteApplication(
        agent_card=jandi_agent_card,
        http_handler=request_handler
    )
    
    routes = a2a_app.routes()
    
    # Endpoint para obtener el perfil del usuario (opcional)
    async def get_user_profile_endpoint(request):
        """Endpoint para obtener el perfil del usuario."""
        return JSONResponse({
            "user_id": user_id,
            "nickname": nickname,
            "autonomy_level": user_profile.get("autonomy_level", "low"),
            "priority": user_profile.get("priority", "price")
        })
    
    routes.extend([
        Route(
            "/profile",
            get_user_profile_endpoint,
            methods=["GET"],
        ),
    ])
    
    app = Starlette(routes=routes)
    
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    
    logger.info(f"=" * 60)
    logger.info(f"JANDI agent running at: http://{host}:{port}")
    logger.info(f"User: {nickname}")
    logger.info(f"User ID: {user_id}")
    logger.info(f"Autonomy: {user_profile.get('autonomy_level', 'low')}")
    logger.info(f"Priority: {user_profile.get('priority', 'price')}")
    logger.info(f"=" * 60)
    
    await server.serve()


if __name__ == "__main__":
    run()
