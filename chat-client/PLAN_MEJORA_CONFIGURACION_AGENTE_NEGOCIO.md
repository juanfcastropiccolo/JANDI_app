# Plan de Mejora: Configuración Completa del Agente de Negocio

## Fecha
27 de Enero, 2026

---

## ✅ Validación con Especificaciones Oficiales

> **Última revisión:** 27 de Enero, 2026  
> **Especificaciones validadas:**
> - Google A2A Protocol v0.2.1 (https://google.github.io/A2A/specification/)
> - Google ADK (Agent Development Kit) (https://google.github.io/adk-docs/)
> - UCP.dev (Universal Commerce Protocol)

### Cambios realizados tras validación:

| Aspecto | Estado Original | Corrección Aplicada |
|---------|-----------------|---------------------|
| **Agent Card** | Estructura personalizada mezclada con A2A | ✅ Separado en 3 archivos: Agent Card A2A (estándar), Business Config (interno), UCP Profile (comercio) |
| **Skills** | No definidos | ✅ Agregados skills según spec A2A: `id`, `name`, `description`, `tags`, `examples` |
| **Capabilities A2A** | Mezcladas con UCP | ✅ Separadas: `capabilities` A2A (streaming, pushNotifications) vs `capabilities` UCP (checkout, fulfillment) |
| **defaultInputModes** | Faltante | ✅ Agregado: `["text/plain", "application/json"]` |
| **defaultOutputModes** | Faltante | ✅ Agregado: `["text/plain", "application/json"]` |
| **Provider** | Campos custom | ✅ Corregido a spec A2A: `organization`, `url` |
| **Security** | No definido | ✅ Agregado `securitySchemes` y `security` |
| **ADK Integration** | No documentada | ✅ Agregada sección de integración con ADK y `to_a2a()` |

### Arquitectura validada:

```
Frontend (Negocio) → BusinessConfiguration
                            ↓
                     Mapper Service
                            ↓
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
        Agent Card    Business       UCP Profile
         (A2A)        Config         (Commerce)
              ↓             ↓             ↓
              └─────────────┼─────────────┘
                            ↓
                     Business Agent
                     (ADK + A2A Server)
```

---

## Contexto y Visión

### Problema Actual
El paso 5 "Configuración UCP" actualmente es **solo informativo**: muestra qué es UCP y qué capacidades están habilitadas, pero no recolecta ningún dato crítico del negocio.

### Visión Estratégica
**Para el negocio (Frontend):**
- Interfaz simple con botones, selects, y campos claros
- Lenguaje de negocio, NO técnico
- "Panel de administración", "configuración de tu tienda", etc.
- **NUNCA mencionar UCP, agentes, capabilities, o términos técnicos**

**Por detrás (Backend):**
- Toda la configuración se mapea automáticamente a:
  - Configuración del agente del negocio (basado en UCP)
  - Agent Card (tarjeta de descubrimiento)
  - Capabilities y extensions A2A
  - Políticas comerciales
  - Métodos de entrega y pago
- **Un agente por negocio**, viviendo en la infraestructura de JANDI
- El agente responde en nombre del negocio según su configuración

### Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Negocio)                        │
│  "Configuración de tu tienda" - Lenguaje simple             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📋 Secciones del formulario:                               │
│  1. Identidad y alcance                                     │
│  2. Operación y entrega                                     │
│  3. Métodos de pago                                         │
│  4. Políticas comerciales                                   │
│  5. Gestión de catálogo                                     │
│  6. Contacto empresarial                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Mapeo automático
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Agente UCP)                       │
│  Infraestructura JANDI - Un agente por negocio              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🤖 Configuración del agente:                               │
│  • Agent Card (discovery)                                   │
│  • UCP Profile                                              │
│  • Capabilities: checkout, fulfillment, order               │
│  • Extensions: payment, delivery, policies                  │
│  • Prompt personalizado (identidad + políticas)             │
│  • Herramientas del agente (tools)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  El agente responde
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 JANDI (Consumidores)                         │
│  Usuarios interactúan con agente del negocio                │
└─────────────────────────────────────────────────────────────┘
```

---

## Campos a Recolectar (Organizados por Sección)

### 🏢 SECCIÓN 1: Identidad y Alcance

**Título visible:** "Información de tu negocio"  
**Subtítulo:** "Ayudanos a identificar tu negocio y dónde operás"

#### Campos:

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Nombre legal** | Input text | ✅ | "Razón social registrada de tu negocio (ej: 'Pizzería Don Juan S.R.L.')" | `business_legal_name` → agent identity |
| **Nombre comercial** | Input text | ✅ | "Nombre que verán tus clientes (ej: 'Don Juan Pizzas')" | `business_display_name` → agent name |
| **Categoría** | Select | ✅ | "Tipo de negocio (ayuda a los clientes a encontrarte)" | `business_category` → agent discovery tags |
| **País** | Select | ✅ | "País donde opera tu negocio" | `country` → agent location |
| **Ciudad principal** | Input text | ✅ | "Ciudad donde está ubicado tu local principal" | `city` → agent primary location |
| **Regiones de operación** | Multi-select / Chips | ✅ | "Barrios o zonas donde realizás entregas (ej: 'Palermo', 'Recoleta')" | `operating_regions[]` → agent service area |

**Opciones de Categoría:**
- Restaurante / Comidas
- Supermercado / Almacén
- Farmacia
- Tienda de ropa
- Electrónica
- Librería / Papelería
- Floristería
- Panadería / Pastelería
- Otro

---

### 🚚 SECCIÓN 2: Operación y Entrega

**Título visible:** "Configuración de entregas y horarios"  
**Subtítulo:** "Definí cómo y cuándo podés atender a tus clientes"

#### 2.1. Horarios de Atención

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Horarios por día** | Time pickers + Checkboxes | ✅ | "Horarios en que tu negocio está abierto para recibir pedidos" | `opening_hours{}` → agent availability |

**Formato:**
```
Lunes:    [✓] [09:00] a [22:00]
Martes:   [✓] [09:00] a [22:00]
...
Domingo:  [ ] Cerrado
```

#### 2.2. Métodos de Entrega

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **¿Ofrecés delivery?** | Toggle | ✅ | "Enviás pedidos a domicilio del cliente" | `delivery_methods.delivery` → capability fulfillment |
| **Zonas de delivery** | Multi-input | Condicional | "Barrios o zonas donde hacés delivery (ej: 'Centro', 'Villa Carlos Paz')" | `delivery_zones[]` → agent service coverage |
| **Tiempo estimado** | Number + Select | Condicional | "Tiempo promedio de entrega a domicilio" | `estimated_delivery_time` → agent promise |
| **¿Ofrecés retiro en local?** | Toggle | ✅ | "Los clientes pueden retirar sus pedidos en tu negocio" | `delivery_methods.pickup` → capability pickup |
| **Tiempo de preparación** | Number + Select | Condicional | "Tiempo que tardás en tener el pedido listo para retiro" | `pickup_preparation_time` → agent promise |

**Tiempo estimado - Opciones:**
- 15-30 minutos
- 30-45 minutos
- 45-60 minutos
- 1-2 horas
- Más de 2 horas

---

### 💳 SECCIÓN 3: Métodos de Pago

**Título visible:** "Formas de pago que aceptás"  
**Subtítulo:** "Indicá cómo pueden pagarte tus clientes"

#### 3.1. Métodos Aceptados

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Efectivo** | Checkbox | ❌ | "Aceptás pago en efectivo (contra entrega o en local)" | `payment_methods.cash` → payment handler |
| **Tarjeta (débito/crédito)** | Checkbox | ❌ | "Aceptás pagos con tarjeta" | `payment_methods.card` → payment handler |
| **Mercado Pago** | Checkbox | ❌ | "Aceptás pagos con Mercado Pago / billeteras digitales" | `payment_methods.wallet.mp` → payment handler |
| **Otro método** | Input text | ❌ | "Otro método de pago que aceptás (especificá cuál)" | `payment_methods.other` |

**Validación:** Al menos 1 método debe estar seleccionado.

#### 3.2. Momento de Pago

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **¿Cuándo cobras?** | Radio buttons | ✅ | "Momento en que el cliente realiza el pago" | `payment_timing` → agent payment flow |

**Opciones:**
- ◉ Al realizar el pedido (online)
- ◉ Al recibir/retirar el pedido
- ◉ Ambas opciones disponibles

---

### 📜 SECCIÓN 4: Políticas Comerciales

**Título visible:** "Políticas de tu negocio"  
**Subtítulo:** "Definí las reglas para devoluciones, cancelaciones y pedidos"

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Política de devoluciones** | Textarea | ✅ | "Explicá en qué casos aceptás devoluciones (ej: 'Aceptamos devoluciones hasta 24hs después si el producto tiene defectos')" | `return_policy` → agent policy rules |
| **Política de reembolsos** | Textarea | ✅ | "Explicá cómo y cuándo devolvés el dinero (ej: 'Reembolso completo en 5-7 días hábiles')" | `refund_policy` → agent policy rules |
| **Ventana de cancelación** | Number + Select | ✅ | "¿Hasta cuándo puede el cliente cancelar sin costo?" | `cancellation_window` → agent decision rules |
| **Monto mínimo de pedido** | Number | ❌ | "Monto mínimo para realizar un pedido (dejar en 0 si no hay mínimo)" | `minimum_order_amount` → agent validation |

**Ventana de cancelación - Opciones:**
- Hasta 5 minutos después
- Hasta 15 minutos después
- Hasta 30 minutos después
- Hasta 1 hora después
- No se permiten cancelaciones

---

### 📦 SECCIÓN 5: Gestión de Catálogo

**Título visible:** "Cómo gestionás tu catálogo"  
**Subtítulo:** "Elegí cómo vas a actualizar tus productos y precios"

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Método de carga** | Radio buttons | ✅ | "Elegí cómo vas a mantener actualizado tu catálogo de productos" | `catalog_source_type` → agent sync method |
| **Moneda** | Select | ✅ | "Moneda en que están tus precios" | `price_currency` → agent pricing |

**Opciones de método de carga:**
- ◉ Manual (desde el panel web de JANDI)
- ◉ Archivo CSV (subirás un archivo cada vez que actualices)
- ◉ Integración API (próximamente - te contactaremos)

**Moneda - Opciones:**
- ARS (Peso argentino)
- USD (Dólar estadounidense)
- EUR (Euro)
- Otra (especificar)

---

### 📞 SECCIÓN 6: Contacto Empresarial

**Título visible:** "Datos de contacto"  
**Subtítulo:** "Información para que JANDI pueda comunicarse contigo"

| Campo Frontend | Tipo | Obligatorio | Tooltip | Mapeo Backend |
|----------------|------|-------------|---------|---------------|
| **Email empresarial** | Input email | ✅ | "Email para notificaciones y soporte de JANDI (no visible para clientes)" | `business_contact_email` → ops contact |
| **Teléfono de contacto** | Input tel | ✅ | "Teléfono para contacto directo con JANDI (no visible para clientes)" | `business_contact_phone` → ops contact |
| **Responsable** | Input text | ✅ | "Nombre de la persona responsable del negocio" | `responsible_person_name` → ops contact |

**Nota informativa:**
> 🔒 Estos datos son solo para uso interno de JANDI. Los clientes verán la información de contacto que configuraste en el paso 1 (Info Básica).

---

## Mapeo Técnico: Frontend → Backend (Agente A2A/UCP)

> ⚠️ **IMPORTANTE: Alineación con Especificación A2A (v0.2.1)**
> 
> Este plan está alineado con la especificación oficial del protocolo Agent2Agent (A2A) de Google.
> Referencia: https://google.github.io/A2A/specification/
>
> Se distinguen **tres niveles de configuración**:
> 1. **Agent Card (A2A estándar)**: Para discovery inter-agentes, sigue la spec A2A
> 2. **Business Configuration**: Datos internos del negocio para el agente JANDI
> 3. **UCP Extensions**: Configuración de comercio según UCP.dev

---

### 1. Agent Card (Estándar A2A v0.2.1)

El Agent Card es el documento JSON que describe el agente para discovery según la especificación A2A.
**Ubicación recomendada:** `https://agents.jandi.app/{business_id}/.well-known/agent.json`

**Datos del frontend:**
```typescript
{
  business_legal_name: "Pizzería Don Juan S.R.L.",
  business_display_name: "Don Juan Pizzas",
  business_category: "restaurant",
  country: "Argentina",
  city: "Córdoba",
  operating_regions: ["Centro", "Nueva Córdoba", "Cerro de las Rosas"]
}
```

**Mapeo a Agent Card (siguiendo spec A2A oficial):**
```json
{
  "name": "Don Juan Pizzas",
  "description": "Asistente virtual de Don Juan Pizzas, pizzería ubicada en Córdoba, Argentina. Realiza pedidos, consulta el menú y conoce nuestras promociones. Delivery disponible en Centro, Nueva Córdoba y Cerro de las Rosas.",
  "url": "https://agents.jandi.app/donjuan_pizzas/a2a",
  "provider": {
    "organization": "Pizzería Don Juan S.R.L.",
    "url": "https://jandi.app/negocios/donjuan_pizzas"
  },
  "version": "1.0.0",
  "documentationUrl": "https://jandi.app/docs/agents/donjuan_pizzas",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "stateTransitionHistory": false
  },
  "securitySchemes": {
    "jandi_auth": {
      "type": "http",
      "scheme": "bearer",
      "bearerFormat": "JWT"
    }
  },
  "security": [{ "jandi_auth": [] }],
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "browse-menu",
      "name": "Ver Menú",
      "description": "Muestra el catálogo de productos disponibles con precios y descripciones",
      "tags": ["menu", "catalogo", "productos", "pizza", "comida"],
      "examples": [
        "¿Qué pizzas tienen?",
        "Mostrame el menú",
        "¿Cuánto sale una pizza grande?"
      ]
    },
    {
      "id": "place-order",
      "name": "Realizar Pedido",
      "description": "Permite al cliente realizar un pedido de productos para delivery o retiro en local",
      "tags": ["pedido", "orden", "compra", "delivery", "retiro"],
      "examples": [
        "Quiero pedir una pizza grande de muzzarella",
        "Hacé un pedido para delivery a Nueva Córdoba",
        "Quiero retirar en el local"
      ]
    },
    {
      "id": "check-delivery",
      "name": "Consultar Delivery",
      "description": "Informa sobre zonas de entrega, tiempos estimados y costos de envío",
      "tags": ["delivery", "envio", "zona", "tiempo", "costo"],
      "examples": [
        "¿Hacen delivery a Cerro de las Rosas?",
        "¿Cuánto tardan en entregar?",
        "¿Cuál es el costo de envío?"
      ]
    },
    {
      "id": "check-hours",
      "name": "Horarios de Atención",
      "description": "Informa los horarios de atención del local",
      "tags": ["horario", "abierto", "cerrado", "atencion"],
      "examples": [
        "¿Están abiertos ahora?",
        "¿Hasta qué hora atienden?",
        "¿Abren los domingos?"
      ]
    },
    {
      "id": "payment-info",
      "name": "Métodos de Pago",
      "description": "Informa sobre los métodos de pago aceptados",
      "tags": ["pago", "efectivo", "tarjeta", "mercadopago"],
      "examples": [
        "¿Puedo pagar con tarjeta?",
        "¿Aceptan Mercado Pago?",
        "¿Puedo pagar en efectivo?"
      ]
    },
    {
      "id": "policies",
      "name": "Políticas del Negocio",
      "description": "Informa sobre políticas de devolución, cancelación y reembolsos",
      "tags": ["politica", "devolucion", "cancelacion", "reembolso"],
      "examples": [
        "¿Puedo cancelar mi pedido?",
        "¿Cuál es la política de devoluciones?",
        "¿Hay monto mínimo de pedido?"
      ]
    }
  ],
  "supportsAuthenticatedExtendedCard": true
}
```

**Notas sobre el Agent Card A2A:**
- ✅ `name`: Nombre comercial del negocio (user-facing)
- ✅ `description`: Descripción completa con ubicación y servicios
- ✅ `url`: Endpoint A2A del agente (donde recibe JSON-RPC)
- ✅ `provider.organization`: Nombre legal del negocio
- ✅ `capabilities`: Streaming y push notifications habilitados
- ✅ `skills[]`: Cada skill mapea a una funcionalidad del negocio
- ✅ `defaultInputModes/defaultOutputModes`: MIME types soportados

**Generación dinámica de Skills basada en configuración:**

| Configuración del Negocio | Skill Generado | Condición |
|---------------------------|----------------|-----------|
| `deliveryMethods.delivery = true` | `check-delivery` | Siempre si tiene delivery |
| `deliveryMethods.pickup = true` | Info en `place-order` | Se menciona retiro en local |
| `payment_methods.*` | `payment-info` | Siempre presente |
| `opening_hours` | `check-hours` | Siempre presente |
| `policies.*` | `policies` | Siempre presente |
| `catalog.products.length > 0` | `browse-menu` | Siempre presente |

---

### 2. Business Configuration (Configuración Interna JANDI)

Esta configuración NO es parte del Agent Card A2A, sino que es la configuración interna que usa el agente JANDI para operar.

**Archivo:** `business_agent/data/business_config_{business_id}.json`

```json
{
  "businessId": "biz_donjuan_pizzas",
  "identity": {
    "legalName": "Pizzería Don Juan S.R.L.",
    "displayName": "Don Juan Pizzas",
    "category": "restaurant",
    "location": {
      "country": "AR",
      "city": "Córdoba",
      "address": "Av. Colón 1234"
    },
    "serviceAreas": ["Centro", "Nueva Córdoba", "Cerro de las Rosas"]
  },
  "operations": {
    "timezone": "America/Argentina/Cordoba",
    "schedule": {
      "monday": { "open": "09:00", "close": "22:00" },
      "tuesday": { "open": "09:00", "close": "22:00" },
      "wednesday": { "open": "09:00", "close": "22:00" },
      "thursday": { "open": "09:00", "close": "22:00" },
      "friday": { "open": "09:00", "close": "23:00" },
      "saturday": { "open": "10:00", "close": "23:00" },
      "sunday": { "closed": true }
    }
  },
  "fulfillment": {
    "delivery": {
      "enabled": true,
      "zones": ["Centro", "Nueva Córdoba", "Cerro de las Rosas"],
      "estimatedTime": { "min": 45, "max": 60, "unit": "minutes" },
      "fee": 500
    },
    "pickup": {
      "enabled": true,
      "preparationTime": { "value": 20, "unit": "minutes" }
    }
  },
  "payment": {
    "methods": ["cash", "card", "mercadopago"],
    "timing": "both",
    "currency": "ARS"
  },
  "policies": {
    "minimumOrder": 500,
    "cancellationWindow": 15,
    "returnPolicy": "Aceptamos devoluciones hasta 24hs si el producto tiene defectos",
    "refundPolicy": "Reembolso completo en 5-7 días hábiles"
  },
  "catalog": {
    "sourceType": "csv",
    "lastUpdated": "2026-01-27T10:30:00Z"
  },
  "opsContact": {
    "email": "admin@donjuanpizzas.com",
    "phone": "+54 351 9876543",
    "responsiblePerson": "Juan Pérez"
  },
  "metadata": {
    "createdAt": "2026-01-27T10:30:00Z",
    "updatedAt": "2026-01-27T10:30:00Z",
    "version": "1.0.0"
  }
}
```

**Mapeo a Prompt del Agente:**
```
Eres el asistente virtual de Don Juan Pizzas, una pizzería ubicada en Córdoba, Argentina.
Operas en las siguientes zonas: Centro, Nueva Córdoba, Cerro de las Rosas.
Tu objetivo es ayudar a los clientes a realizar pedidos de pizzas y otros productos de tu menú.

REGLAS CRÍTICAS:
- Solo acepta pedidos dentro de las zonas de cobertura
- Verifica que el negocio esté abierto según los horarios configurados
- El monto mínimo de pedido es $500 ARS
- El cliente puede cancelar hasta 15 minutos después de realizar el pedido
```

---

### 3. UCP Profile (Extensiones de Comercio)

El UCP Profile contiene las extensiones específicas de comercio según el estándar UCP.dev.

**Archivo:** `business_agent/data/ucp_profile_{business_id}.json`

---

### 4. Capabilities del Agente A2A (Basado en Delivery/Pickup)

**Escenario 1: Delivery ✅ + Pickup ✅**
```json
{
  "capabilities": [
    "dev.ucp.shopping.checkout",
    "dev.ucp.shopping.fulfillment.delivery",
    "dev.ucp.shopping.fulfillment.pickup",
    "dev.ucp.shopping.order"
  ]
}
```

**Escenario 2: Solo Pickup ✅**
```json
{
  "capabilities": [
    "dev.ucp.shopping.checkout",
    "dev.ucp.shopping.fulfillment.pickup",
    "dev.ucp.shopping.order"
  ]
}
```

**Escenario 3: Solo Delivery ✅**
```json
{
  "capabilities": [
    "dev.ucp.shopping.checkout",
    "dev.ucp.shopping.fulfillment.delivery",
    "dev.ucp.shopping.order"
  ]
}
```

---

### 3. Extension: Delivery Configuration

**Datos del frontend:**
```typescript
{
  delivery_methods: {
    delivery: true,
    pickup: true
  },
  delivery_zones: ["Centro", "Nueva Córdoba"],
  estimated_delivery_time: "45-60 minutos",
  pickup_preparation_time: "20 minutos"
}
```

**Mapeo a Extension A2A:**
```json
{
  "extensions": {
    "com.jandi.fulfillment": {
      "version": "2026-01-11",
      "config": {
        "methods": {
          "delivery": {
            "enabled": true,
            "zones": ["Centro", "Nueva Córdoba"],
            "estimatedTime": {
              "min": 45,
              "max": 60,
              "unit": "minutes"
            }
          },
          "pickup": {
            "enabled": true,
            "preparationTime": {
              "value": 20,
              "unit": "minutes"
            }
          }
        }
      }
    }
  }
}
```

**Mapeo a herramientas del agente:**
```python
# En business_agent/tools/
def validate_delivery_zone(zone: str) -> bool:
    """Valida si el agente puede entregar en la zona especificada"""
    allowed_zones = ["Centro", "Nueva Córdoba"]  # De config
    return zone in allowed_zones

def estimate_delivery_time() -> str:
    """Retorna el tiempo estimado de entrega"""
    return "45-60 minutos"  # De config
```

---

### 4. Extension: Payment Handlers

**Datos del frontend:**
```typescript
{
  payment_methods: {
    cash: true,
    card: true,
    wallet: { mp: true }
  },
  payment_timing: "both"  // "online" | "on-delivery" | "both"
}
```

**Mapeo a Payment Handlers UCP:**
```json
{
  "payment": {
    "handlers": [
      {
        "id": "jandi_cash",
        "name": "com.jandi.payment.cash",
        "version": "2026-01-11",
        "config": {
          "type": "CASH",
          "timing": ["on-delivery", "on-pickup"]
        }
      },
      {
        "id": "jandi_card",
        "name": "com.jandi.payment.card",
        "version": "2026-01-11",
        "config": {
          "type": "CARD",
          "timing": ["online", "on-delivery"],
          "tokenization": {
            "type": "PUSH",
            "endpoint": "https://api.jandi.app/v1/payments/tokenize"
          }
        }
      },
      {
        "id": "jandi_mp",
        "name": "com.jandi.payment.wallet.mercadopago",
        "version": "2026-01-11",
        "config": {
          "type": "WALLET",
          "provider": "mercadopago",
          "timing": ["online"]
        }
      }
    ]
  }
}
```

---

### 5. Extension: Business Policies

**Datos del frontend:**
```typescript
{
  return_policy: "Aceptamos devoluciones hasta 24hs si el producto tiene defectos",
  refund_policy: "Reembolso completo en 5-7 días hábiles",
  cancellation_window: 15,  // minutos
  minimum_order_amount: 500
}
```

**Mapeo a Extension A2A:**
```json
{
  "extensions": {
    "com.jandi.policies": {
      "version": "2026-01-11",
      "config": {
        "returns": {
          "enabled": true,
          "description": "Aceptamos devoluciones hasta 24hs si el producto tiene defectos",
          "window": {
            "value": 24,
            "unit": "hours"
          }
        },
        "refunds": {
          "enabled": true,
          "description": "Reembolso completo en 5-7 días hábiles",
          "processingTime": {
            "min": 5,
            "max": 7,
            "unit": "business_days"
          }
        },
        "cancellation": {
          "enabled": true,
          "window": {
            "value": 15,
            "unit": "minutes"
          }
        },
        "minimumOrder": {
          "amount": 500,
          "currency": "ARS"
        }
      }
    }
  }
}
```

**Mapeo a reglas del agente:**
```python
# En business_agent/prompt.py
BUSINESS_POLICIES = """
## Políticas comerciales que DEBES respetar:
1. Devoluciones: {return_policy}
2. Reembolsos: {refund_policy}
3. Cancelaciones: El cliente puede cancelar hasta {cancellation_window} minutos después de realizar el pedido.
4. Monto mínimo: El pedido debe ser de al menos ${minimum_order_amount}.

Si un cliente pregunta por estas políticas, responde con claridad y precisión.
Si un pedido no cumple con el monto mínimo, NO permitas que avance.
"""
```

---

### 6. Extension: Catalog Management

**Datos del frontend:**
```typescript
{
  catalog_source_type: "csv",  // "manual" | "csv" | "api"
  price_currency: "ARS"
}
```

**Mapeo a Extension A2A:**
```json
{
  "extensions": {
    "com.jandi.catalog": {
      "version": "2026-01-11",
      "config": {
        "sourceType": "csv",
        "syncFrequency": "manual",
        "pricing": {
          "currency": "ARS",
          "taxIncluded": true
        }
      }
    }
  }
}
```

**Impacto en el agente:**
- Si `manual`: El agente lee productos desde `business_agent/data/products.json`
- Si `csv`: El agente lee productos desde CSV subido por el negocio
- Si `api`: El agente consulta API externa del negocio (futuro)

---

### 7. Arquitectura Completa: 3 Archivos Generados

Al completar el registro, JANDI genera **3 archivos** para cada negocio:

#### 7.1. Agent Card A2A (Para Discovery)
**Archivo:** `/.well-known/agent.json` (servido en `https://agents.jandi.app/{business_id}/.well-known/agent.json`)

Este archivo sigue **exactamente** la especificación A2A v0.2.1 y permite que otros agentes o plataformas descubran y se comuniquen con el agente del negocio.

```json
{
  "name": "Don Juan Pizzas",
  "description": "Asistente virtual de Don Juan Pizzas, pizzería ubicada en Córdoba, Argentina. Realiza pedidos, consulta el menú y conoce nuestras promociones.",
  "url": "https://agents.jandi.app/donjuan_pizzas/a2a",
  "provider": {
    "organization": "Pizzería Don Juan S.R.L.",
    "url": "https://jandi.app/negocios/donjuan_pizzas"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "securitySchemes": {
    "jandi_auth": {
      "type": "http",
      "scheme": "bearer"
    }
  },
  "security": [{ "jandi_auth": [] }],
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "browse-menu",
      "name": "Ver Menú",
      "description": "Muestra el catálogo de productos disponibles",
      "tags": ["menu", "catalogo", "productos"]
    },
    {
      "id": "place-order",
      "name": "Realizar Pedido",
      "description": "Permite realizar un pedido para delivery o retiro",
      "tags": ["pedido", "orden", "compra"]
    }
  ]
}
```

#### 7.2. Business Configuration (Configuración Interna)
**Archivo:** `business_agent/data/configs/{business_id}.json`

Configuración interna del negocio usada por el agente JANDI. NO es pública.

```json
{
  "businessId": "biz_donjuan_pizzas",
  "identity": { ... },
  "operations": { ... },
  "fulfillment": { ... },
  "payment": { ... },
  "policies": { ... },
  "catalog": { ... },
  "opsContact": { ... }
}
```

#### 7.3. UCP Profile (Extensiones de Comercio)
**Archivo:** `business_agent/data/ucp_profiles/{business_id}.json`

Configuración UCP con capabilities y extensions para comercio electrónico.

```json
{
  "ucp": {
    "version": "2026-01-11",
    "services": {
      "dev.ucp.shopping": {
        "version": "2026-01-11",
        "endpoint": "https://agents.jandi.app/donjuan_pizzas/ucp"
      }
    },
    "capabilities": [
      "dev.ucp.shopping.checkout",
      "dev.ucp.shopping.fulfillment.delivery",
      "dev.ucp.shopping.fulfillment.pickup",
      "dev.ucp.shopping.order"
    ],
    "extensions": {
      "com.jandi.payment": {
        "handlers": ["cash", "card", "mercadopago"]
      },
      "com.jandi.fulfillment": {
        "delivery": { "enabled": true, "zones": [...] },
        "pickup": { "enabled": true }
      },
      "com.jandi.policies": {
        "minimumOrder": 500,
        "cancellationWindow": 15
      }
    }
  }
}
```

---

### 8. Relación entre Agent Card A2A y Configuración del Negocio

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Negocio completa)                          │
│                                                                              │
│   Sección 1: Identidad ──────────────────────┐                              │
│   Sección 2: Operación ────────────────────┐ │                              │
│   Sección 3: Pagos ──────────────────────┐ │ │                              │
│   Sección 4: Políticas ────────────────┐ │ │ │                              │
│   Sección 5: Catálogo ───────────────┐ │ │ │ │                              │
│   Sección 6: Contacto ─────────────┐ │ │ │ │ │                              │
│                                    │ │ │ │ │ │                              │
└────────────────────────────────────┼─┼─┼─┼─┼─┼──────────────────────────────┘
                                     │ │ │ │ │ │
                                     ▼ ▼ ▼ ▼ ▼ ▼
                            ┌────────────────────┐
                            │  JANDI Backend     │
                            │  Mapper Service    │
                            └────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Agent Card A2A    │  │ Business Config     │  │   UCP Profile       │
