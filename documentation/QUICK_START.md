# 🚀 Quick Start - JANDI

Guía rápida para poner en marcha el sistema completo.

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Configurar Supabase (2 min)

```bash
# 1. Ve a: https://bstddwmpsbfrwqaudkai.supabase.co
# 2. SQL Editor > New Query
# 3. Copia y pega el contenido de SUPABASE_SCHEMA.sql
# 4. Ejecuta (Run)
```

### 2. Configurar Variables de Entorno (1 min)

#### Frontend
```bash
cd chat-client

# Crear .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://bstddwmpsbfrwqaudkai.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdGRkd21wc2JmcndxYXVka2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjA2ODgsImV4cCI6MjA4NDkzNjY4OH0.vBxqPWGZvHCYYdVJZxLzQxQxQxQxQxQxQxQxQxQxQxQ
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:10999
VITE_MP_PUBLIC_KEY=TEST-mockup-key
VITE_ENABLE_BUSINESS_REGISTRATION=true
VITE_ENABLE_GOOGLE_AUTH=true
EOF
```

**Nota:** Reemplaza `VITE_SUPABASE_ANON_KEY` con tu key real de Supabase (Settings > API > anon public)

#### Backend
```bash
cd business_agent

# Ya tienes .env configurado
# Solo verifica que SESSION_DB_URL esté correcto
```

### 3. Instalar Dependencias Backend (2 min)

```bash
cd business_agent

# Instalar el proyecto y sus dependencias
pip install -e .

# Instalar supabase manualmente (si hay error SSL)
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org supabase

# Verificar instalación
python -c "import supabase; print('✅ Supabase OK')"
python -c "from google.adk.agents import Agent; print('✅ Google ADK OK')"
```

### 4. Ejecutar el Sistema (2 min)

#### Terminal 1: Frontend
```bash
cd chat-client
npm run dev
```

#### Terminal 2: Backend
```bash
cd business_agent
python -m business_agent.main --host localhost --port 10999
```

### 5. Probar (30 seg)

Abre tu navegador en: **http://localhost:5173/**

---

## 🧪 Testing Rápido

### Flujo de Usuario
1. Click en "Registrarse"
2. Completa el formulario
3. Completa los 5 pasos del onboarding
4. ¡Listo! Estás en el chat

### Flujo de Negocio
1. Click en "Publicá tu negocio en JANDI"
2. Click en "Registrar mi negocio"
3. Completa los 6 pasos
4. ¡Solicitud enviada!

---

## 🔑 Credenciales de Prueba

### Tarjetas (Mockup)
```
Número: 4111111111111111
Vencimiento: 12/28
CVV: 123
Nombre: Test User
```

### Mercado Pago (Mockup)
```
Email: test@example.com
```

---

## 📚 Documentación Completa

- **PLAN_SISTEMA_AUTENTICACION_ONBOARDING.md** - Plan detallado
- **SETUP_INSTRUCTIONS.md** - Configuración paso a paso
- **IMPLEMENTACION_COMPLETA.md** - Resumen final completo
- **IMPLEMENTATION_STATUS.md** - Estado del proyecto

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
```bash
# Verifica que .env.local existe
cat chat-client/.env.local

# Si no existe, créalo con el paso 2
```

### Error: "Module 'supabase' not found"
```bash
cd business_agent
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org supabase
```

### Error: "Port 5173 already in use"
```bash
# Mata el proceso
lsof -ti:5173 | xargs kill -9

# O usa otro puerto
npm run dev -- --port 5174
```

---

## ✅ Checklist de Verificación

- [ ] Supabase schema ejecutado
- [ ] .env.local creado en chat-client
- [ ] .env configurado en business_agent
- [ ] Dependencia supabase instalada en Python
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Backend corriendo en http://localhost:10999
- [ ] Landing page carga correctamente
- [ ] Puedes registrarte y completar onboarding
- [ ] Puedes acceder al portal de negocios

---

**¿Todo funcionando?** 🎉  
Revisa **IMPLEMENTACION_COMPLETA.md** para más detalles.
