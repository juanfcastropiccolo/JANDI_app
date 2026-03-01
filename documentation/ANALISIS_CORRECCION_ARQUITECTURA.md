# Análisis y Corrección de Arquitectura: JANDI vs Business Agent

## Fecha
27 de Enero, 2026

## Estado
🔴 **ARQUITECTURA INCORRECTA IDENTIFICADA** - Requiere corrección inmediata

---

## ❌ Problema Identificado

### Arquitectura Implementada (INCORRECTA)

Mezclé dos conceptos diferentes en un solo agente:

```
create_jandi_agent(user_id, business_config) ← MAL
├── Si tiene business_config → Representa al negocio
├── Si no tiene business_config → Representa múltiples negocios
└── Esto genera confusión conceptual
```

**Problemas:**
1. ❌ JANDI se convierte en el agente del negocio cuando debería ser el agente del usuario
2. ❌ Un solo agente intenta hacer dos roles diferentes
3. ❌ No hay separación clara entre agente de usuario y agente de negocio
4. ❌ No hay comunicación A2A real entre JANDI y business_agents
5. ❌ Escala mal: ¿Cómo JANDI se comunica con 100 negocios?

---

## ✅ Arquitectura Correcta

### Dos Tipos de Agentes Separados

```
┌─────────────────────────────────────────────────────────────┐
│  JANDI (Agente del Usuario)                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Uno por usuario                                   │    │
│  │ • Personalizado según user_profile                  │    │
│  │ • Descubre business_agents vía A2A                 │    │
│  │ • Se comunica con N business_agents                │    │
│  │ • Toma decisiones por el usuario                   │    │
│  │ • NO tiene business_config                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ A2A Protocol
┌─────────────────────────────────────────────────────────────┐
│  business_agent (Agente del Negocio)                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ • Uno por negocio                                   │    │
│  │ • Personalizado según business_config               │    │
│  │ • Expone Agent Card A2A para discovery             │    │
│  │ • Responde consultas sobre SU negocio              │    │
│  │ • Gestiona pedidos a SU negocio                    │    │
│  │ • NO tiene user_profile                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación Detallada

### JANDI (Agente del Usuario)

| Aspecto | Descripción |
|---------|-------------|
| **Propósito** | Asistente personal de compras del usuario |
| **Cantidad** | Uno por usuario |
| **Configuración** | `user_profile` (preferencias, autonomía, límites) |
| **Inicialización** | Al registrarse el usuario en la app |
| **Personalización** | Según preferencias del usuario |
| **Comunicación** | Se comunica CON business_agents vía A2A |
| **Endpoint** | `https://jandi.app/users/{user_id}/agent` |
| **Descubrimiento** | Descubre negocios vía Agent Cards |
| **Decisiones** | Por el usuario (qué comprar, dónde, cuándo) |
| **Conocimiento** | Multi-negocio (todos los negocios del ecosistema) |

**Ejemplo de JANDI:**
```python
jandi = create_jandi_agent(
    user_id="user123",
    user_profile={
        "nickname": "María",
        "autonomy_level": "medium",
        "priority": "quality",
        "shopping_categories": ["food", "pharmacy"],
        "max_amount_per_purchase": 5000
    }
)
```

**Prompt de JANDI:**
```
You are JANDI, María's personal shopping assistant.

Your role:
- Help María find products across ALL businesses in the JANDI ecosystem
- Communicate with business agents via A2A protocol to get information
- Compare options from multiple businesses
- Make recommendations based on María's preferences (quality priority)
- Respect her spending limits ($5000 per purchase)
- Act autonomously for routine purchases (medium autonomy)

You do NOT represent any specific business. You represent María.
```

---

### business_agent (Agente del Negocio)

| Aspecto | Descripción |
|---------|-------------|
| **Propósito** | Representante virtual del negocio |
| **Cantidad** | Uno por negocio |
| **Configuración** | `business_config` (horarios, zonas, políticas) |
| **Inicialización** | Al registrarse el negocio en la plataforma |
| **Personalización** | Según configuración del negocio |
| **Comunicación** | Responde A business_agents (como JANDI) vía A2A |
| **Endpoint** | `https://agents.jandi.app/{business_id}/a2a` |
| **Descubrimiento** | Expone Agent Card en `/.well-known/agent.json` |
| **Decisiones** | Por el negocio (políticas, precios, disponibilidad) |
| **Conocimiento** | Mono-negocio (solo SU negocio) |