│   (Público)         │  │ (Interno)           │  │   (Interno)         │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ - name              │  │ - identity          │  │ - ucp.services      │
│ - description       │  │ - operations        │  │ - ucp.capabilities  │
│ - url               │  │ - fulfillment       │  │ - extensions        │
│ - provider          │  │ - payment           │  │   - payment         │
│ - capabilities      │  │ - policies          │  │   - fulfillment     │
│ - skills[]          │  │ - catalog           │  │   - policies        │
│ - security          │  │ - opsContact        │  │   - catalog         │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS AGENT                                     │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ A2A Server      │  │ Config Loader   │  │ UCP Handler     │             │
│  │ (JSON-RPC)      │  │ (Business Rules)│  │ (Commerce)      │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  El agente usa los 3 archivos para:                                         │
│  - Responder a discovery (Agent Card)                                       │
│  - Aplicar reglas de negocio (Business Config)                             │
│  - Procesar transacciones (UCP Profile)                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integración con Google ADK (Agent Development Kit)

### Compatibilidad con ADK

El plan está diseñado para ser **100% compatible** con Google ADK. Esto significa que:

1. **Agent Card estándar A2A**: El Agent Card generado sigue exactamente la especificación A2A v0.2.1
2. **Función `to_a2a()`**: Los agentes de negocio pueden exponerse via A2A usando la función `to_a2a()` de ADK

