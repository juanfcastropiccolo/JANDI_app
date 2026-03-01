# Arquitectura Final: Ecosistema JANDI

## Fecha
27 de Enero, 2026

---

## 🏗️ Visión General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ECOSISTEMA JANDI                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  CAPA DE USUARIOS (Frontend)                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │    │
│  │  │  María   │  │   Juan   │  │   Ana    │                │    │
│  │  │  (Web)   │  │  (Web)   │  │  (Web)   │                │    │
│  │  └──────────┘  └──────────┘  └──────────┘                │    │
│  └────────────────────────────────────────────────────────────┘    │
│         ↓              ↓              ↓                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  CAPA DE AGENTES DE USUARIO (JANDI)                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │    │
│  │  │  JANDI   │  │  JANDI   │  │  JANDI   │                │    │
│  │  │ (María)  │  │  (Juan)  │  │  (Ana)   │                │    │
│  │  │ :20000   │  │ :20001   │  │ :20002   │                │    │
│  │  └──────────┘  └──────────┘  └──────────┘                │    │
│  │  user_profile  user_profile  user_profile                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│         ↓              ↓              ↓                              │
│         └──────────────┴──────────────┘                             │
│                        ↓                                             │
│              A2A Protocol (JSON-RPC 2.0)                            │
│                        ↓                                             │
│         ┌──────────────┴──────────────┐                             │
│         ↓              ↓              ↓                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  CAPA DE AGENTES DE NEGOCIO (business_agent)              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │    │
│  │  │  agent   │  │  agent   │  │  agent   │                │    │
│  │  │  (Don    │  │  (La     │  │  (Napo)  │  ...           │    │
│  │  │  Juan)   │  │  Piz)    │  │          │                │    │
│  │  │ :10000   │  │ :10001   │  │ :10002   │                │    │
│  │  └──────────┘  └──────────┘  └──────────┘                │    │
│  │  business_config business_config business_config          │    │
│  └────────────────────────────────────────────────────────────┘    │
│         ↓              ↓              ↓                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  SUPABASE DATABASE                                         │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                │    │
│  │  │ user_profiles   │  │ businesses      │                │    │
│  │  │ ┌─────────────┐ │  │ ┌─────────────┐ │                │    │
│  │  │ │ María       │ │  │ │ Don Juan    │ │                │    │
│  │  │ │ Juan        │ │  │ │ La Pizzería │ │                │    │
│  │  │ │ Ana         │ │  │ │ Napolitano  │ │                │    │
│  │  │ └─────────────┘ │  │ └─────────────┘ │                │    │
│  │  └─────────────────┘  └─────────────────┘                │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                │    │
│  │  │ orders          │  │ products        │                │    │
│  │  └─────────────────┘  └─────────────────┘                │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Roles de Cada Agente

### JANDI (Agente del Usuario)

**Identidad:**
- "Soy el asistente personal de María"
- Representa al USUARIO

**Responsabilidades:**
- Buscar productos en TODOS los negocios
- Comunicarse con múltiples business_agents
- Comparar opciones según preferencias del usuario
- Recomendar la mejor opción
- Realizar pedidos en nombre del usuario

**Herramientas:**
- `search_businesses()` - Buscar negocios
- `communicate_with_business()` - Hablar con business_agents vía A2A
- `place_order_via_business()` - Hacer pedidos

**Configuración:**
- `user_profile` (nickname, autonomy, priority, limits)

**Ejemplo de conversación:**
```
María: "Quiero pedir pizza"
JANDI: "Busqué 3 pizzerías. Según tu preferencia de precio, 
        La Pizzería tiene la mejor opción: $2200, 45-60 min.
        ¿Te parece bien?"
```

---

### business_agent (Agente del Negocio)

**Identidad:**
- "Soy el asistente virtual de Don Juan Pizzas"
- Representa al NEGOCIO

**Responsabilidades:**
- Responder consultas sobre SU negocio
- Mostrar productos de SU catálogo
- Validar pedidos según SUS políticas
- Gestionar órdenes para SU negocio
- Proteger los intereses de SU negocio

