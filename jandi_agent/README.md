# JANDI Agent

Agente personal de compras para usuarios de JANDI.

## Descripción

JANDI es el asistente personal de compras de cada usuario. Representa al USUARIO, no a ningún negocio.

**Características:**
- Uno por usuario
- Personalizado según preferencias del usuario
- Descubre y se comunica con business_agents vía A2A
- Compara opciones de múltiples negocios
- Toma decisiones según autonomía configurada

## Instalación

```bash
cd jandi_agent
pip install -e .
```

## Configuración

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Variables requeridas:
- `GOOGLE_API_KEY`: API key de Google AI
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase

## Uso

### Iniciar JANDI para un usuario específico

```bash
python -m jandi_agent.main --user-id <user_id>
```

Ejemplo:
```bash
python -m jandi_agent.main --user-id 550e8400-e29b-41d4-a716-446655440000
```

### Opciones

- `--host`: Host (default: localhost)
- `--port`: Puerto (default: 20000)
- `--user-id`: ID del usuario (requerido)

## Arquitectura

```
Usuario María
    ↓
JANDI (agente de María)
    ↓ A2A Protocol
business_agents (Don Juan, La Pizzería, etc.)
```

### Herramientas de JANDI

1. **search_businesses**: Busca negocios por categoría/ubicación
2. **communicate_with_business**: Envía mensajes a business_agents vía A2A
3. **place_order_via_business**: Realiza pedidos a través de business_agents

## Endpoints

- `/.well-known/agent.json`: Agent Card de JANDI
- `/profile`: Perfil del usuario

## Ejemplo de Interacción

```python
# Usuario: "Quiero pedir pizza"

# JANDI:
businesses = search_businesses(category="restaurant", keyword="pizza")
# Encuentra: Don Juan, La Pizzería, Napolitano

# JANDI se comunica con cada uno vía A2A:
response1 = communicate_with_business("donjuan_pizzas", "¿Pizza muzza grande?")
response2 = communicate_with_business("la_pizzeria", "¿Pizza muzza grande?")
response3 = communicate_with_business("napolitano", "¿Pizza muzza grande?")

# JANDI compara según prioridad del usuario (ej: "price")
# JANDI recomienda: "La Pizzería tiene la mejor opción: $2200, 45-60 min"

# Usuario: "Ok, pedir esa"

# JANDI:
order = place_order_via_business("la_pizzeria", order_details, user_id)
# Confirma: "¡Listo! Tu pizza llegará en 45-60 minutos."
```

## Diferencias con business_agent

| Aspecto | JANDI | business_agent |
|---------|-------|----------------|
| Representa | Usuario | Negocio |
| Cantidad | Uno por usuario | Uno por negocio |
| Configuración | user_profile | business_config |
| Puerto base | 20000+ | 10000+ |
| Herramientas | search_businesses, communicate_with_business | validate_order, get_products |
| Conocimiento | Multi-negocio | Mono-negocio |

## Desarrollo

### Tests

```bash
pytest tests/
```

### Linting

```bash
black src/
ruff check src/
```

## Licencia

Apache License 2.0