### Generación del Agent Card con ADK

ADK proporciona una función `to_a2a()` que genera automáticamente el Agent Card basándose en el agente.
Sin embargo, para JANDI necesitamos **personalizar** el Agent Card con información del negocio.

**Enfoque recomendado:**

```python
# business_agent/a2a_server.py
from google.adk import Agent
from google.adk.a2a import to_a2a, AgentCard, AgentSkill

def create_business_agent_card(business_config: dict) -> AgentCard:
    """
    Genera un Agent Card A2A personalizado basado en la configuración del negocio.
    """
    # Generar skills basados en las capabilities del negocio
    skills = []
    
    # Skill: Ver menú (siempre presente)
    skills.append(AgentSkill(
        id="browse-menu",
        name="Ver Menú",
        description=f"Muestra el catálogo de productos de {business_config['identity']['displayName']}",
        tags=["menu", "catalogo", "productos", business_config['identity']['category']]
    ))
    
    # Skill: Realizar pedido (siempre presente)
    order_description = "Permite realizar un pedido"
    if business_config['fulfillment']['delivery']['enabled']:
        order_description += " para delivery"
    if business_config['fulfillment']['pickup']['enabled']:
        order_description += " o retiro en local"
    
    skills.append(AgentSkill(
        id="place-order",
        name="Realizar Pedido",
        description=order_description,
        tags=["pedido", "orden", "compra"]
    ))
    
    # Skill: Delivery (si está habilitado)
    if business_config['fulfillment']['delivery']['enabled']:
        zones = ", ".join(business_config['fulfillment']['delivery']['zones'])
        skills.append(AgentSkill(
            id="check-delivery",
            name="Consultar Delivery",
            description=f"Delivery disponible en: {zones}",
            tags=["delivery", "envio", "zona"]
        ))
    
    # Crear Agent Card
    return AgentCard(
        name=business_config['identity']['displayName'],
        description=generate_description(business_config),
        url=f"https://agents.jandi.app/{business_config['businessId']}/a2a",
        provider={
            "organization": business_config['identity']['legalName'],
            "url": f"https://jandi.app/negocios/{business_config['businessId']}"
        },
        version="1.0.0",
        capabilities={
            "streaming": True,
            "pushNotifications": True
        },
        defaultInputModes=["text/plain", "application/json"],
        defaultOutputModes=["text/plain", "application/json"],
        skills=skills
    )
```

