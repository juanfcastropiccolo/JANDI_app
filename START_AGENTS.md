# Guía de Inicio Rápido: JANDI y Business Agents

## Arquitectura

```
Usuario → JANDI (agente del usuario) → business_agents (agentes de negocios)
```

---

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

#### business_agent
```bash
cd business_agent
cp .env.example .env
# Editar .env con tus credenciales
```

#### jandi_agent
```bash
cd jandi_agent
cp .env.example .env
# Editar .env con tus credenciales
```

**Variables requeridas:**
- `GOOGLE_API_KEY`: Tu API key de Google AI
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase

---

### 2. Instalar Dependencias

#### business_agent
```bash
cd business_agent
pip install -e .
```

#### jandi_agent
```bash
cd jandi_agent
pip install -e .
```

---

### 3. Aplicar Migración SQL

Si aún no aplicaste la migración de la base de datos:

```bash
# Ir a Supabase Dashboard → SQL Editor
# Copiar y ejecutar: sql_scripts/2026_01_27_business_agent_config.sql
```

---

### 4. Iniciar Agentes

#### Opción A: Iniciar Manualmente

**Terminal 1 - business_agent (Don Juan Pizzas):**
```bash
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/business_agent
python -m business_agent.main \
  --host localhost \
  --port 10000 \
  --business-id <TU_BUSINESS_ID>
```

**Terminal 2 - JANDI (Usuario María):**
```bash
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/jandi_agent
python -m jandi_agent.main \
  --host localhost \
  --port 20000 \
  --user-id <TU_USER_ID>
```

#### Opción B: Script de Inicio (Crear)

Crear `start_agents.sh`:
```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting JANDI ecosystem...${NC}"

# Iniciar business_agents
echo -e "${GREEN}Starting business agents...${NC}"
cd business_agent
python -m business_agent.main --business-id donjuan_pizzas --port 10000 &
python -m business_agent.main --business-id la_pizzeria --port 10001 &
python -m business_agent.main --business-id napolitano --port 10002 &

sleep 3

# Iniciar JANDI agents
echo -e "${GREEN}Starting JANDI agents...${NC}"
cd ../jandi_agent
python -m jandi_agent.main --user-id user_maria --port 20000 &
python -m jandi_agent.main --user-id user_juan --port 20001 &

echo -e "${BLUE}All agents started!${NC}"
echo ""
echo "Business agents:"
echo "  - Don Juan Pizzas: http://localhost:10000"
echo "  - La Pizzería: http://localhost:10001"
echo "  - Napolitano: http://localhost:10002"
echo ""
echo "JANDI agents:"
echo "  - María: http://localhost:20000"
echo "  - Juan: http://localhost:20001"
```

---

## 🧪 Verificación

### 1. Verificar business_agent

```bash
# Obtener Agent Card
curl http://localhost:10000/.well-known/agent.json

# Debería retornar el Agent Card del negocio
```

### 2. Verificar JANDI

```bash
# Obtener perfil del usuario
curl http://localhost:20000/profile

# Debería retornar el perfil del usuario
```

### 3. Probar Comunicación A2A

```bash
# JANDI consulta a business_agent
curl -X POST http://localhost:10000/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "query",
    "params": {
      "query": "¿Qué productos tienen disponibles?"
    },
    "id": "test-123"
  }'
```

---

## 🔍 Troubleshooting

### Error: "Business not found"

**Causa:** El business_id no existe en la base de datos o no completó la configuración.

**Solución:**
1. Verificar que el negocio existe: `SELECT * FROM businesses WHERE id = 'business_id';`
2. Verificar que tiene `agent_card` configurado
3. Si no, completar el registro del negocio en el frontend

### Error: "User not found"

**Causa:** El user_id no existe en la base de datos.

**Solución:**
1. Verificar que el usuario existe: `SELECT * FROM user_profiles WHERE user_id = 'user_id';`
2. Si no, completar el registro del usuario en el frontend

### Error: "GOOGLE_API_KEY must be set"

**Solución:**
```bash
export GOOGLE_API_KEY=your_key_here
# O configurar en .env
```

### Error: "Connection refused" al comunicarse entre agentes

**Causa:** El business_agent no está corriendo o está en otro puerto.

**Solución:**
1. Verificar que el business_agent está corriendo: `ps aux | grep business_agent`
2. Verificar el puerto correcto en los logs
3. Actualizar la URL en `a2a_client.py` si es necesario

---

## 📊 Puertos Asignados

### business_agents (10000-10999)
- 10000: Primer negocio
- 10001: Segundo negocio
- 10002: Tercer negocio
- ...

### JANDI agents (20000-20999)
- 20000: Primer usuario
- 20001: Segundo usuario
- 20002: Tercer usuario
- ...

---

## 🎯 Próximos Pasos

1. **Testing manual** de ambos tipos de agentes
2. **Integrar con chat-client** para conectar frontend con JANDI
3. **Service discovery** para lookup dinámico de business_agents
4. **Process manager** para gestionar múltiples instancias
5. **Health checks** y monitoring

---

## 📚 Referencias

- **Análisis del problema:** `ANALISIS_CORRECCION_ARQUITECTURA.md`
- **Corrección aplicada:** `CORRECCION_ARQUITECTURA_APLICADA.md`
- **README JANDI:** `jandi_agent/README.md`
- **Plan original:** `PLAN_MEJORA_CONFIGURACION_AGENTE_NEGOCIO.md`

---

## ✅ Checklist de Inicio

- [ ] Variables de entorno configuradas (business_agent y jandi_agent)
- [ ] Dependencias instaladas (`pip install -e .`)
- [ ] Migración SQL aplicada en Supabase
- [ ] Al menos un negocio registrado con configuración completa
- [ ] Al menos un usuario registrado con perfil
- [ ] business_agent iniciado correctamente
- [ ] JANDI iniciado correctamente
- [ ] Comunicación A2A verificada

**¡Listo para empezar! 🚀**