**Herramientas:**
- `search_shopping_catalog()` - Buscar en SU catálogo
- `validate_order()` - Validar según SUS políticas
- `create_order()` - Crear orden en SU sistema

**Configuración:**
- `business_config` (horarios, zonas, políticas, pagos)

**Ejemplo de conversación:**
```
JANDI: "¿Tienen pizza muzza grande?"
Don Juan agent: "Sí, tenemos Pizza Muzza Grande a $2500.
                 Delivery disponible a Centro en 30-45 minutos."
```

---

## 🔄 Flujo de Interacción Completo

### Caso de Uso: María pide pizza a Centro

```
┌─────────────────────────────────────────────────────────────┐
│  1. María abre JANDI app                                    │
│     chat-client conecta con JANDI agent (puerto 20000)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. María: "Quiero pedir pizza a Centro"                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. JANDI (agente de María):                                │
│     search_businesses(category="restaurant", keyword="pizza")│
│                                                              │
│     Encuentra en Supabase:                                  │
│     - Don Juan Pizzas (id: abc123)                          │
│     - La Pizzería (id: def456)                              │
│     - Napolitano (id: ghi789)                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. JANDI se comunica con cada business_agent vía A2A:     │
│                                                              │
│     JANDI → Don Juan agent (localhost:10000):               │
│     POST /a2a                                               │
│     {                                                        │
│       "method": "query",                                    │
│       "params": {                                           │
│         "query": "¿Pizza muzza grande? ¿Precio? ¿Delivery a Centro?",
│         "user_zone": "Centro"                               │
│       }                                                      │
│     }                                                        │
│                                                              │
│     Don Juan agent responde:                                │
│     {                                                        │
│       "result": {                                           │
│         "available": true,                                  │
│         "product": "Pizza Muzza Grande",                    │
│         "price": 2500,                                      │
│         "delivery_to_centro": true,                         │
│         "estimated_time": "30-45 minutos"                   │
│       }                                                      │
│     }                                                        │
│                                                              │
│     [Mismo proceso con La Pizzería y Napolitano]           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. JANDI compara opciones:                                 │
│                                                              │
│     Don Juan:     $2500, 30-45min, ⭐⭐⭐⭐⭐               │
│     La Pizzería:  $2200, 45-60min, ⭐⭐⭐⭐                 │
│     Napolitano:   $2800, 20-30min, ⭐⭐⭐⭐⭐               │
│                                                              │
│     Según prioridad de María (priority="price"):           │
│     → La Pizzería es la mejor opción                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. JANDI recomienda a María:                               │
│     "Encontré 3 opciones. La Pizzería tiene el mejor       │
│      precio: $2200, llega en 45-60 minutos.                │
│      ¿Querés que haga el pedido?"                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. María: "Sí, hacer pedido"                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  8. JANDI → La Pizzería agent vía A2A:                      │
│     POST /a2a                                               │
│     {                                                        │
│       "method": "create_order",                             │
│       "params": {                                           │
│         "items": [{"product_id": "...", "quantity": 1}],   │
│         "delivery_zone": "Centro",                          │
│         "user_id": "maria",                                 │
│         "payment_method": "card"                            │
│       }                                                      │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  9. La Pizzería agent valida:                               │
│     ✅ Centro está en delivery_zones                        │
│     ✅ Negocio está abierto (check_opening_hours)           │
│     ✅ Stock disponible                                      │
│     ✅ Monto cumple minimum_order ($2200 >= $1000)          │
│     ✅ Acepta tarjeta (payment_methods_supported)           │
│                                                              │
│     Crea orden en Supabase:                                 │
│     INSERT INTO orders (business_id, user_id, ...)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  10. La Pizzería agent → JANDI:                             │
│      {                                                       │
│        "result": {                                          │
│          "order_id": "ORD-20260127-5678",                   │
│          "status": "confirmed",                             │
│          "estimated_delivery": "45-60 minutos",             │
│          "total": 2200                                      │
│        }                                                     │
│      }                                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  11. JANDI confirma a María:                                │
│      "¡Listo! Tu pizza de La Pizzería llegará en 45-60     │
│       minutos a Centro. Número de orden: ORD-20260127-5678" │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura de Archivos

```
JANDI_app/
├── business_agent/                    ← Agentes de NEGOCIOS
│   ├── src/
│   │   └── business_agent/
│   │       ├── agent.py              # create_business_agent()
│   │       ├── prompt.py             # build_business_agent_prompt()
│   │       ├── config_loader.py      # load_business_config()
│   │       ├── main.py               # --business-id (requerido)
│   │       └── tools/
│   │           ├── ucp_tools.py
│   │           └── business_validation_tools.py
│   └── pyproject.toml
│
├── jandi_agent/                       ← Agentes de USUARIOS (NUEVO)
│   ├── src/
│   │   └── jandi_agent/
│   │       ├── agent.py              # create_jandi_agent()
│   │       ├── prompt.py             # build_jandi_prompt()
│   │       ├── user_config_loader.py # load_user_profile()
│   │       ├── main.py               # --user-id (requerido)
│   │       └── tools/
│   │           ├── business_discovery.py  # search_businesses()
│   │           └── a2a_client.py          # communicate_with_business()
│   ├── pyproject.toml
│   ├── .env.example
│   └── README.md
│
├── chat-client/                       ← Frontend (React)
│   ├── components/
│   │   ├── Business/
│   │   │   ├── BusinessRegister.tsx  # Registro de negocios
│   │   │   └── steps/
│   │   │       └── UCPConfigStep.tsx # Configuración del negocio
│   │   └── Onboarding/
│   │       └── OnboardingContainer.tsx # Registro de usuarios
│   └── services/
│       ├── business-config.service.ts # Guarda config de negocios
│       └── user.service.ts            # Guarda config de usuarios (TODO)
│
└── sql_scripts/
    └── 2026_01_27_business_agent_config.sql