### Exposición vía A2A con ADK

```python
# business_agent/main.py
from google.adk.a2a import A2AServer

# Cargar configuración del negocio
business_config = load_business_config(business_id)

# Crear el agente
agent = BusinessAgent(business_config)

# Crear Agent Card personalizado
agent_card = create_business_agent_card(business_config)

# Crear servidor A2A con el Agent Card personalizado
a2a_server = A2AServer(
    agent=agent,
    agent_card=agent_card,  # Agent Card personalizado
    host="0.0.0.0",
    port=8080
)

# Iniciar servidor
a2a_server.run()
```

### Ventajas de usar ADK

| Característica | Beneficio |
|----------------|-----------|
| **Estándar A2A** | Interoperabilidad con otros agentes del ecosistema |
| **`to_a2a()`** | Generación automática del Agent Card base |
| **Streaming SSE** | Soporte nativo para respuestas en tiempo real |
| **Push Notifications** | Notificaciones asíncronas para tasks largas |
| **JSON-RPC 2.0** | Protocolo estándar y bien definido |
| **Discovery** | Well-known URI (`/.well-known/agent.json`) |

### Migración desde el agente actual

El `business_agent` actual usa `google-adk` pero no expone Agent Card A2A personalizado.
Para migrar:

1. **Crear `a2a_extensions/card_generator.py`**: Genera Agent Card desde config
2. **Modificar `main.py`**: Usar `A2AServer` con Agent Card personalizado
3. **Agregar endpoint `/.well-known/agent.json`**: Servir el Agent Card
4. **Actualizar `agent_card.json`**: Reemplazar por generación dinámica