**Ejemplo de business_agent:**
```python
business_agent = create_business_agent(
    business_id="donjuan_pizzas",
    business_config={
        "identity": {
            "legalName": "Pizzería Don Juan S.R.L.",
            "displayName": "Don Juan Pizzas",
            "category": "restaurant"
        },
        "operations": {
            "schedule": {...},
            "deliveryZones": ["Centro", "Nueva Córdoba"]
        },
        "policies": {
            "minimumOrder": 1000,
            "cancellationWindow": 15
        }
    }
)
```

**Prompt de business_agent:**
```
You are the virtual assistant of Don Juan Pizzas.

Your role:
- Answer questions about Don Juan Pizzas (menu, prices, hours)
- Validate orders for Don Juan Pizzas only
- Check delivery zones (Centro, Nueva Córdoba only)
- Enforce Don Juan Pizzas' policies (minimum $1000, 15min cancellation)
- Process orders for Don Juan Pizzas

You do NOT represent the customer. You represent Don Juan Pizzas.
```

---

## 🔄 Flujo de Interacción Correcto

### Escenario: Usuario pide pizza

```
1. Usuario María abre JANDI
   ↓
2. María: "Quiero pedir pizza"
   ↓
3. JANDI (agente de María):
   - Busca negocios de categoría "restaurant" que vendan pizza
   - Descubre Agent Cards de:
     * Don Juan Pizzas
     * La Pizzería del Barrio
     * Napolitano Express
   ↓
4. JANDI se comunica con cada business_agent vía A2A:
   
   JANDI → Don Juan Pizzas agent:
   {
     "jsonrpc": "2.0",
     "method": "query",
     "params": {
       "query": "¿Tienen pizza muzza grande? ¿Cuánto sale?",
       "user_zone": "Centro"
     }
   }
   
   Don Juan Pizzas agent → JANDI:
   {
     "result": {
       "available": true,
       "product": "Pizza Muzza Grande",
       "price": 2500,
       "delivery_available": true,
       "estimated_time": "30-45 minutos"
     }
   }
   
   [Mismo proceso con otros negocios]
   ↓
5. JANDI compara opciones:
   - Don Juan: $2500, 30-45min
   - La Pizzería: $2200, 45-60min
   - Napolitano: $2800, 20-30min
   ↓
6. JANDI recomienda según prioridad de María (quality):
   "Te recomiendo Napolitano Express ($2800) porque tiene las mejores 
    reseñas aunque es un poco más caro. Si preferís ahorrar, 
    La Pizzería del Barrio está a $2200."
   ↓
7. María: "Quiero la de Napolitano"
   ↓
8. JANDI → Napolitano agent vía A2A:
   {
     "method": "create_order",
     "params": {
       "items": [{"product_id": "pizza_muzza_grande", "quantity": 1}],
       "delivery_zone": "Centro",
       "user_id": "user123"
     }
   }
   ↓
9. Napolitano agent valida y procesa:
   - ✅ Zona cubierta
   - ✅ Negocio abierto
   - ✅ Stock disponible
   - ✅ Monto mínimo cumplido
   - Crea orden en su sistema
   ↓
10. JANDI confirma a María:
    "¡Listo! Tu pizza de Napolitano llegará en 20-30 minutos a Centro."
```

---

## 🏗️ Arquitectura de Despliegue

### Infraestructura JANDI

