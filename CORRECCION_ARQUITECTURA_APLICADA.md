# Corrección Arquitectónica Aplicada: JANDI vs Business Agent

## Fecha
27 de Enero, 2026

## Estado
✅ **CORRECCIÓN COMPLETADA** - Arquitectura correcta implementada

---

## 🎯 Resumen Ejecutivo

Se corrigió exitosamente la arquitectura para separar claramente dos tipos de agentes:
1. **JANDI** - Agente personal del usuario
2. **business_agent** - Agente del negocio

Ahora cada tipo de agente tiene su propio propósito, configuración y herramientas.

---

## ✅ Modificaciones Aplicadas

### 1. business_agent (Modificado)

#### `agent.py`
- ✅ Renombrado: `create_jandi_agent()` → `create_business_agent()`
- ✅ Parámetros: `business_id` y `business_config` ahora son **requeridos**
- ✅ Eliminada dependencia de `user_profile`
- ✅ `root_agent` ahora es `None` (se crea en main.py)

**Antes:**
```python
def create_jandi_agent(user_id=None, business_config=None):
    # Mezclaba usuario y negocio
```

**Después:**
```python
def create_business_agent(business_id: str, business_config: BusinessConfig):
    """Crea un agente para un negocio específico."""
    # Solo negocio, sin usuario
```

#### `prompt.py`
- ✅ Renombrado: `build_jandi_system_prompt()` → `build_business_agent_prompt()`
- ✅ Eliminado parámetro `user_profile`
- ✅ Prompt enfocado en representar al NEGOCIO

**Prompt actualizado:**
```
You are the virtual assistant of Don Juan Pizzas.

YOUR ROLE:
- You represent Don Juan Pizzas, NOT the customer
- Answer questions about YOUR business
- Validate orders for YOUR business only
- Enforce YOUR business policies

You work FOR Don Juan Pizzas.
```

#### `main.py`
- ✅ `--business-id` ahora es **requerido** (no opcional)
- ✅ Carga configuración desde DB obligatoriamente
- ✅ Crea `business_agent` (no `jandi_agent`)
- ✅ Endpoint `/.well-known/agent.json` sirve Agent Card dinámico
- ✅ Logs mejorados con información del negocio

**Comando:**
```bash
python -m business_agent.main --business-id donjuan_pizzas
```

---

### 2. jandi_agent (Creado desde cero)

#### Estructura de Directorios

```
jandi_agent/
├── src/
│   └── jandi_agent/
│       ├── __init__.py
│       ├── agent.py                  # create_jandi_agent()
│       ├── prompt.py                 # build_jandi_prompt()
│       ├── user_config_loader.py    # load_user_profile()
│       ├── main.py                   # Servidor JANDI
│       └── tools/
│           ├── __init__.py
│           ├── business_discovery.py # search_businesses()
│           └── a2a_client.py         # communicate_with_business()
├── pyproject.toml
├── .env.example
└── README.md
```

#### `agent.py` (Nuevo)
- ✅ Función `create_jandi_agent(user_id, user_profile)`
- ✅ Agente representa al USUARIO
- ✅ Herramientas para descubrir y comunicarse con negocios

**Código:**
```python
def create_jandi_agent(user_id: str, user_profile: Dict[str, Any]):
    """
    Crea un agente JANDI personalizado para un usuario.
    
    JANDI representa al USUARIO, no a ningún negocio.
    """
    jandi = Agent(
        name=f"jandi_{user_id}",
        description=f"JANDI - Asistente personal de {nickname}",
        instruction=build_jandi_prompt(user_profile),
        tools=[
            search_businesses,
            get_business_details,
            communicate_with_business,
            place_order_via_business,
        ]
    )
    return jandi
```

#### `prompt.py` (Nuevo)
- ✅ Función `build_jandi_prompt(user_profile)`
- ✅ Prompt enfocado en representar al USUARIO

**Prompt:**
```
You are JANDI, the personal shopping assistant of María.

YOUR ROLE:
- You represent María, NOT any business
- Help María find products across ALL businesses
- Communicate with business agents via A2A
- Compare options from multiple businesses
- Act in María's best interest

You work FOR María.
```

#### `tools/business_discovery.py` (Nuevo)
- ✅ `search_businesses()`: Busca negocios por categoría/ubicación/keyword
- ✅ `get_business_details()`: Obtiene detalles de un negocio

**Ejemplo:**
```python
result = search_businesses(category="restaurant", keyword="pizza")
# Retorna: {
#   'businesses': [
#     {'business_id': '...', 'business_name': 'Don Juan Pizzas', ...},
#     {'business_id': '...', 'business_name': 'La Pizzería', ...}
#   ]
# }
```