---

## Diseño de la Interfaz (UCPConfigStep Nuevo)

### Estructura Visual

```
┌─────────────────────────────────────────────────────────┐
│          Configuración de tu negocio                     │
│  Completá la información para que podamos configurar     │
│  tu tienda y empezar a recibir pedidos                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🏢 1. Identidad y alcance                              │
│  ▼ [Expandido por defecto]                              │
│                                                          │
│  Nombre legal *         [?]                             │
│  [Pizzería Don Juan S.R.L._____________________]        │
│                                                          │
│  Nombre comercial *     [?]                             │
│  [Don Juan Pizzas__________________________]            │
│                                                          │
│  Categoría *            [?]                             │
│  [Restaurante / Comidas ▼]                              │
│                                                          │
│  País *                 [?]                             │
│  [Argentina ▼]                                          │
│                                                          │
│  Ciudad principal *     [?]                             │
│  [Córdoba___________________________________]           │
│                                                          │
│  Regiones de operación * [?]                            │
│  [Centro] [Nueva Córdoba] [+Agregar zona]               │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚚 2. Operación y entrega                              │
│  ▶ [Colapsado por defecto]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  💳 3. Métodos de pago                                  │
│  ▶ [Colapsado por defecto]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📜 4. Políticas comerciales                            │
│  ▶ [Colapsado por defecto]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📦 5. Gestión de catálogo                              │
│  ▶ [Colapsado por defecto]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📞 6. Contacto empresarial                             │
│  ▶ [Colapsado por defecto]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  💡 Tip                                                 │
│  Esta configuración se realiza una sola vez. Después   │
│  podrás modificarla desde tu panel de administración.   │
└─────────────────────────────────────────────────────────┘

[◀ Anterior]              [Siguiente ▶]
```

### Componentes UI Específicos

#### Tooltip Component
```tsx
<Tooltip content="Razón social registrada de tu negocio">
  <QuestionMarkCircleIcon className="w-4 h-4" />
</Tooltip>
```

#### Multi-select Chips (Zonas)
```tsx
<ZoneSelector
  selected={["Centro", "Nueva Córdoba"]}
  onAdd={(zone) => addZone(zone)}
  onRemove={(zone) => removeZone(zone)}
  placeholder="Agregar zona..."
/>
```

#### Toggle con Sub-campos
```tsx
<Toggle
  label="¿Ofrecés delivery?"
  value={hasDelivery}
  onChange={setHasDelivery}
  tooltip="Enviás pedidos a domicilio del cliente"
/>
{hasDelivery && (
  <div className="ml-8 mt-3 space-y-3">
    <ZoneSelector ... />
    <TimeSelector ... />
  </div>
)}
```

---

## Plan de Implementación

### Fase 1: Diseño y Especificación (1-2 días)
- [x] Crear este plan detallado
- [ ] Diseñar mockups en Figma (opcional pero recomendado)
- [ ] Revisar y validar campos con equipo
- [ ] Definir textos de tooltips finales

### Fase 2: Frontend - Componentes Base (2-3 días)
- [ ] Crear componente `Tooltip` reutilizable
- [ ] Crear componente `CollapsibleSection` para cada sección
- [ ] Crear componente `ZoneSelector` (multi-select chips)
- [ ] Crear componente `TimeRangePicker` para horarios
- [ ] Crear componente `ToggleWithSubfields`

### Fase 3: Frontend - UCPConfigStep Nuevo (3-4 días)
- [ ] Crear interfaz TypeScript `BusinessConfiguration`
- [ ] Reescribir `UCPConfigStep.tsx` con 6 secciones
- [ ] Implementar validaciones por sección
- [ ] Implementar lógica condicional (ej: delivery zones solo si delivery=true)
- [ ] Agregar estado de "sección completada" (checkmarks)
- [ ] Testing en diferentes resoluciones

### Fase 4: Backend - Mapeo a UCP (4-5 días)
- [ ] Crear servicio `business-config-mapper.service.ts`
- [ ] Implementar función `mapToAgentCard()`
- [ ] Implementar función `mapToCapabilities()`
- [ ] Implementar función `mapToExtensions()`
- [ ] Implementar función `generateUCPProfile()`
- [ ] Crear endpoint `/api/businesses/:id/ucp-config` (GET y PUT)
- [ ] Generar archivo `ucp_profile_{business_id}.json` al completar registro

### Fase 5: Backend - Agente del Negocio (5-6 días)
- [ ] Modificar `business_agent/agent.py` para cargar config desde UCP Profile
- [ ] Crear `business_agent/config_loader.py` 
- [ ] Modificar `business_agent/prompt.py` para personalizar según negocio
- [ ] Crear herramientas dinámicas según capabilities:
  - [ ] `validate_delivery_zone()`
  - [ ] `check_opening_hours()`
  - [ ] `validate_minimum_order()`
  - [ ] `check_payment_method()`
- [ ] Implementar lógica de cancelación según `cancellation_window`
- [ ] Testing de agentes con diferentes configuraciones

### Fase 6: Backend - Panel de Administración (3-4 días)
- [ ] Crear ruta `/dashboard/businesses/:id/config`
- [ ] Permitir edición de configuración post-registro
- [ ] Sincronizar cambios con UCP Profile del agente
- [ ] Regenerar Agent Card al actualizar config
- [ ] Notificar al agente cuando hay cambios en config

### Fase 7: Testing y Validación (2-3 días)
- [ ] Testing E2E: Registro completo de un negocio
- [ ] Validar generación correcta de UCP Profile
- [ ] Validar que el agente respeta las configuraciones
- [ ] Testing de casos límite:
  - [ ] Solo pickup, sin delivery
  - [ ] Solo efectivo
  - [ ] Monto mínimo muy alto
  - [ ] Cancelación no permitida
- [ ] Testing de accesibilidad (tooltips, navegación con teclado)

### Fase 8: Documentación (1-2 días)
- [ ] Documentar estructura de `BusinessConfiguration`
- [ ] Documentar mapeo Frontend → UCP Profile
- [ ] Crear guía para agregar nuevos campos en el futuro
- [ ] Documentar herramientas del agente
- [ ] Crear ejemplos de UCP Profiles completos