```
┌─────────────────────────────────────────────────────────────┐
│  JANDI Platform Infrastructure                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  User Agents (JANDI instances)                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ JANDI    │  │ JANDI    │  │ JANDI    │  ...   │    │
│  │  │ (María)  │  │ (Juan)   │  │ (Ana)    │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  │  Port: 20000+  Port: 20001   Port: 20002         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Business Agents                                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ agent    │  │ agent    │  │ agent    │  ...   │    │
│  │  │ (Don     │  │ (La Piz) │  │ (Napo)   │        │    │
│  │  │  Juan)   │  │          │  │          │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  │  Port: 10000   Port: 10001   Port: 10002         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Discovery Service                                 │    │
│  │  - Agent Card Registry                             │    │
│  │  - Business Lookup                                 │    │
│  │  - Category Search                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Supabase Database                                 │    │
│  │  - users (user_profiles)                           │    │
│  │  - businesses (business_config, agent_card)        │    │
│  │  - orders                                          │    │
│  │  - conversations                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Puertos y URLs

**User Agents (JANDI):**
- Base: `http://localhost:20000/users/{user_id}/agent`
- Cada usuario tiene su propia instancia en un puerto diferente
- Ejemplo: `http://localhost:20000/users/user123/agent`

**Business Agents:**
- Base: `http://localhost:10000/businesses/{business_id}/agent`
- Cada negocio tiene su propia instancia en un puerto diferente
- Ejemplo: `http://localhost:10000/businesses/donjuan_pizzas/agent`
- Agent Card: `http://localhost:10000/businesses/donjuan_pizzas/.well-known/agent.json`

---

## 📝 Modificaciones Necesarias

### 1. Renombrar Archivos y Funciones

#### `business_agent/src/business_agent/agent.py`

**ANTES (Incorrecto):**
```python
def create_jandi_agent(
    user_id: str | None = None,
    business_config: BusinessConfig | None = None
):
    # Mezclaba usuario y negocio
```

**DESPUÉS (Correcto):**
```python
def create_business_agent(
    business_id: str,
    business_config: BusinessConfig
):
    """
    Crea un agente para un negocio específico.
    
    Args:
        business_id: ID del negocio
        business_config: Configuración del negocio desde DB
    
    Returns:
        Agent personalizado para el negocio
    """
    agent = Agent(
        name=f"business_agent_{business_id}",
        description=f"{business_config.business_name} - {business_config.identity.get('category')}",
        instruction=build_business_agent_prompt(business_config),
        tools=[
            # Herramientas específicas del negocio
            get_business_products,
            validate_order,
            create_order,
            get_order_status,
            # Herramientas de validación
            validate_delivery_zone_tool,
            check_opening_hours_tool,
            validate_minimum_order_tool,
        ]
    )
    return agent
```

---

### 2. Crear `jandi_agent/` (Nuevo Directorio)

Estructura propuesta:

```
jandi_agent/
├── src/
│   └── jandi_agent/
│       ├── __init__.py
│       ├── agent.py              # create_jandi_agent()
│       ├── prompt.py             # build_jandi_prompt()
│       ├── user_config_loader.py # Carga user_profile
│       ├── business_discovery.py # Descubre business_agents
│       ├── a2a_client.py         # Cliente A2A para comunicarse con business_agents
│       ├── tools/
│       │   ├── __init__.py
│       │   ├── search_businesses.py
│       │   ├── communicate_with_business.py
│       │   ├── compare_options.py
│       │   └── make_decision.py
│       └── main.py               # Servidor JANDI
```

#### `jandi_agent/src/jandi_agent/agent.py`

```python
def create_jandi_agent(
    user_id: str,
    user_profile: UserProfile
):
    """
    Crea un agente JANDI personalizado para un usuario.
    
    Args:
        user_id: ID del usuario
        user_profile: Perfil del usuario desde DB
    
    Returns:
        Agent personalizado para el usuario
    """
    agent = Agent(
        name=f"jandi_{user_id}",
        description=f"JANDI - Asistente personal de compras de {user_profile.nickname}",
        instruction=build_jandi_prompt(user_profile),
        tools=[
            # Herramientas de JANDI
            search_businesses,           # Buscar negocios por categoría
            get_business_info,           # Obtener info de un negocio vía A2A
            communicate_with_business,   # Enviar mensaje a business_agent
            compare_business_options,    # Comparar opciones de múltiples negocios
            place_order_via_business,    # Hacer pedido a través de business_agent
            get_user_order_history,      # Historial del usuario
        ]
    )
    return agent
```

---

### 3. Separar Prompts

#### `business_agent/src/business_agent/prompt.py`