```

---

## 🎯 Responsabilidades por Componente

### JANDI (jandi_agent/)

**Representa:** Usuario  
**Configuración:** `user_profile`  
**Puerto:** 20000+  

**Herramientas:**
- ✅ `search_businesses()` - Buscar negocios
- ✅ `get_business_details()` - Detalles de un negocio
- ✅ `communicate_with_business()` - Enviar mensajes vía A2A
- ✅ `place_order_via_business()` - Hacer pedidos

**Prompt:**
```
You are JANDI, María's personal shopping assistant.
You represent María, NOT any business.
Help María find products across ALL businesses.
```

---

### business_agent (business_agent/)

**Representa:** Negocio  
**Configuración:** `business_config`  
**Puerto:** 10000+  

**Herramientas:**
- ✅ `search_shopping_catalog()` - Buscar en SU catálogo
- ✅ `validate_order()` - Validar según SUS políticas
- ✅ `create_order()` - Crear orden en SU sistema
- ✅ `validate_delivery_zone()` - Validar SUS zonas
- ✅ `check_opening_hours()` - Verificar SUS horarios

**Prompt:**
```
You are the virtual assistant of Don Juan Pizzas.
You represent Don Juan Pizzas, NOT the customer.
Answer questions about YOUR business.
Validate orders for YOUR business only.
```

---

## 🚀 Comandos de Inicio

### Iniciar business_agents

```bash
# Terminal 1: Don Juan Pizzas
cd business_agent
python -m business_agent.main \
  --host localhost \
  --port 10000 \
  --business-id donjuan_pizzas

# Terminal 2: La Pizzería
python -m business_agent.main \
  --host localhost \
  --port 10001 \
  --business-id la_pizzeria

# Terminal 3: Napolitano
python -m business_agent.main \
  --host localhost \
  --port 10002 \
  --business-id napolitano
```

### Iniciar JANDI agents

```bash
# Terminal 4: JANDI de María
cd jandi_agent
python -m jandi_agent.main \
  --host localhost \
  --port 20000 \
  --user-id user_maria

# Terminal 5: JANDI de Juan
python -m jandi_agent.main \
  --host localhost \
  --port 20001 \
  --user-id user_juan
```

---

## 📡 Endpoints

### business_agent

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/.well-known/agent.json` | GET | Agent Card del negocio |
| `/.well-known/ucp` | GET | UCP Profile del negocio |
| `/a2a` | POST | Endpoint A2A (JSON-RPC) |