---

## Estructura de Archivos

### Frontend
```
chat-client/
├── components/
│   └── Business/
│       ├── steps/
│       │   ├── UCPConfigStep.tsx (REESCRIBIR)
│       │   └── shared/
│       │       ├── Tooltip.tsx (NUEVO)
│       │       ├── CollapsibleSection.tsx (NUEVO)
│       │       ├── ZoneSelector.tsx (NUEVO)
│       │       ├── TimeRangePicker.tsx (NUEVO)
│       │       └── ToggleWithSubfields.tsx (NUEVO)
│       └── BusinessRegister.tsx (modificar para pasar config)
├── types/
│   └── business-config.types.ts (NUEVO)
└── services/
    └── business-config.service.ts (NUEVO)
```

### Backend
```
backend/
├── services/
│   └── business-config-mapper.service.ts (NUEVO)
├── models/
│   └── business-configuration.model.ts (NUEVO)
└── routes/
    └── business-config.routes.ts (NUEVO)

business_agent/
├── config_loader.py (NUEVO)
├── agent.py (MODIFICAR)
├── prompt.py (MODIFICAR)
├── tools/
│   ├── delivery_tools.py (NUEVO)
│   ├── payment_tools.py (NUEVO)
│   └── policy_tools.py (NUEVO)
└── data/
    └── ucp_profiles/
        └── {business_id}.json (GENERADOS)
```

---

## TypeScript Types

### Frontend Types

```typescript
// types/business-config.types.ts

export interface BusinessConfiguration {
  // Sección 1: Identidad
  identity: {
    legalName: string;
    displayName: string;
    category: BusinessCategory;
    country: string;
    city: string;
    operatingRegions: string[];
  };
  
  // Sección 2: Operación y entrega
  operations: {
    openingHours: WeekSchedule;
    deliveryMethods: {
      delivery: boolean;
      pickup: boolean;
    };
    deliveryZones?: string[];  // condicional si delivery=true
    estimatedDeliveryTime?: EstimatedTime;
    pickupPreparationTime?: number;  // minutos
  };
  
  // Sección 3: Métodos de pago
  payment: {
    methods: {
      cash: boolean;
      card: boolean;
      wallet: {
        mercadoPago: boolean;
      };
      other?: string;
    };
    timing: PaymentTiming;  // "online" | "on-delivery" | "both"
  };
  
  // Sección 4: Políticas comerciales
  policies: {
    returnPolicy: string;
    refundPolicy: string;
    cancellationWindow: number;  // minutos
    minimumOrderAmount: number;
  };
  
  // Sección 5: Gestión de catálogo
  catalog: {
    sourceType: CatalogSourceType;  // "manual" | "csv" | "api"
    currency: string;
  };
  
  // Sección 6: Contacto empresarial
  contact: {
    email: string;
    phone: string;
    responsiblePerson: string;
  };
}

export type BusinessCategory = 
  | "restaurant"
  | "supermarket"
  | "pharmacy"
  | "clothing"
  | "electronics"
  | "bookstore"
  | "florist"
  | "bakery"
  | "other";

export interface WeekSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
  closed?: boolean;
}

export interface EstimatedTime {
  min: number;
  max: number;
  unit: "minutes" | "hours";
}

export type CatalogSourceType = "manual" | "csv" | "api";
export type PaymentTiming = "online" | "on-delivery" | "both";
```

---

## Validaciones

### Validación por Sección

```typescript
// Sección 1: Identidad
const validateIdentity = (data: BusinessConfiguration['identity']): boolean => {
  return !!(
    data.legalName &&
    data.displayName &&
    data.category &&
    data.country &&
    data.city &&
    data.operatingRegions.length > 0
  );
};

// Sección 2: Operaciones
const validateOperations = (data: BusinessConfiguration['operations']): boolean => {
  // Al menos un método de entrega
  if (!data.deliveryMethods.delivery && !data.deliveryMethods.pickup) {
    return false;
  }
  
  // Si tiene delivery, debe tener zonas y tiempo estimado
  if (data.deliveryMethods.delivery) {
    if (!data.deliveryZones || data.deliveryZones.length === 0) return false;
    if (!data.estimatedDeliveryTime) return false;
  }
  
  // Si tiene pickup, debe tener tiempo de preparación
  if (data.deliveryMethods.pickup && !data.pickupPreparationTime) {
    return false;
  }
  
  return true;
};

// Sección 3: Pagos
const validatePayment = (data: BusinessConfiguration['payment']): boolean => {
  // Al menos un método de pago
  const hasMethod = 
    data.methods.cash ||
    data.methods.card ||
    data.methods.wallet.mercadoPago ||
    !!data.methods.other;
  
  return hasMethod && !!data.timing;
};

// Sección 4: Políticas
const validatePolicies = (data: BusinessConfiguration['policies']): boolean => {
  return !!(
    data.returnPolicy &&
    data.refundPolicy &&
    data.cancellationWindow >= 0
    // minimumOrderAmount puede ser 0
  );
};

// Sección 5: Catálogo
const validateCatalog = (data: BusinessConfiguration['catalog']): boolean => {
  return !!(data.sourceType && data.currency);
};

// Sección 6: Contacto
const validateContact = (data: BusinessConfiguration['contact']): boolean => {
  return !!(
    data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    data.phone &&
    data.responsiblePerson
  );
};

// Validación general
export const validateBusinessConfiguration = (
  config: BusinessConfiguration
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateIdentity(config.identity)) {
    errors.push("Completá todos los campos de Identidad y alcance");
  }
  if (!validateOperations(config.operations)) {
    errors.push("Configurá al menos un método de entrega");
  }
  if (!validatePayment(config.payment)) {
    errors.push("Seleccioná al menos un método de pago");
  }
  if (!validatePolicies(config.policies)) {
    errors.push("Completá todas las políticas comerciales");
  }
  if (!validateCatalog(config.catalog)) {
    errors.push("Configurá la gestión de catálogo");
  }
  if (!validateContact(config.contact)) {
    errors.push("Completá los datos de contacto empresarial");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

---

## Textos de Tooltips (Definitivos)

### Sección 1: Identidad

| Campo | Tooltip |
|-------|---------|
| Nombre legal | "Razón social registrada de tu negocio (ej: 'Pizzería Don Juan S.R.L.'). Aparecerá en documentos legales" |
| Nombre comercial | "Nombre que verán tus clientes en la app (ej: 'Don Juan Pizzas'). Puede ser diferente al nombre legal" |
| Categoría | "Tipo de negocio. Ayuda a los clientes a encontrarte cuando buscan productos o servicios como los tuyos" |
| País | "País donde está registrado y opera tu negocio" |
| Ciudad principal | "Ciudad donde está ubicado tu local principal o punto de venta" |
| Regiones de operación | "Barrios, zonas o localidades donde realizás entregas o tenés presencia. Los clientes fuera de estas zonas no podrán hacer pedidos" |

### Sección 2: Operación y entrega

| Campo | Tooltip |
|-------|---------|
| Horarios por día | "Horarios en que tu negocio está abierto para recibir pedidos. Fuera de estos horarios, los clientes no podrán realizar compras" |
| ¿Ofrecés delivery? | "Indicá si enviás pedidos a domicilio del cliente. Si lo activás, tendrás que configurar las zonas donde hacés entregas" |
| Zonas de delivery | "Barrios o zonas específicas donde hacés delivery. Los clientes fuera de estas zonas no podrán pedir delivery" |
| Tiempo estimado de delivery | "Tiempo promedio que tardás en entregar un pedido desde que el cliente lo confirma. Este tiempo se mostrará al cliente" |
| ¿Ofrecés retiro en local? | "Indicá si los clientes pueden retirar sus pedidos en tu negocio. Es una buena opción si querés ofrecer envío gratis" |
| Tiempo de preparación | "Tiempo que tardás en tener el pedido listo para que el cliente lo retire. Este tiempo se mostrará al cliente" |

### Sección 3: Métodos de pago

| Campo | Tooltip |
|-------|---------|
| Efectivo | "Aceptás pago en efectivo al momento de la entrega o retiro" |
| Tarjeta | "Aceptás pagos con tarjeta de débito o crédito (online o al momento de entrega/retiro)" |
| Mercado Pago | "Aceptás pagos con Mercado Pago u otras billeteras digitales" |
| Otro método | "Si aceptás otro método de pago (ej: transferencia bancaria), especificá cuál" |
| ¿Cuándo cobras? | "Momento en que el cliente realiza el pago: al confirmar el pedido (online) o al recibirlo/retirarlo" |

### Sección 4: Políticas comerciales

| Campo | Tooltip |
|-------|---------|
| Política de devoluciones | "Explicá en qué casos aceptás devoluciones. Ej: 'Aceptamos devoluciones hasta 24hs si el producto tiene defectos'. Sé claro para evitar problemas" |
| Política de reembolsos | "Explicá cómo y cuándo devolvés el dinero. Ej: 'Reembolso completo en 5-7 días hábiles'. Incluí el método de reembolso si es relevante" |
| Ventana de cancelación | "Tiempo máximo en que el cliente puede cancelar su pedido sin cargo. Después de este tiempo, la cancelación quedará a tu criterio" |
| Monto mínimo de pedido | "Monto mínimo que debe alcanzar un pedido para ser procesado. Dejá en 0 si no tenés monto mínimo" |

### Sección 5: Gestión de catálogo

| Campo | Tooltip |
|-------|---------|
| Método de carga | "Elegí cómo vas a actualizar tu catálogo de productos: Manual (desde el panel web), CSV (subiendo un archivo), o API (integración avanzada)" |
| Moneda | "Moneda en que están expresados los precios de tus productos" |

### Sección 6: Contacto empresarial

| Campo | Tooltip |
|-------|---------|
| Email empresarial | "Email para que JANDI pueda contactarte sobre tu cuenta, pedidos, o soporte. No es visible para los clientes" |
| Teléfono de contacto | "Teléfono para contacto directo con JANDI en caso de problemas o consultas. No es visible para los clientes" |
| Responsable | "Nombre completo de la persona responsable del negocio o de la cuenta en JANDI" |

---

## Ejemplo de Flujo Completo

### 1. Negocio completa el formulario (Frontend)

```typescript
const businessConfig: BusinessConfiguration = {
  identity: {
    legalName: "Pizzería Don Juan S.R.L.",
    displayName: "Don Juan Pizzas",
    category: "restaurant",
    country: "Argentina",
    city: "Córdoba",
    operatingRegions: ["Centro", "Nueva Córdoba", "Cerro de las Rosas"]
  },
  operations: {
    openingHours: {
      monday: { open: "09:00", close: "22:00" },
      tuesday: { open: "09:00", close: "22:00" },
      wednesday: { open: "09:00", close: "22:00" },
      thursday: { open: "09:00", close: "22:00" },
      friday: { open: "09:00", close: "23:00" },
      saturday: { open: "10:00", close: "23:00" },
      sunday: { closed: true }
    },
    deliveryMethods: {
      delivery: true,
      pickup: true
    },
    deliveryZones: ["Centro", "Nueva Córdoba"],
    estimatedDeliveryTime: { min: 45, max: 60, unit: "minutes" },
    pickupPreparationTime: 20
  },
  payment: {
    methods: {
      cash: true,
      card: true,
      wallet: { mercadoPago: true }
    },
    timing: "both"
  },
  policies: {
    returnPolicy: "Aceptamos devoluciones hasta 24hs si el producto tiene defectos",
    refundPolicy: "Reembolso completo en 5-7 días hábiles",
    cancellationWindow: 15,
    minimumOrderAmount: 500
  },
  catalog: {
    sourceType: "csv",
    currency: "ARS"
  },
  contact: {
    email: "admin@donjuanpizzas.com",
    phone: "+54 351 9876543",
    responsiblePerson: "Juan Pérez"
  }
};
```

### 2. Se envía al backend

```typescript
// En BusinessRegister.tsx, al hacer submit
await businessConfigService.saveConfiguration(businessId, businessConfig);
```

### 3. Backend mapea a UCP Profile

```typescript
// En business-config-mapper.service.ts
const ucpProfile = await mapToUCPProfile(businessConfig, businessId);

