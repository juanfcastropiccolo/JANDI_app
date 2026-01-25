# Diagnóstico Integral: Problema de Autenticación OAuth

## 🔍 Síntomas observados

1. ✅ Google OAuth redirige correctamente a `/auth/callback?code=...`
2. ✅ El código se intercambia por sesión (`exchangeCodeForSession`)
3. ❌ **Aparece `AbortError: signal is aborted without reason`**
4. ❌ El callback se queda congelado en "Autenticando con Google..."
5. ❌ No redirige a `/onboarding` ni `/chat`

## 🐛 Posibles causas (ordenadas por probabilidad)

### 1. **Políticas RLS no aplicadas o mal configuradas** (MÁS PROBABLE)

**Síntoma**: `AbortError` cuando intenta leer/escribir en la tabla `users`

**Causa**: Sin las políticas RLS correctas, Supabase **bloquea silenciosamente** las operaciones y puede abortar las peticiones.

**Cómo verificar**:
```sql
-- Ejecutar en Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
-- Debe devolver: rowsecurity = true

SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
-- Debe devolver 3 políticas: INSERT, SELECT, UPDATE
```

**Solución**: Ejecutar `SUPABASE_RLS_POLICIES.sql` en el SQL Editor.

---

### 2. **La tabla `users` no existe o tiene estructura incorrecta**

**Síntoma**: Error al intentar INSERT/SELECT en la tabla `users`

**Cómo verificar**:
```sql
-- Ejecutar en Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
```

**Solución**: Ejecutar `SUPABASE_SCHEMA.sql` en el SQL Editor.

---

### 3. **Google OAuth mal configurado**

**Síntoma**: El callback tiene el código pero `exchangeCodeForSession` falla

**Cómo verificar**:
- Ve a **Supabase Dashboard → Authentication → Providers → Google**
- Verificá que esté **habilitado**
- Verificá que el **Client ID** y **Client Secret** sean correctos

- Ve a **Google Cloud Console → APIs & Services → Credentials**
- Verificá **Authorized redirect URIs**:
  ```
  https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback
  ```

**Solución**: Agregar la URI correcta en Google Console.

---

### 4. **React Strict Mode causando doble ejecución**

**Síntoma**: El código se ejecuta 2 veces, causando que el segundo intento falle con "code already used"

**Cómo verificar**: Buscar en la consola:
```
[AuthCallback] Code already processed/processing, skipping...
```

**Solución**: Ya implementé `useRef` para evitar esto, pero si persiste, desactivar Strict Mode temporalmente en `index.tsx`.

---

### 5. **Supabase JS está abortando peticiones automáticamente**

**Síntoma**: `AbortError` en `getCurrentUser()` o en operaciones de la tabla `users`

**Causa**: `detectSessionInUrl: true` (aunque ya lo cambié a `false`)

**Solución**: Ya desactivé `detectSessionInUrl`, pero puede haber otros conflictos.

---

### 6. **Timeout en las operaciones de Supabase**

**Síntoma**: Las operaciones tardan mucho y se abortan

**Causa**: Latencia de red, problemas de Supabase, o índices faltantes

**Solución**: Agregar timeouts más largos y reintentos.

---

### 7. **El usuario autenticado no coincide con el userId en la tabla**

**Síntoma**: El INSERT falla porque el `id` no coincide con `auth.uid()`

**Causa**: Las políticas RLS verifican que `auth.uid() = id`, pero estamos usando el ID incorrecto

**Solución**: Verificar que usamos `authUser.id` correcto en el INSERT.

---

### 8. **La sesión no se persiste correctamente**

**Síntoma**: Después de `exchangeCodeForSession`, la sesión es `null`

**Causa**: `persistSession: false` o problema con localStorage

**Solución**: Verificar que `persistSession: true` esté configurado (ya lo está).

---

## 🔧 Plan de acción (paso a paso)

### Paso 1: Verificar que las tablas existan
```sql
-- En Supabase SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'user_profiles', 'conversations', 'messages');
```

Si no existen las tablas:
1. Ejecutar `SUPABASE_SCHEMA.sql` completo

### Paso 2: Verificar políticas RLS
```sql
-- En Supabase SQL Editor
SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';
```

Si no hay políticas o RLS no está habilitado:
1. Ejecutar `SUPABASE_RLS_POLICIES.sql`

### Paso 3: Probar inserción manual
```sql
-- En Supabase SQL Editor (después de hacer login con Google)
-- Reemplazar 'TU_USER_ID' con tu UUID real (lo podés ver en los logs)
INSERT INTO users (id, email, full_name, auth_provider, onboarding_completed, is_active, last_login_at)
VALUES ('TU_USER_ID', 'tu@email.com', 'Tu Nombre', 'google', false, true, NOW());
```

Si esto falla con "permission denied":
- Las políticas RLS están mal
- Ejecutar nuevamente `SUPABASE_RLS_POLICIES.sql`

### Paso 4: Verificar configuración de Google OAuth

En **Supabase Dashboard → Authentication → Providers → Google**:
- ✅ Habilitado
- ✅ Client ID correcto
- ✅ Client Secret correcto

En **Google Cloud Console**:
- ✅ Authorized redirect URIs incluye: `https://bstddwmpsbfrwqaudkai.supabase.co/auth/v1/callback`

### Paso 5: Probar el nuevo callback simplificado

Voy a crear un callback más simple que:
- No dependa de RLS inicialmente
- Muestre errores más claros
- No use `detectSessionInUrl`
- Maneje mejor los AbortError

---

## 🚨 Error más común: RLS no configurado

El 90% de las veces, el problema es que **las políticas RLS no están aplicadas**.

**Prueba rápida**:
1. Ve a **Supabase Dashboard → Authentication → Policies**
2. Buscá la tabla `users`
3. Deberías ver 3 políticas:
   - "Users can insert their own record"
   - "Users can read their own record"
   - "Users can update their own record"

Si no las ves, **ejecutá `SUPABASE_RLS_POLICIES.sql` en el SQL Editor**.

---

## 📝 Logs útiles

Cuando probés el login con Google, en la consola deberías ver:

```
✅ [AuthCallback] Starting callback flow...
✅ [AuthCallback] Found code, exchanging for session...
✅ [AuthCallback] Code exchanged successfully
✅ [AuthCallback] Session verified, user: tu@email.com
✅ [AuthCallback] Starting ensureUserRowExists...
❌ [AuthCallback] Error checking existing user: [VER ERROR AQUÍ]
```

El último error es el **más importante**: te dice exactamente qué está fallando.
