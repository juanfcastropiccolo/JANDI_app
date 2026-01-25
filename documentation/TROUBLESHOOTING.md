# 🔧 Troubleshooting - JANDI

Soluciones a problemas comunes durante la configuración y ejecución.

---

## 🐛 Problemas Comunes

### 1. Error: "cannot import name 'tool' from 'google.adk.tools'"

**Problema:**
```python
ImportError: cannot import name 'tool' from 'google.adk.tools'
```

**Causa:** En Google ADK, las herramientas no usan decorador `@tool`, sino que son funciones normales que reciben `ToolContext`.

**Solución:** ✅ Ya corregido en `tools/ucp_tools.py`

---

### 2. Error: "ModuleNotFoundError: No module named 'a2a'"

**Problema:**
```python
ModuleNotFoundError: No module named 'a2a'
```

**Causa:** Las dependencias del backend no están instaladas.

**Solución:**
```bash
cd business_agent

# Opción 1: Instalar con uv (recomendado)
uv pip install -e .

# Opción 2: Instalar con pip
pip install -e .

# Instalar supabase manualmente
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org supabase
```

---

### 3. Error: "VIRTUAL_ENV does not match"

**Problema:**
```
warning: `VIRTUAL_ENV=...` does not match the project environment path
```

**Causa:** Estás en un virtual environment diferente.

**Solución:**
```bash
# Opción 1: Desactivar el venv actual
deactivate

# Opción 2: Usar --active flag
uv run --active python -m business_agent.main

# Opción 3: Activar el venv correcto
source /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/business_agent/.venv/bin/activate
```

---

### 4. Error: "Missing Supabase environment variables"

**Problema:**
```
ValueError: SUPABASE_URL and SUPABASE_KEY must be set
```

**Causa:** Variables de entorno no configuradas.

**Solución:**
```bash
# Frontend
cd chat-client
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# Backend
cd business_agent
cp .env.example .env
# Editar .env con tus credenciales
```

---

### 5. Error: SSL Certificate Verification

**Problema:**
```
SSLError(SSLCertVerificationError('OSStatus -26276'))
```

**Causa:** Problema con certificados SSL del sistema.

**Solución:**
```bash
# Instalar con trusted hosts
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org supabase

# O actualizar certificados
pip install --upgrade certifi
```

---

### 6. Error: "Port 5173 already in use"

**Problema:**
```
Error: Port 5173 is already in use
```

**Solución:**
```bash
# Opción 1: Matar el proceso
lsof -ti:5173 | xargs kill -9

# Opción 2: Usar otro puerto
npm run dev -- --port 5174
```

---

### 7. Error: "Cannot find module 'react-router-dom'"

**Problema:**
```
Error: Cannot find module 'react-router-dom'
```

**Causa:** Dependencias del frontend no instaladas.

**Solución:**
```bash
cd chat-client
npm install
```

---

### 8. Error: "RLS policy violation"

**Problema:**
```
Error: new row violates row-level security policy
```

**Causa:** El usuario no tiene permisos para la operación.

**Solución:**
1. Verifica que el usuario está autenticado
2. Revisa las políticas RLS en Supabase
3. Asegúrate de que el `auth.uid()` coincide con el `user_id`

---

### 9. Error: "Google OAuth not working"

**Problema:** El botón de Google no funciona o redirige incorrectamente.

**Solución:**
1. Verifica que Google OAuth está habilitado en Supabase
2. Verifica las Redirect URIs en Google Cloud Console:
   - `http://localhost:5173/auth/callback`
   - `https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback`
3. Verifica que el Client ID está en `.env.local`

---

### 10. Error: "Failed to fetch"

**Problema:**
```
TypeError: Failed to fetch
```

**Causa:** El backend no está corriendo o hay problema de CORS.

**Solución:**
```bash
# Verifica que el backend está corriendo
curl http://localhost:10999/.well-known/agent-card.json

# Si no responde, ejecuta:
cd business_agent
python -m business_agent.main
```

---

## 🔍 Debugging

### Verificar Estado de Supabase

```bash
# Verificar conexión
curl https://bstddwmpsbfrwqaudkai.supabase.co/.well-known/ucp

# Verificar tablas
# Ve a Supabase Dashboard > Table Editor
```

### Verificar Variables de Entorno

```bash
# Frontend
cd chat-client
cat .env.local | grep VITE_

# Backend
cd business_agent
cat .env | grep SUPABASE
```

### Verificar Dependencias

```bash
# Frontend
cd chat-client
npm list @supabase/supabase-js react-router-dom framer-motion

# Backend
cd business_agent
pip list | grep -E "supabase|google-adk|ucp-sdk"
```

---

## 🧪 Testing de Componentes

### Probar Autenticación
```bash
# 1. Abre http://localhost:5173/login
# 2. Intenta login con credenciales incorrectas
# 3. Verifica que muestra error
# 4. Registra un nuevo usuario
# 5. Verifica que redirige a onboarding
```