**Renombrar:**
- `build_jandi_system_prompt()` → `build_business_agent_prompt()`

**Nuevo contenido:**
```python
def build_business_agent_prompt(business_config: BusinessConfig) -> str:
    """
    Construye el prompt para un business_agent.
    
    El agente representa al NEGOCIO, no al usuario.
    """
    return f"""
You are the virtual assistant of {business_config.business_name}.

YOUR ROLE:
- You represent {business_config.business_name}, NOT the customer
- Answer questions about YOUR business (products, prices, hours, policies)
- Validate orders for YOUR business only
- Enforce YOUR business policies

YOUR BUSINESS INFO:
- Legal name: {business_config.legal_name}
- Category: {business_config.identity.get('category')}
- Operating regions: {', '.join(business_config.operating_regions)}

FULFILLMENT:
- Delivery: {'YES' if business_config.delivery_methods.get('delivery') else 'NO'}
  {f"Zones: {', '.join(business_config.delivery_zones)}" if business_config.delivery_zones else ""}
  {f"Time: {business_config.estimated_delivery_time_min}-{business_config.estimated_delivery_time_max} min" if business_config.estimated_delivery_time_min else ""}
- Pickup: {'YES' if business_config.delivery_methods.get('pickup') else 'NO'}
  {f"Prep time: {business_config.pickup_preparation_time_minutes} min" if business_config.pickup_preparation_time_minutes else ""}

PAYMENT:
{_format_payment_methods(business_config.payment_methods_supported)}
- Timing: {business_config.payment_timing}

POLICIES:
- Minimum order: ${business_config.policies.get('minimumOrder', 0)} {business_config.price_currency}
- Cancellation window: {business_config.cancellation_window_minutes} minutes
- Returns: {business_config.return_policy}
- Refunds: {business_config.refund_policy}

VALIDATION RULES:
1. ALWAYS validate delivery zone before confirming orders
2. ALWAYS check if YOUR business is open before taking orders
3. ALWAYS validate minimum order amount
4. NEVER accept orders outside YOUR delivery zones
5. NEVER accept orders when YOUR business is closed
6. Strictly follow YOUR business policies

Remember: You work FOR {business_config.business_name}. 
Your goal is to serve customers while protecting your business interests.
"""
```

#### `jandi_agent/src/jandi_agent/prompt.py`

**Nuevo archivo:**
```python
def build_jandi_prompt(user_profile: UserProfile) -> str:
    """
    Construye el prompt para JANDI (agente del usuario).
    
    El agente representa al USUARIO, no a ningún negocio.
    """
    return f"""
You are JANDI, the personal shopping assistant of {user_profile.nickname}.

YOUR ROLE:
- You represent {user_profile.nickname}, NOT any business
- Help {user_profile.nickname} find products across ALL businesses in JANDI
- Communicate with business agents to get information and place orders
- Compare options from multiple businesses
- Make recommendations based on {user_profile.nickname}'s preferences
- Act in {user_profile.nickname}'s best interest

USER PREFERENCES:
- Nickname: {user_profile.nickname}
- Autonomy level: {user_profile.autonomy_level}
  * LOW: Always ask before confirming purchases
  * MEDIUM: Auto-buy essentials, ask for non-routine
  * HIGH: Act autonomously within limits
- Shopping priority: {user_profile.priority}
  * price: Find cheapest options
  * quality: Find best quality
  * speed: Find fastest delivery
- Max per purchase: ${user_profile.max_amount_per_purchase}
- Max per month: ${user_profile.max_amount_per_month}
- Preferred categories: {', '.join(user_profile.shopping_categories)}
- Favorite brands: {', '.join(user_profile.favorite_brands)}

HOW TO HELP {user_profile.nickname}:
1. When {user_profile.nickname} asks for something:
   - Search for businesses that have it (use search_businesses tool)
   - Get info from each business (use communicate_with_business tool)
   - Compare options based on {user_profile.nickname}'s priority
   - Recommend the best option

2. When placing an order:
   - Verify {user_profile.nickname} approves (if autonomy is LOW/MEDIUM)
   - Check spending limits
   - Place order through the business agent (use place_order_via_business)
   - Confirm with {user_profile.nickname}

3. Multi-business awareness:
   - You can talk to MULTIPLE business agents
   - Each business agent represents ONE business
   - Compare their offerings to find the best for {user_profile.nickname}

IMPORTANT:
- You do NOT work for any business
- You work for {user_profile.nickname}
- Always act in {user_profile.nickname}'s best interest
- Respect {user_profile.nickname}'s spending limits
- Never exceed autonomy boundaries

Remember: You are {user_profile.nickname}'s advocate in the marketplace.
"""
```