// Se genera: business_agent/data/ucp_profiles/biz_abc123.json
await fs.writeFile(
  `business_agent/data/ucp_profiles/${businessId}.json`,
  JSON.stringify(ucpProfile, null, 2)
);
```

### 4. Agente carga la configuración

```python
# En business_agent/config_loader.py
def load_business_config(business_id: str) -> dict:
    with open(f"data/ucp_profiles/{business_id}.json") as f:
        return json.load(f)

# En business_agent/agent.py
config = load_business_config(business_id)
agent = BusinessAgent(config)
```

### 5. Usuario interactúa con el agente

```
Usuario: "Hola, quiero pedir una pizza grande a Nueva Córdoba"

Agente (internamente):
1. Verifica que Nueva Córdoba está en delivery_zones ✅
2. Verifica que el negocio está abierto según opening_hours ✅
3. Muestra el catálogo de pizzas
4. Calcula estimated_delivery_time: "45-60 minutos"
5. Al finalizar, verifica minimum_order_amount: $500 ✅
6. Ofrece payment_methods: "Efectivo, Tarjeta, o Mercado Pago"

Agente (al usuario):
"¡Perfecto! Hacemos delivery a Nueva Córdoba. Te muestro nuestras pizzas..."
```

---

## Consideraciones Importantes

### 1. Migración de Negocios Existentes
Si ya hay negocios registrados sin esta configuración:
- Crear script de migración para asignar valores por defecto
- Enviar email pidiendo completar la configuración
- Mostrar banner en el panel de admin: "Completá tu configuración"

### 2. Actualización de Configuración Post-Registro
- Permitir edición desde panel de admin
- Al actualizar, regenerar UCP Profile
- Notificar al agente para recargar config
- Mantener historial de cambios

### 3. Impacto en Capabilities Dinámicas
Si un negocio desactiva delivery:
- Remover capability `dev.ucp.shopping.fulfillment.delivery`
- Actualizar Agent Card
- Notificar al agente
- Los pedidos en curso de delivery no se ven afectados

### 4. Validaciones en Tiempo Real
- Validar zonas de delivery contra geocoding API (opcional)
- Validar horarios (ej: close > open)
- Validar email con regex
- Validar teléfono con libphonenumber

### 5. SEO y Discoverability
- Usar `business_category` para tags de búsqueda
- Usar `operating_regions` para búsquedas geográficas
- Generar sitemap dinámico con negocios por categoría

---

## Testing

### Tests Unitarios

```typescript
// Frontend
describe('UCPConfigStep', () => {
  it('debe validar identidad correctamente', () => {
    const identity = {
      legalName: "Test S.R.L.",
      displayName: "Test",
      category: "restaurant",
      country: "Argentina",
      city: "Córdoba",
      operatingRegions: ["Centro"]
    };
    expect(validateIdentity(identity)).toBe(true);
  });
  
  it('debe requerir zonas si delivery está activado', () => {
    const operations = {
      deliveryMethods: { delivery: true, pickup: false },
      deliveryZones: [],  // ❌ Error
      estimatedDeliveryTime: { min: 30, max: 45, unit: "minutes" }
    };
    expect(validateOperations(operations)).toBe(false);
  });
});
```

```python
# Backend
def test_map_to_agent_card():
    config = {...}  # BusinessConfiguration completo
    agent_card = map_to_agent_card(config)
    
    assert agent_card["name"] == "Don Juan Pizzas Agent"
    assert agent_card["identity"]["legalName"] == "Pizzería Don Juan S.R.L."
    assert "Centro" in agent_card["identity"]["location"]["serviceAreas"]

def test_capabilities_based_on_delivery():
    # Solo pickup
    config = {
        "operations": {
            "deliveryMethods": {"delivery": False, "pickup": True}
        }
    }
    capabilities = map_to_capabilities(config)
    
    assert "dev.ucp.shopping.fulfillment.pickup" in capabilities
    assert "dev.ucp.shopping.fulfillment.delivery" not in capabilities
