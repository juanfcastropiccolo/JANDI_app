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

"""A2A client for JANDI to communicate with business agents."""

import logging
import uuid
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)


class A2AClient:
    """Cliente para comunicarse con business_agents vía A2A Protocol."""
    
    def __init__(self, timeout: int = 30):
        """
        Inicializa el cliente A2A.
        
        Args:
            timeout: Timeout en segundos para las requests
        """
        self.timeout = timeout
    
    def send_message(
        self,
        business_agent_url: str,
        method: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía un mensaje JSON-RPC 2.0 a un business_agent.
        
        Args:
            business_agent_url: URL del business_agent
            method: Método a llamar (query, create_order, get_products, etc.)
            params: Parámetros del método
        
        Returns:
            Respuesta del business_agent
        """
        try:
            # Construir payload JSON-RPC 2.0
            payload = {
                "jsonrpc": "2.0",
                "method": method,
                "params": params,
                "id": str(uuid.uuid4())
            }
            
            logger.info(f"Sending A2A message to {business_agent_url}: {method}")
            logger.debug(f"Payload: {payload}")
            
            # Enviar request
            response = requests.post(
                business_agent_url,
                json=payload,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Received response from {business_agent_url}")
            logger.debug(f"Response: {result}")
            
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout communicating with {business_agent_url}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32000,
                    "message": "Timeout: El negocio no respondió a tiempo"
                },
                "id": None
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error communicating with {business_agent_url}: {e}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32001,
                    "message": f"Error de comunicación: {str(e)}"
                },
                "id": None
            }
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32603,
                    "message": f"Error interno: {str(e)}"
                },
                "id": None
            }


def communicate_with_business(
    business_id: str,
    query: str,
    user_id: Optional[str] = None,
    user_zone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Herramienta para que JANDI se comunique con un business_agent.
    
    Args:
        business_id: ID del negocio
        query: Consulta o mensaje para el negocio
        user_id: ID del usuario (opcional)
        user_zone: Zona del usuario (opcional, para validar delivery)
    
    Returns:
        Respuesta del business_agent
    """
    try:
        # Construir URL del business_agent
        # TODO: En producción, obtener esto de un service discovery
        agent_url = f"http://localhost:10000/businesses/{business_id}/agent"
        
        # Preparar parámetros
        params = {
            "query": query
        }
        
        if user_id:
            params["user_id"] = user_id
        
        if user_zone:
            params["user_zone"] = user_zone
        
        # Enviar mensaje vía A2A
        client = A2AClient()
        response = client.send_message(
            agent_url,
            method="query",
            params=params
        )
        
        # Procesar respuesta
        if "result" in response:
            return {
                "success": True,
                "business_id": business_id,
                "response": response["result"],
                "message": "Respuesta recibida del negocio"
            }
        elif "error" in response:
            return {
                "success": False,
                "business_id": business_id,
                "error": response["error"],
                "message": f"Error del negocio: {response['error'].get('message', 'Unknown error')}"
            }
        else:
            return {
                "success": False,
                "business_id": business_id,
                "error": "Invalid response format",
                "message": "Respuesta inválida del negocio"
            }
            
    except Exception as e:
        logger.error(f"Error in communicate_with_business: {e}")
        return {
            "success": False,
            "business_id": business_id,
            "error": str(e),
            "message": f"Error al comunicarse con el negocio: {str(e)}"
        }


def place_order_via_business(
    business_id: str,
    order_details: Dict[str, Any],
    user_id: str
) -> Dict[str, Any]:
    """
    Coloca un pedido a través de un business_agent.
    
    Args:
        business_id: ID del negocio
        order_details: Detalles del pedido (items, delivery_zone, etc.)
        user_id: ID del usuario
    
    Returns:
        Respuesta del business_agent con confirmación del pedido
    """
    try:
        agent_url = f"http://localhost:10000/businesses/{business_id}/agent"
        
        params = {
            "order_details": order_details,
            "user_id": user_id
        }
        
        client = A2AClient()
        response = client.send_message(
            agent_url,
            method="create_order",
            params=params
        )
        
        if "result" in response:
            return {
                "success": True,
                "business_id": business_id,
                "order": response["result"],
                "message": "Pedido realizado exitosamente"
            }
        elif "error" in response:
            return {
                "success": False,
                "business_id": business_id,
                "error": response["error"],
                "message": f"Error al crear pedido: {response['error'].get('message', 'Unknown error')}"
            }
        else:
            return {
                "success": False,
                "business_id": business_id,
                "error": "Invalid response",
                "message": "Respuesta inválida del negocio"
            }
            
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        return {
            "success": False,
            "business_id": business_id,
            "error": str(e),
            "message": f"Error al realizar pedido: {str(e)}"
        }