### Probar Onboarding
```bash
# 1. Después de registro, deberías estar en /onboarding
# 2. Completa los 5 pasos
# 3. Verifica que el botón "Siguiente" se habilita solo cuando completas campos
# 4. Verifica la animación de slide
# 5. Al finalizar, verifica que redirige a /chat
```

### Probar Portal de Comercios
```bash
# 1. Abre http://localhost:5173/business
# 2. Click en "Registrar mi negocio"
# 3. Completa los 6 pasos
# 4. Verifica que muestra confirmación
```

---

## 📊 Logs Útiles

### Frontend (Browser Console)
```javascript
// Ver estado de autenticación
console.log(localStorage.getItem('supabase.auth.token'))

// Ver datos de onboarding
console.log(localStorage.getItem('jandi_onboarding_data'))
```

### Backend (Terminal)
```bash
# Ejecutar con logs detallados
cd business_agent
python -m business_agent.main --host localhost --port 10999

# Ver logs en tiempo real
tail -f logs/agent.log  # Si configuraste logging
```

---

## 🔐 Problemas de Seguridad

### RLS Policy Errors

Si ves errores de "policy violation":

1. **Verifica que el usuario está autenticado:**
```sql
SELECT auth.uid();  -- Debe retornar un UUID
```

2. **Verifica las políticas:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

3. **Deshabilita RLS temporalmente para debugging:**
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Hacer pruebas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 💾 Problemas de Base de Datos

### Tablas no existen

**Solución:**
```bash
# Re-ejecutar el schema
# Supabase Dashboard > SQL Editor > Pegar SUPABASE_SCHEMA.sql
```

### Datos corruptos

**Solución:**
```sql
-- Limpiar tabla específica
TRUNCATE TABLE user_profiles CASCADE;

-- O resetear todo (¡CUIDADO!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Luego re-ejecutar SUPABASE_SCHEMA.sql
```

---

## 🌐 Problemas de Red

### CORS Errors

Si ves errores de CORS en la consola:

**Solución:**
1. Verifica que el backend está corriendo
2. Verifica que la URL del backend en `.env.local` es correcta
3. Agrega headers CORS en el backend si es necesario

---

## 🎨 Problemas de UI

### Animaciones no funcionan

**Solución:**
```bash
# Verifica que framer-motion está instalado
npm list framer-motion

# Si no está:
npm install framer-motion
```

### Estilos no se aplican

**Solución:**
1. Verifica que `index.css` se importa en `index.tsx`
2. Verifica que las variables CSS están definidas
3. Limpia la caché del navegador (Cmd+Shift+R)

---

## 📱 Problemas de Routing

### Rutas no funcionan

**Solución:**
```bash
# Verifica que react-router-dom está instalado
npm list react-router-dom

# Verifica que index.tsx usa RouterProvider
grep "RouterProvider" chat-client/index.tsx
```

### Guards no redirigen

**Solución:**
1. Verifica que el usuario está en el contexto
2. Verifica que `onboarding_completed` está en la tabla users
3. Revisa la consola para errores

---

## 🔄 Reiniciar desde Cero

Si todo falla:

```bash
# 1. Limpiar frontend
cd chat-client
rm -rf node_modules dist .vite
npm install

# 2. Limpiar backend
cd business_agent
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -e .
pip install supabase

# 3. Limpiar base de datos
# Supabase Dashboard > SQL Editor:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
# Ejecutar SUPABASE_SCHEMA.sql

# 4. Limpiar localStorage
# Browser Console:
localStorage.clear()

# 5. Reiniciar
npm run dev
python -m business_agent.main
```

---

## 📞 Obtener Ayuda

### Logs a Revisar
1. Browser Console (F12)
2. Terminal del frontend
3. Terminal del backend
4. Supabase Logs (Dashboard > Logs)

### Información a Proveer
- Mensaje de error completo
- Stack trace
- Pasos para reproducir
- Versiones de dependencias
- Sistema operativo

---

## ✅ Verificación de Salud

### Checklist de Verificación
```bash
# ✅ Supabase
curl https://bstddwmpsbfrwqaudkai.supabase.co/.well-known/ucp

# ✅ Frontend
curl http://localhost:5173

# ✅ Backend
curl http://localhost:10999/.well-known/agent-card.json

# ✅ Base de datos
# Supabase Dashboard > Table Editor > Ver tablas
```

---

## 🎯 Solución Rápida por Error

| Error | Solución Rápida |
|-------|-----------------|
| Import error | `pip install -e .` |
| Module not found | `npm install` |
| Port in use | `lsof -ti:PORT \| xargs kill -9` |
| RLS violation | Verifica autenticación |
| SSL error | `--trusted-host pypi.org` |
| CORS error | Verifica backend corriendo |
| 404 Not Found | Verifica rutas en router |

---

## 💡 Tips

### Performance
- Limpia la caché del navegador regularmente
- Usa React DevTools para debugging
- Monitorea Network tab para requests lentos

### Desarrollo
- Usa `console.log` liberalmente
- Revisa Supabase Logs en tiempo real
- Usa breakpoints en DevTools

---

**Si el problema persiste, revisa la documentación completa o contacta al equipo.**
