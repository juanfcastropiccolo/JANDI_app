# Solución: Problemas de Autenticación y Callback

## Problemas identificados

1. **Loading infinito en login**: El hook `useAuth` estaba bloqueando la UI esperando a que `getCurrentUser()` terminara, pero Supabase abortaba las peticiones causando demoras.

2. **AbortError repetidos**: Supabase estaba abortando peticiones porque:
   - `detectSessionInUrl` estaba interfiriendo con las peticiones normales
   - No estábamos esperando a que Supabase terminara de procesar el OAuth callback
   - Las políticas RLS pueden no estar configuradas correctamente

## Cambios realizados

### 1. `chat-client/hooks/useAuth.ts`
- **Antes**: Bloqueaba el UI con `loading=true` hasta que `getCurrentUser()` terminara
- **Ahora**: 
  - Verifica rápidamente si hay sesión con `getSession()` (más rápido)
  - Solo si hay sesión intenta cargar el perfil de la DB
  - Siempre termina el loading inicial rápido para que el usuario pueda hacer login
  - Mejor manejo de AbortError (los ignora silenciosamente)
  - En `onAuthStateChange`, espera 100ms antes de cargar el perfil para dar tiempo a Supabase

### 2. `chat-client/components/Auth/AuthCallback.tsx`
- **Antes**: Intentaba acceder a la DB inmediatamente después del callback
- **Ahora**:
  - Muestra mensajes de progreso claros
  - Espera 500ms después de `exchangeCodeForSession` para que Supabase procese todo
  - Verifica que haya sesión antes de continuar
  - Espera 300ms adicionales antes de cargar el perfil
  - Mejor manejo de errores con mensajes claros

### 3. `chat-client/services/auth.service.ts`
- Usa `.maybeSingle()` en vez de `.single()` para evitar errores cuando el usuario no existe
- Mejor manejo de errores de RLS
- Propaga AbortError para que `useAuth` lo maneje correctamente

### 4. `chat-client/services/supabase.ts`
- Agregado `flowType: 'pkce'` explícitamente para asegurar el flujo correcto de OAuth

### 5. Nuevo: `SUPABASE_RLS_POLICIES.sql`
- Políticas RLS para la tabla `users` y otras tablas
- **CRÍTICO**: Sin estas políticas, los usuarios no pueden leer/escribir sus propios datos

## Configuración requerida en Supabase

### Paso 1: Aplicar políticas RLS (MUY IMPORTANTE)

Ve al **SQL Editor** en Supabase y ejecuta el contenido de `SUPABASE_RLS_POLICIES.sql`.

**Sin estas políticas**, los usuarios no pueden:
- Leer su propio registro de la tabla `users`
- Crear su registro al hacer login con Google
- Actualizar su perfil

Esto causa los `AbortError` porque las consultas son bloqueadas por RLS.

### Paso 2: Configurar Google OAuth

#### En Google Cloud Console

1. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5173
   https://bstddwmpsbfrwqaudkai.supabase.co
   ```

2. **Authorized redirect URIs**:
   ```
   https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   http://localhost:5173/auth/callback
   ```

#### En Supabase Dashboard

1. Ve a **Authentication → Providers → Google**
2. Habilita el provider
3. Pega tu **Client ID** y **Client Secret** de Google

4. Ve a **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Agrega:
     ```
     http://localhost:3000/**
     http://localhost:5173/**
     ```

## Cómo probar

1. **Hard refresh** en el navegador (Ctrl+Shift+R / Cmd+Shift+R)

2. **Login con email/contraseña**:
   - Ya no debería haber delay inicial
   - El botón "Ingresar" debería estar habilitado inmediatamente
   - Si hay error, debería mostrarse claramente

3. **Login con Google**:
   - Click en "Continuar con Google"
   - Debería redirigir a Google
   - Después de autorizar, volver a `/auth/callback`
   - Ver mensajes de progreso:
     - "Autenticando con Google..."
     - "Configurando tu cuenta..."
     - "Creando tu perfil..."
     - "¡Listo! Redirigiendo..."
   - Finalmente redirigir a `/onboarding` o `/chat`

## Errores comunes

### "signal is aborted without reason"
- **Causa**: RLS está bloqueando las consultas
- **Solución**: Ejecutar `SUPABASE_RLS_POLICIES.sql` en Supabase

### "No se pudo cargar el perfil del usuario"
- **Causa 1**: El usuario no existe en la tabla `users`
- **Causa 2**: RLS no permite leer
- **Solución**: Verificar que las políticas RLS estén aplicadas

### "redirect_uri_mismatch" (Google)
- **Causa**: El redirect URI no está autorizado en Google Console
- **Solución**: Agregar `https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback` a los Authorized redirect URIs

## Verificación rápida

Abrí la consola del navegador y ejecutá:

```javascript
// Verificar si hay sesión
const { data, error } = await window.supabase.auth.getSession()
console.log('Session:', data.session)

// Verificar si podés leer tu usuario
if (data.session) {
  const { data: user, error } = await window.supabase
    .from('users')
    .select('*')
    .eq('id', data.session.user.id)
    .single()
  console.log('User:', user, 'Error:', error)
}
```

Si el segundo query devuelve un error de permisos, **necesitás aplicar las políticas RLS**.
