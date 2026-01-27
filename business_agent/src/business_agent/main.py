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

"""UCP."""

import asyncio
import functools
import json
import logging
import os

from pathlib import Path
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCard
import click
from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.responses import FileResponse, JSONResponse
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles
import uvicorn

from .agent import create_business_agent
from .agent_executor import ADKAgentExecutor
from .config_loader import load_business_config

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.addHandler(logging.StreamHandler())


def make_sync(func):
    """Wrap an async function to run synchronously.

    Args:
        func: The async function to wrap.





    Returns:
        The wrapped synchronous function.


    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return asyncio.run(func(*args, **kwargs))

    return wrapper


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10000)
@click.option("--business-id", required=True, help="Business ID (required)")
@make_sync
async def run(host, port, business_id):
    """Run a business agent server for a specific business.
    
    This agent represents the BUSINESS, not the user.

    Args:
        host: The host to bind to.
        port: The port to listen on.
        business_id: Business ID to load configuration from database (required).

    """
    if not os.getenv("GOOGLE_API_KEY"):
        logger.error("GOOGLE_API_KEY must be set")
        exit(1)

    base_path = Path(__file__).parent
    
    # Cargar configuración del negocio desde DB (REQUERIDO)
    logger.info(f"Loading business configuration from database for business_id: {business_id}")
    business_config = load_business_config(business_id)
    
    if not business_config:
        logger.error(f"Business not found or not configured: {business_id}")
        logger.error("Make sure the business has completed registration and configuration.")
        exit(1)
    
    if not business_config.agent_card:
        logger.error(f"Business {business_id} does not have an Agent Card configured")
        logger.error("The business needs to complete the configuration step during registration.")
        exit(1)
    
    # Cargar Agent Card desde DB
    logger.info(f"Using Agent Card from database for: {business_config.business_name}")
    agent_card = AgentCard.model_validate(business_config.agent_card)

    # Crear business_agent (NO jandi_agent)
    logger.info(f"Creating business agent for: {business_config.business_name}")
    business_agent = create_business_agent(
        business_id=business_id,
        business_config=business_config
    )
    
    task_store = InMemoryTaskStore()

    request_handler = DefaultRequestHandler(
        agent_executor=ADKAgentExecutor(
            agent=business_agent,
            extensions=agent_card.capabilities.extensions or [],
        ),
        task_store=task_store,
    )

    a2a_app = A2AStarletteApplication(
        agent_card=agent_card, http_handler=request_handler
    )
    routes = a2a_app.routes()
    
    # Función para servir Agent Card dinámicamente por business_id
    async def get_business_agent_card(request):
        """Endpoint para obtener el Agent Card de un negocio específico."""
        bid = request.path_params.get('business_id')
        if not bid:
            return JSONResponse({"error": "business_id is required"}, status_code=400)
        
        config = load_business_config(bid)
        if not config or not config.agent_card:
            return JSONResponse({"error": "Business not found or no agent card configured"}, status_code=404)
        
        return JSONResponse(config.agent_card)
    
    routes.extend(
        [
            Route(
                "/.well-known/agent.json",
                lambda _: JSONResponse(business_config.agent_card),
            ),
            Route(
                "/.well-known/ucp",
                lambda _: JSONResponse(business_config.ucp_profile) if business_config.ucp_profile else FileResponse(base_path / "data" / "ucp.json"),
            ),
            Mount(
                "/images",
                app=StaticFiles(directory=str(base_path / "data" / "images")),
                name="images",
            ),
        ]
    )
    app = Starlette(routes=routes)

    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    
    logger.info(f"=" * 60)
    logger.info(f"Business agent running at: http://{host}:{port}")
    logger.info(f"Business: {business_config.business_name}")
    logger.info(f"Agent Card: http://{host}:{port}/.well-known/agent.json")
    logger.info(f"UCP Profile: http://{host}:{port}/.well-known/ucp")
    logger.info(f"=" * 60)
    
    await server.serve()


if __name__ == "__main__":
  run()