---

### 4. Herramientas de JANDI (Nuevo)

#### `jandi_agent/src/jandi_agent/tools/business_discovery.py`

```python
from typing import List, Dict, Any

def search_businesses(
    category: str = None,
    location: str = None,
    keyword: str = None
) -> List[Dict[str, Any]]:
    """
    Busca negocios en el ecosistema JANDI.
    
    Args:
        category: Categoría (restaurant, pharmacy, etc.)
        location: Ubicación (Centro, Nueva Córdoba, etc.)
        keyword: Palabra clave en el nombre
    
    Returns:
        Lista de negocios con sus Agent Cards
    """
    # Query Supabase
    query = supabase.table('businesses').select('*').eq('is_active', True)
    
    if category:
        query = query.eq('business_type', category)
    
    if location:
        query = query.contains('operating_regions', [location])
    
    if keyword:
        query = query.ilike('business_name', f'%{keyword}%')
    
    result = query.execute()
    
    # Retornar con Agent Cards
    businesses = []
    for biz in result.data:
        businesses.append({
            'business_id': biz['id'],
            'business_name': biz['business_name'],
            'category': biz['business_type'],
            'agent_card': biz['agent_card'],
            'agent_url': f"http://localhost:10000/businesses/{biz['id']}/agent"
        })
    
    return businesses
```

#### `jandi_agent/src/jandi_agent/tools/a2a_client.py`

```python
import requests
from typing import Dict, Any

class A2AClient:
    """Cliente para comunicarse con business_agents vía A2A."""
    
    def send_message(
        self,
        business_agent_url: str,
        method: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Envía un mensaje JSON-RPC a un business_agent.
        
        Args:
            business_agent_url: URL del business_agent
            method: Método a llamar (query, create_order, etc.)
            params: Parámetros del método
        
        Returns:
            Respuesta del business_agent
        """
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": str(uuid.uuid4())
        }
        
        response = requests.post(business_agent_url, json=payload)
        return response.json()

def communicate_with_business(
    tool_context: ToolContext,
    business_id: str,
    query: str
) -> Dict[str, Any]:
    """
    Herramienta para que JANDI se comunique con un business_agent.
    
    Args:
        business_id: ID del negocio
        query: Consulta para el negocio
    
    Returns:
        Respuesta del business_agent
    """
    # Obtener URL del business_agent
    biz = supabase.table('businesses').select('*').eq('id', business_id).single().execute()
    agent_url = f"http://localhost:10000/businesses/{business_id}/agent"
    
    # Enviar mensaje vía A2A
    client = A2AClient()
    response = client.send_message(
        agent_url,
        method="query",
        params={"query": query, "user_id": tool_context.state.get('user_id')}
    )
    
    return response['result']
```

---

### 5. Modificar `main.py` para business_agent

#### `business_agent/src/business_agent/main.py`

**ANTES:**
```python
@click.option("--business-id", default=None)
async def run(host, port, business_id):
    # Cargaba config y creaba "jandi_agent"
    agent = create_jandi_agent(user_id, business_config)  # MAL
```