**Ejemplo:**
```bash
curl http://localhost:10000/.well-known/agent.json
```

### JANDI

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/.well-known/agent.json` | GET | Agent Card de JANDI |
| `/profile` | GET | Perfil del usuario |
| `/a2a` | POST | Endpoint A2A (JSON-RPC) |

**Ejemplo:**
```bash
curl http://localhost:20000/profile
```

---

## 🎨 Comunicación A2A

### Mensaje de JANDI a business_agent

**Request:**
```json
POST http://localhost:10000/a2a

{
  "jsonrpc": "2.0",
  "method": "query",
  "params": {
    "query": "¿Tienen pizza muzza grande? ¿Cuánto sale?",
    "user_zone": "Centro"
  },
  "id": "msg-uuid-123"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "available": true,
    "product": "Pizza Muzza Grande",
    "price": 2500,
    "currency": "ARS",
    "delivery_available": true,
    "delivery_zone_valid": true,
    "estimated_time": "30-45 minutos",
    "business_open": true
  },
  "id": "msg-uuid-123"
}
```

---

## 📊 Comparación Final

| Aspecto | JANDI | business_agent |
|---------|-------|----------------|
| **Propósito** | Asistente del usuario | Asistente del negocio |
| **Representa** | Usuario (María) | Negocio (Don Juan) |
| **Cantidad** | 1 por usuario | 1 por negocio |
| **Configuración** | user_profile | business_config |
| **Puerto** | 20000+ | 10000+ |
| **Directorio** | `jandi_agent/` | `business_agent/` |
| **Función** | `create_jandi_agent()` | `create_business_agent()` |
| **Prompt** | "You represent María" | "You represent Don Juan Pizzas" |
| **Herramientas** | search_businesses, communicate | validate_order, get_products |
| **Conocimiento** | Multi-negocio (todos) | Mono-negocio (solo el suyo) |
| **Decisiones** | Por el usuario | Por el negocio |
| **Objetivo** | Ayudar al usuario | Servir al negocio |
| **Comunicación** | Envía mensajes A2A | Recibe mensajes A2A |

---

## ✅ Checklist de Implementación

### business_agent (Modificado)
- [x] Renombrar create_jandi_agent → create_business_agent
- [x] Renombrar build_jandi_system_prompt → build_business_agent_prompt
- [x] Eliminar dependencia de user_profile
- [x] Hacer business_id requerido
- [x] Actualizar prompt para representar al negocio
- [x] Actualizar main.py

### jandi_agent (Creado)
- [x] Crear estructura de directorios
- [x] Crear agent.py con create_jandi_agent
- [x] Crear prompt.py con build_jandi_prompt
- [x] Crear user_config_loader.py
- [x] Crear tools/business_discovery.py
- [x] Crear tools/a2a_client.py
- [x] Crear main.py con --user-id requerido
- [x] Crear pyproject.toml
- [x] Crear README.md
- [x] Crear .env.example

### Documentación
- [x] ANALISIS_CORRECCION_ARQUITECTURA.md
- [x] CORRECCION_ARQUITECTURA_APLICADA.md
- [x] START_AGENTS.md
- [x] ARQUITECTURA_FINAL.md (este documento)

---

## 🎉 Conclusión

✅ **Arquitectura correcta implementada exitosamente**

### Lo que se logró:

**Separación clara:**
- JANDI representa al usuario
- business_agent representa al negocio

**Comunicación estándar:**
- A2A Protocol (JSON-RPC 2.0)
- Descubrimiento vía Agent Cards

**Escalabilidad:**
- N usuarios → N instancias de JANDI
- M negocios → M instancias de business_agent

**Personalización:**
- JANDI según preferencias del usuario
- business_agent según políticas del negocio

### Métricas:

**Archivos modificados:** 3 (business_agent)  
**Archivos nuevos:** 9 (jandi_agent)  
**Total:** 12 archivos  
**Líneas de código:** ~1,181  

### Estado:

✅ Arquitectura correcta  
✅ Código implementado  
✅ Documentación completa  
⏳ Pendiente: Testing e integración con chat-client  

**¡El ecosistema JANDI está listo! 🚀🎉**