```

### Tests E2E

```typescript
// Cypress
describe('Business Registration - UCP Config', () => {
  it('debe completar toda la configuración exitosamente', () => {
    cy.visit('/business/register');
    
    // ... completar pasos 1-4 ...
    
    // Paso 5: UCP Config
    cy.get('[data-testid="identity-legal-name"]').type('Pizzería Don Juan S.R.L.');
    cy.get('[data-testid="identity-display-name"]').type('Don Juan Pizzas');
    cy.get('[data-testid="identity-category"]').select('restaurant');
    // ... completar todos los campos ...
    
    cy.get('[data-testid="btn-next"]').click();
    
    // Paso 6: Review
    cy.contains('Don Juan Pizzas');
    cy.get('[data-testid="btn-submit"]').click();
    
    // Verificar éxito
    cy.contains('¡Solicitud enviada!');
  });
});
```

---

## Resumen

Este plan transforma el paso "Configuración UCP" de un panel informativo a un **formulario completo y estratégico** que:

### Para el Negocio (Frontend)
✅ **Interfaz simple**: Formulario con 6 secciones claras y tooltips explicativos  
✅ **Lenguaje de negocio**: Sin menciones a UCP, A2A, agentes, o términos técnicos  
✅ **Una sola vez**: Configuración inicial que después se puede modificar desde el panel  

### Para JANDI (Backend)
✅ **Agent Card A2A estándar**: Cumple 100% con especificación A2A v0.2.1 de Google  
✅ **Integración ADK**: Compatible con Google Agent Development Kit  
✅ **Skills dinámicos**: Se generan automáticamente según la configuración del negocio  
✅ **3 archivos separados**: Agent Card (público), Business Config (interno), UCP Profile (comercio)  
✅ **Escalable**: Fácil agregar nuevos campos y capabilities en el futuro  

### Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│  NEGOCIO (Frontend)                                         │
│  "Configuración de tu tienda" - Lenguaje simple             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  JANDI BACKEND                                               │
│  Genera 3 archivos:                                         │
│  1. Agent Card A2A (/.well-known/agent.json) - Público      │
│  2. Business Config (configs/{id}.json) - Interno           │
│  3. UCP Profile (ucp_profiles/{id}.json) - Interno          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS AGENT (ADK + A2A Server)                          │
│  - Responde a discovery via Agent Card A2A                  │
│  - Aplica reglas de negocio desde Business Config           │
│  - Procesa transacciones según UCP Profile                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  USUARIOS / OTROS AGENTES                                   │
│  Interactúan con el agente del negocio via A2A              │
└─────────────────────────────────────────────────────────────┘
```

### Alineación con Especificaciones

| Especificación | Estado |
|----------------|--------|
| Google A2A Protocol v0.2.1 | ✅ Validado |
| Google ADK | ✅ Compatible |
| UCP.dev | ✅ Extensions definidas |
| JSON-RPC 2.0 | ✅ Soportado |
| Server-Sent Events (SSE) | ✅ Streaming habilitado |

**El negocio ve:** Un formulario simple para configurar su tienda  
**JANDI tiene:** Un agente A2A/UCP completo que responde en nombre del negocio, descubrible por otros agentes del ecosistema

---

## Próximos Pasos

1. **Revisar y aprobar este plan**
2. **Asignar prioridades a las fases**
3. **Definir timeline y recursos**
4. **Comenzar con Fase 1 (mockups opcionales) y Fase 2 (componentes base)**

¿Procedemos con la implementación?

---

## Modelo de Datos (Supabase) y Migración SQL

### Estado actual (revisión MCP Supabase)

Se revisaron las tablas existentes en el esquema `public` y ya contamos con una base sólida:

- **`public.businesses`**: datos del negocio + delivery básico (`delivery_radius_km`, `delivery_fee`, `min_order_amount`) + `business_hours` + `ucp_profile` (jsonb).
- **`public.products`**: catálogo con stock (`stock_quantity`) y `currency`, pensado para comercio.
- **`public.business_documents`**: documentación legal.
- **`public.orders`**, **`public.order_events`**: flujo de órdenes.

Además, hoy el control de acceso (RLS) para negocios se basa en el **email del negocio** (`businesses.email`) comparado con `auth.jwt()->>'email'`, lo cual se mantiene para evitar romper acceso existente.

### Gap vs. Plan (qué falta persistir)

Para cumplir con el plan de “configuración one-time” (sin exponer UCP/A2A al negocio), necesitamos persistir:

- **Configuración interna del negocio** (Business Config): identidad extendida, regiones, operaciones, delivery/pickup avanzado, métodos de pago declarativos, políticas comerciales, contacto/ops y estrategia de catálogo.
- **Agent Card A2A** (estándar): documento público `/.well-known/agent.json` (lo servimos desde infraestructura), pero también conviene guardarlo en DB para regeneración/observabilidad.
- **UCP Profile**: ya existe como `businesses.ucp_profile` (jsonb). Se mantiene.
- **Soporte para CSV**: historial/estado de importaciones de catálogo desde archivos CSV.

### Cambios propuestos en DB

#### 1) Ampliar `public.businesses` (sin romper compatibilidad)

Se agregan columnas **aditivas** (y algunas con defaults), para soportar la configuración del agente sin reemplazar campos actuales:

- **`operating_regions`** (`text[]`): zonas donde opera (para coverage).
- **`delivery_methods`** (`jsonb`): `{ delivery: boolean, pickup: boolean }`.
- **`delivery_zones`** (`text[]`): zonas de delivery (si corresponde).
- **`estimated_delivery_time_min/max`** (`int`): promesa de entrega estimada.
- **`pickup_preparation_time_minutes`** (`int`): tiempo de preparación para retiro.
- **`payment_methods_supported`** (`jsonb`): declarativo (cash/card/wallet/otros).
- **`payment_timing`** (`text`): `online | on_delivery | both`.
- **`return_policy`**, **`refund_policy`** (`text`), **`cancellation_window_minutes`** (`int`).
- **`business_contact_email`**, **`business_contact_phone`**, **`responsible_person_name`** (`text`).
- **`catalog_source_type`** (`text`): `manual | csv | api`.
- **`price_currency`** (`text`): moneda base (default `ARS`).
- **`agent_card`** (`jsonb`): copia del Agent Card A2A (para regeneración/observabilidad).
- **`business_config`** (`jsonb`): snapshot de configuración interna (fuente para generar `agent_card` y `ucp_profile`).

Se agregan **constraints** para valores válidos y **índices** GIN para búsquedas sobre arrays/json.

#### 2) Crear `public.business_catalog_imports`

Tabla para soportar el flujo “subís CSV y listo”:

- `business_id` (FK)
- `file_url`
- `status` (`pending|processing|completed|failed`)
- `error`, `processed_at`, `metadata`

Incluye **RLS** siguiendo el mismo patrón actual (por email del negocio).

### SQL de migración

Se creó un script de migración alineado al plan:

- **Archivo**: `sql_scripts/2026_01_27_business_agent_config.sql`
- **Incluye**: `ALTER TABLE businesses ...`, `CREATE TABLE business_catalog_imports ...`, constraints, índices y políticas RLS.

> Nota: este SQL está pensado para ejecutarse como migración (DDL). Si lo aplicás vía Supabase, usar el mecanismo de migrations.

## Referencias

### Especificaciones Oficiales

| Recurso | URL |
|---------|-----|
| **A2A Protocol Specification v0.2.1** | https://google.github.io/A2A/specification/ |
| **A2A Agent Card Spec** | https://google.github.io/A2A/specification/#5-agent-discovery-the-agent-card |
| **Google ADK Documentation** | https://google.github.io/adk-docs/ |
| **ADK Agents Guide** | https://google.github.io/adk-docs/agents/ |
| **A2A Quickstart (Exposing Agent)** | https://google.github.io/adk-docs/a2a/quickstart-exposing/ |
| **UCP.dev Specification** | https://ucp.dev/specification/overview |

### Documentación Interna JANDI

| Recurso | Path |
|---------|------|
| **Business Agent** | `/business_agent/src/business_agent/` |
| **Agent Card actual** | `/business_agent/src/business_agent/data/agent_card.json` |
| **UCP Profile actual** | `/business_agent/src/business_agent/data/ucp.json` |
| **A2A Extensions** | `/business_agent/src/business_agent/a2a_extensions/` |

### Changelog del Plan

| Fecha | Cambio |
|-------|--------|
| 2026-01-27 | Creación inicial del plan |
| 2026-01-27 | Validación con spec A2A v0.2.1 - Correcciones aplicadas |
| 2026-01-27 | Agregada integración con Google ADK |
| 2026-01-27 | Separación en 3 archivos: Agent Card, Business Config, UCP Profile |
| 2026-01-27 | Agregados Skills dinámicos según configuración |