**DESPUÉS:**
```python
@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10000)
@click.option("--business-id", required=True, help="Business ID (required)")
async def run(host, port, business_id):
    """Run a business agent server for a specific business."""
    
    if not os.getenv("GOOGLE_API_KEY"):
        logger.error("GOOGLE_API_KEY must be set")
        exit(1)
    
    # Cargar configuración del negocio
    logger.info(f"Loading business configuration for: {business_id}")
    business_config = load_business_config(business_id)
    
    if not business_config:
        logger.error(f"Business not found or not configured: {business_id}")
        exit(1)
    
    # Cargar Agent Card desde DB
    agent_card = AgentCard.model_validate(business_config.agent_card)
    logger.info(f"Starting business agent for: {business_config.business_name}")
    
    # Crear business_agent (NO jandi_agent)
    business_agent = create_business_agent(
        business_id=business_id,
        business_config=business_config
    )
    
    # A2A server
    task_store = InMemoryTaskStore()
    request_handler = DefaultRequestHandler(
        agent_executor=ADKAgentExecutor(
            agent=business_agent,
            extensions=agent_card.capabilities.extensions or [],
        ),
        task_store=task_store,
    )
    
    a2a_app = A2AStarletteApplication(
        agent_card=agent_card,
        http_handler=request_handler
    )
    
    routes = a2a_app.routes()
    routes.extend([
        Route(
            "/.well-known/agent.json",
            lambda _: JSONResponse(business_config.agent_card)
        ),
        Route(
            "/.well-known/ucp",
            lambda _: JSONResponse(business_config.ucp_profile)
        ),
    ])
    
    app = Starlette(routes=routes)
    
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    
    logger.info(f"Business agent running at: http://{host}:{port}")
    logger.info(f"Agent Card: http://{host}:{port}/.well-known/agent.json")
    
    await server.serve()
```

---

### 6. Crear `jandi_agent/src/jandi_agent/main.py` (Nuevo)

```python
@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=20000)
@click.option("--user-id", required=True, help="User ID (required)")
async def run(host, port, user_id):
    """Run a JANDI agent server for a specific user."""
    
    if not os.getenv("GOOGLE_API_KEY"):
        logger.error("GOOGLE_API_KEY must be set")
        exit(1)
    
    # Cargar perfil del usuario
    logger.info(f"Loading user profile for: {user_id}")
    user_profile = load_user_profile(user_id)
    
    if not user_profile:
        logger.error(f"User not found: {user_id}")
        exit(1)
    
    # Crear JANDI agent (NO business_agent)
    logger.info(f"Starting JANDI for user: {user_profile.nickname}")
    jandi = create_jandi_agent(
        user_id=user_id,
        user_profile=user_profile
    )
    
    # A2A server (JANDI también expone A2A para recibir notificaciones)
    jandi_agent_card = generate_jandi_agent_card(user_profile)
    
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
    app = Starlette(routes=routes)
    
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    
    logger.info(f"JANDI agent running at: http://{host}:{port}")
    logger.info(f"User: {user_profile.nickname}")
    
    await server.serve()
```

---

## 🚀 Comandos de Despliegue

### Iniciar business_agents

```bash
# Don Juan Pizzas
python -m business_agent.main \
  --host 0.0.0.0 \
  --port 10000 \
  --business-id donjuan_pizzas

# La Pizzería del Barrio
python -m business_agent.main \
  --host 0.0.0.0 \
  --port 10001 \
  --business-id la_pizzeria

# Napolitano Express
python -m business_agent.main \
  --host 0.0.0.0 \
  --port 10002 \
  --business-id napolitano
```

### Iniciar JANDI para usuarios

```bash
# JANDI de María
python -m jandi_agent.main \
  --host 0.0.0.0 \
  --port 20000 \
  --user-id user_maria

# JANDI de Juan
python -m jandi_agent.main \
  --host 0.0.0.0 \
  --port 20001 \
  --user-id user_juan
```

---

## 📋 Checklist de Modificaciones

### business_agent (Modificar)

- [ ] Renombrar `create_jandi_agent()` → `create_business_agent()`
- [ ] Renombrar `build_jandi_system_prompt()` → `build_business_agent_prompt()`
- [ ] Eliminar dependencia de `user_profile` en business_agent
- [ ] Hacer `business_id` y `business_config` obligatorios
- [ ] Actualizar `main.py` para requerir `--business-id`
- [ ] Actualizar prompt para representar al negocio, no al usuario
- [ ] Actualizar Agent Card para reflejar que es un business_agent

### jandi_agent (Crear desde cero)