#### `tools/a2a_client.py` (Nuevo)
- ✅ Clase `A2AClient`: Cliente HTTP para JSON-RPC 2.0
- ✅ `communicate_with_business()`: Envía mensajes a business_agents
- ✅ `place_order_via_business()`: Realiza pedidos

**Ejemplo:**
```python
response = communicate_with_business(
    business_id="donjuan_pizzas",
    query="¿Pizza muzza grande?",
    user_zone="Centro"
)
# Envía JSON-RPC a business_agent
# Recibe respuesta con precio, disponibilidad, tiempo
```

#### `user_config_loader.py` (Nuevo)
- ✅ `load_user_profile()`: Carga perfil del usuario desde Supabase
- ✅ Clase `UserConfigLoader`: Singleton con caché
- ✅ Validación de UUID

#### `main.py` (Nuevo)
- ✅ CLI con `--user-id` requerido
- ✅ Carga perfil del usuario desde DB
- ✅ Crea JANDI agent personalizado
- ✅ Servidor A2A en puerto 20000+
- ✅ Endpoint `/profile` para ver perfil del usuario

**Comando:**
```bash
python -m jandi_agent.main --user-id user123
```

#### Archivos de Configuración (Nuevos)
- ✅ `pyproject.toml`: Dependencias y configuración
- ✅ `.env.example`: Template de variables de entorno
- ✅ `README.md`: Documentación de uso

---

## 📊 Comparación: Antes vs Después

### ANTES (Arquitectura Incorrecta)

```
┌─────────────────────────────────────┐
│  create_jandi_agent()               │
│  ├── Si tiene business_config       │
│  │   → Representa al negocio        │
│  └── Si no tiene business_config    │
│      → Representa múltiples negocios│
└─────────────────────────────────────┘

❌ Problemas:
- Un solo agente hace dos roles
- Confusión conceptual
- No escala
- No hay comunicación A2A real
```

### DESPUÉS (Arquitectura Correcta)

```
┌─────────────────────────────────────┐
│  JANDI (jandi_agent/)               │
│  create_jandi_agent(user_id, user_profile)
│  - Representa al USUARIO            │
│  - Descubre negocios                │
│  - Se comunica con business_agents  │
│  - Compara opciones                 │
└─────────────────────────────────────┘
              ↓ A2A Protocol
┌─────────────────────────────────────┐
│  business_agent/                    │
│  create_business_agent(business_id, business_config)
│  - Representa al NEGOCIO            │
│  - Expone Agent Card                │
│  - Responde consultas               │
│  - Valida pedidos                   │
└─────────────────────────────────────┘

✅ Beneficios:
- Separación clara de responsabilidades
- Cada agente tiene su propósito
- Comunicación A2A estándar
- Escala a N usuarios y M negocios
```

---

## 🔄 Flujo de Interacción Correcto

### Escenario: María pide pizza