- [ ] Crear directorio `jandi_agent/`
- [ ] Crear `agent.py` con `create_jandi_agent(user_id, user_profile)`
- [ ] Crear `prompt.py` con `build_jandi_prompt(user_profile)`
- [ ] Crear `user_config_loader.py` para cargar user_profile
- [ ] Crear `tools/business_discovery.py` para buscar negocios
- [ ] Crear `tools/a2a_client.py` para comunicarse con business_agents
- [ ] Crear `tools/compare_options.py` para comparar negocios
- [ ] Crear `main.py` para servidor JANDI con `--user-id`

### Base de Datos (Revisar)

- [ ] Tabla `users` debe tener campos para configurar JANDI:
  - `jandi_config` (jsonb)
  - `autonomy_level` (text)
  - `shopping_priority` (text)
  - `max_amount_per_purchase` (numeric)
  - `max_amount_per_month` (numeric)

---

## 🎯 Resultado Esperado

### Cuando un negocio se registra:

```
1. BusinessRegister completa formulario
                ↓
2. businessConfigService.saveConfiguration()
                ↓
3. Supabase guarda:
   - business_config
   - agent_card
   - ucp_profile
                ↓
4. System spawn business_agent:
   python -m business_agent.main --business-id {id}
                ↓
5. business_agent se inicia en puerto 10xxx
                ↓
6. business_agent expone:
   - /.well-known/agent.json
   - /.well-known/ucp
   - A2A endpoint
```

### Cuando un usuario se registra:

```
1. OnboardingContainer completa registro
                ↓
2. userService.createUser()
                ↓
3. Supabase guarda:
   - user_profile
   - jandi_config
                ↓
4. System spawn jandi_agent:
   python -m jandi_agent.main --user-id {id}
                ↓
5. JANDI se inicia en puerto 20xxx
                ↓
6. JANDI puede:
   - search_businesses()
   - communicate_with_business()
   - place_order_via_business()
```

### Cuando un usuario pide pizza:

```
Usuario → JANDI (su agente)
              ↓
        search_businesses(category="restaurant", keyword="pizza")
              ↓
        Encuentra: Don Juan, La Pizzería, Napolitano
              ↓
        communicate_with_business(Don Juan, "¿Pizza muzza grande?")
        communicate_with_business(La Pizzería, "¿Pizza muzza grande?")
        communicate_with_business(Napolitano, "¿Pizza muzza grande?")
              ↓
        Recibe respuestas vía A2A de cada business_agent
              ↓
        compare_options() según prioridad del usuario
              ↓
        Recomienda la mejor opción
              ↓
        Usuario confirma
              ↓
        place_order_via_business(Napolitano, order_details)
              ↓
        Napolitano business_agent procesa
              ↓
        Confirma a JANDI
              ↓
        JANDI confirma al usuario
```

---

## 📊 Resumen de Cambios

| Aspecto | Antes (Incorrecto) | Después (Correcto) |
|---------|-------------------|-------------------|
| **Agentes** | 1 tipo (JANDI) que hace ambos roles | 2 tipos separados (JANDI + business_agent) |
| **JANDI** | Representa negocio cuando tiene business_config | Siempre representa al usuario |
| **business_agent** | No existe separado | Uno por negocio, representa al negocio |
| **Comunicación** | Directa con DB | JANDI ↔ business_agent vía A2A |
| **Configuración** | Mezclada | Separada (user_profile vs business_config) |
| **Escalabilidad** | No escala | Escala a N usuarios y M negocios |
| **Discovery** | No hay | JANDI descubre business_agents vía Agent Cards |

---

## ✅ Conclusión

La arquitectura correcta requiere:

1. **Separación clara** entre JANDI (usuario) y business_agent (negocio)
2. **Comunicación A2A** entre JANDI y business_agents
3. **Discovery dinámico** de negocios por parte de JANDI
4. **Configuración separada** para usuarios y negocios
5. **Despliegue independiente** de cada agente

Esta arquitectura permite:
- ✅ Escalar a N usuarios y M negocios
- ✅ Cada usuario tiene su JANDI personalizado
- ✅ Cada negocio tiene su business_agent personalizado
- ✅ JANDI puede comparar múltiples negocios
- ✅ Comunicación estándar vía A2A

**Prioridad:** ALTA - Requiere refactoring inmediato antes de continuar desarrollo.