```
1. María abre la app JANDI
                ↓
2. Chat-client se conecta a JANDI (agente de María)
   http://localhost:20000/users/maria/agent
                ↓
3. María: "Quiero pedir pizza"
                ↓
4. JANDI (agente de María):
   - search_businesses(category="restaurant", keyword="pizza")
   - Encuentra: Don Juan, La Pizzería, Napolitano
                ↓
5. JANDI se comunica con cada business_agent vía A2A:
   
   JANDI → Don Juan agent (http://localhost:10000/businesses/donjuan/agent):
   {
     "jsonrpc": "2.0",
     "method": "query",
     "params": {
       "query": "¿Pizza muzza grande? ¿Cuánto sale?",
       "user_zone": "Centro"
     }
   }
   
   Don Juan agent → JANDI:
   {
     "result": {
       "available": true,
       "product": "Pizza Muzza Grande",
       "price": 2500,
       "delivery_available": true,
       "estimated_time": "30-45 minutos"
     }
   }
   
   [Mismo proceso con La Pizzería y Napolitano]
                ↓
6. JANDI compara opciones según prioridad de María (ej: "price"):
   - Don Juan: $2500, 30-45min
   - La Pizzería: $2200, 45-60min ← Más barato
   - Napolitano: $2800, 20-30min
                ↓
7. JANDI recomienda a María:
   "Encontré 3 opciones. La Pizzería tiene la mejor opción por precio:
    $2200, llega en 45-60 minutos. ¿Te parece bien?"
                ↓
8. María: "Sí, pedir esa"
                ↓
9. JANDI → La Pizzería agent vía A2A:
   {
     "method": "create_order",
     "params": {
       "items": [{"product_id": "pizza_muzza_grande", "quantity": 1}],
       "delivery_zone": "Centro",
       "user_id": "maria"
     }
   }
                ↓
10. La Pizzería agent valida y procesa:
    - ✅ Zona cubierta
    - ✅ Negocio abierto
    - ✅ Stock disponible
    - ✅ Monto mínimo cumplido
    - Crea orden
                ↓
11. La Pizzería agent → JANDI:
    {
      "result": {
        "order_id": "ORD-20260127-1234",
        "status": "confirmed",
        "estimated_delivery": "45-60 minutos"
      }
    }
                ↓
12. JANDI confirma a María:
    "¡Listo! Tu pizza de La Pizzería llegará en 45-60 minutos a Centro.
     Número de orden: ORD-20260127-1234"
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

## 📊 Archivos Creados/Modificados

### business_agent (3 archivos modificados)

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `agent.py` | Renombrar función, eliminar user_profile | ~30 |
| `prompt.py` | Renombrar función, prompt de negocio | ~80 |
| `main.py` | Requerir business_id, crear business_agent | ~40 |

### jandi_agent (9 archivos nuevos)

| Archivo | Descripción | Líneas |
|---------|-------------|--------|
| `agent.py` | create_jandi_agent() | 68 |
| `prompt.py` | build_jandi_prompt() | 112 |
| `user_config_loader.py` | Carga user_profile desde DB | 148 |
| `tools/business_discovery.py` | search_businesses(), get_business_details() | 127 |
| `tools/a2a_client.py` | A2AClient, communicate_with_business() | 180 |
| `tools/__init__.py` | Exports | 25 |
| `main.py` | Servidor JANDI | 157 |
| `pyproject.toml` | Configuración del proyecto | 34 |
| `README.md` | Documentación | 180 |

**Total jandi_agent:** ~1,031 líneas

---

## 🏗️ Arquitectura Final

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIOS                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐                              │
│  │María │  │ Juan │  │ Ana  │                              │
│  └──────┘  └──────┘  └──────┘                              │
│     ↓          ↓         ↓                                   │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  JANDI AGENTS (User Agents)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ JANDI    │  │ JANDI    │  │ JANDI    │                 │
│  │ (María)  │  │ (Juan)   │  │ (Ana)    │                 │
│  │ :20000   │  │ :20001   │  │ :20002   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│  user_profile   user_profile   user_profile                 │
└─────────────────────────────────────────────────────────────┘
              ↓ A2A Protocol (JSON-RPC 2.0)
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS AGENTS                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ agent    │  │ agent    │  │ agent    │                 │
│  │ (Don     │  │ (La Piz) │  │ (Napo)   │                 │
│  │  Juan)   │  │          │  │          │                 │
│  │ :10000   │  │ :10001   │  │ :10002   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│  business_config business_config business_config            │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE DATABASE                                          │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ user_profiles   │  │ businesses      │                 │
│  │ - nickname      │  │ - business_name │                 │
│  │ - autonomy      │  │ - agent_card    │                 │
│  │ - priority      │  │ - business_config│                │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Diferencias Clave

| Aspecto | JANDI | business_agent |
|---------|-------|----------------|
| **Representa** | Usuario | Negocio |
| **Directorio** | `jandi_agent/` | `business_agent/` |
| **Función** | `create_jandi_agent()` | `create_business_agent()` |
| **Parámetros** | `user_id`, `user_profile` | `business_id`, `business_config` |
| **Configuración** | `user_profile` (preferencias) | `business_config` (políticas) |
| **Puerto base** | 20000+ | 10000+ |
| **Prompt** | "You represent María" | "You represent Don Juan Pizzas" |
| **Herramientas** | `search_businesses`, `communicate_with_business` | `validate_order`, `get_products` |
| **Conocimiento** | Multi-negocio (todos) | Mono-negocio (solo el suyo) |
| **Objetivo** | Ayudar al usuario | Servir al negocio |
| **Decisiones** | Por el usuario | Por el negocio |

---

## 📡 Comunicación A2A

### Protocolo JSON-RPC 2.0

**JANDI envía a business_agent:**
```json
{
  "jsonrpc": "2.0",
  "method": "query",
  "params": {
    "query": "¿Tienen pizza muzza grande?",
    "user_zone": "Centro"
  },
  "id": "uuid-123"
}
```

**business_agent responde a JANDI:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "available": true,
    "product": "Pizza Muzza Grande",
    "price": 2500,
    "currency": "ARS",
    "delivery_available": true,
    "estimated_time": "30-45 minutos"
  },
  "id": "uuid-123"
}
```

---

## ✅ Beneficios de la Arquitectura Correcta

### 1. Separación de Responsabilidades

- ✅ JANDI se enfoca en el usuario
- ✅ business_agent se enfoca en el negocio
- ✅ Cada uno tiene su propósito claro

### 2. Escalabilidad

- ✅ N usuarios → N instancias de JANDI
- ✅ M negocios → M instancias de business_agent
- ✅ Cada instancia es independiente

### 3. Personalización

- ✅ JANDI personalizado según preferencias del usuario
- ✅ business_agent personalizado según políticas del negocio
- ✅ No hay conflicto entre ambos

### 4. Comunicación Estándar

- ✅ A2A Protocol (JSON-RPC 2.0)
- ✅ Descubrimiento vía Agent Cards
- ✅ Compatible con otros agentes del ecosistema

### 5. Mantenibilidad

- ✅ Código separado por tipo de agente
- ✅ Fácil agregar nuevas herramientas a cada uno
- ✅ Testing independiente

---

## 🧪 Testing

### Test 1: Iniciar business_agent

```bash
# Terminal 1
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/business_agent
python -m business_agent.main --business-id test_business_id

# Verificar que se inicia correctamente
# Verificar logs: "Business agent running at: http://localhost:10000"
# Verificar: "Business: [nombre del negocio]"
```

### Test 2: Iniciar JANDI

```bash
# Terminal 2
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/jandi_agent
python -m jandi_agent.main --user-id test_user_id

# Verificar que se inicia correctamente
# Verificar logs: "JANDI agent running at: http://localhost:20000"
# Verificar: "User: [nickname del usuario]"
```

### Test 3: Comunicación A2A

```bash
# Terminal 3
# Probar que JANDI puede comunicarse con business_agent

# 1. Obtener Agent Card del negocio
curl http://localhost:10000/.well-known/agent.json

# 2. Enviar mensaje desde JANDI (simulado)
curl -X POST http://localhost:10000/businesses/test_business_id/agent \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "query",
    "params": {"query": "¿Qué productos tienen?"},
    "id": "test-123"
  }'
```

---

## 📋 Próximos Pasos

### Inmediatos

1. **Instalar jandi_agent**
   ```bash
   cd jandi_agent
   pip install -e .
   ```

2. **Copiar .env**
   ```bash
   cp .env.example .env
   # Configurar variables
   ```

3. **Testing manual**
   - Iniciar un business_agent
   - Iniciar un JANDI
   - Verificar comunicación A2A

### Siguientes Fases

4. **Integrar con chat-client**
   - Conectar frontend con JANDI del usuario
   - Routing de mensajes

5. **Service Discovery**
   - Registry de business_agents
   - Lookup dinámico de URLs

6. **Orquestación**
   - Process manager para múltiples agentes
   - Health checks
   - Auto-restart

---

## 📚 Documentación Creada

1. **ANALISIS_CORRECCION_ARQUITECTURA.md** - Análisis del problema
2. **CORRECCION_ARQUITECTURA_APLICADA.md** - Este documento
3. **jandi_agent/README.md** - Documentación de JANDI

---

## ✅ Checklist Final

### business_agent
- [x] Renombrar create_jandi_agent → create_business_agent
- [x] Renombrar build_jandi_system_prompt → build_business_agent_prompt
- [x] Eliminar dependencia de user_profile
- [x] Hacer business_id requerido en main.py
- [x] Actualizar prompt para representar al negocio
- [x] Endpoint /.well-known/agent.json dinámico

### jandi_agent
- [x] Crear estructura de directorios
- [x] Crear agent.py con create_jandi_agent
- [x] Crear prompt.py con build_jandi_prompt
- [x] Crear user_config_loader.py
- [x] Crear tools/business_discovery.py
- [x] Crear tools/a2a_client.py
- [x] Crear main.py con --user-id requerido
- [x] Crear pyproject.toml
- [x] Crear README.md

---

## 🎉 Conclusión

✅ **Arquitectura correcta implementada exitosamente**

Se separaron correctamente los dos tipos de agentes:
- **JANDI**: Agente personal del usuario (uno por usuario)
- **business_agent**: Agente del negocio (uno por negocio)

Ahora la comunicación es estándar vía A2A Protocol, permitiendo:
- Escalabilidad a N usuarios y M negocios
- Personalización independiente de cada agente
- Comparación de múltiples negocios
- Decisiones basadas en preferencias del usuario

**Total de código:**
- business_agent modificado: ~150 líneas
- jandi_agent nuevo: ~1,031 líneas
- **Total: ~1,181 líneas**

**Archivos:**
- Modificados: 3
- Nuevos: 9
- **Total: 12**

**Estado:** ✅ Listo para testing e integración con chat-client 🚀
