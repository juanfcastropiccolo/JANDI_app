# Análisis Comparativo: PMS vs JANDI - Autenticación con Supabase

## 📊 Resumen Ejecutivo

Este documento compara la implementación de autenticación entre dos proyectos:
- **PMS** (Parkit Management System) - Next.js con Supabase - **✅ FUNCIONA**
- **JANDI** - React (Vite) con Supabase - **❌ PROBLEMAS CON GOOGLE AUTH**

---

## 🏗️ Diferencias Arquitectónicas Clave

| Aspecto | PMS | JANDI |
|---------|-----|-------|
| **Framework** | Next.js 14 (App Router) | React 18 (Vite) |
| **Routing** | Server-side + Client-side | Client-side (React Router) |
| **Auth Callback** | API Route (`route.ts`) | Component React (`AuthCallbackSimple.tsx`) |
| **Supabase Helper** | `@supabase/auth-helpers-nextjs` | `@supabase/supabase-js` directo |
| **detectSessionInUrl** | `true` | `false` |
| **flowType** | No especificado (default) | `pkce` |
| **Google OAuth** | ❌ No implementado | ✅ Implementado |
| **RLS Habilitado** | ✅ Sí | ✅ Sí |
| **Service Role Key** | ✅ Usado en API routes | ❌ No usado |

---

## 🔍 Análisis Detallado por Componente

### 1. Configuración de Supabase Client

#### PMS (supabase.ts)
```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // ✅ HABILITADO
  },
});
```

**✅ Ventajas:**
- `detectSessionInUrl: true` permite que Supabase maneje automáticamente los callbacks OAuth
- Compatible con Next.js SSR

#### JANDI (supabase.ts)
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // ❌ DESHABILITADO
    flowType: 'pkce',
  },
});
```

**❌ Problema:**
- `detectSessionInUrl: false` requiere manejo manual del callback
- `flowType: 'pkce'` es más seguro pero requiere implementación correcta del callback

---

### 2. Auth Callback

#### PMS - API Route (`/auth/callback/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirige al dashboard
  return NextResponse.redirect(requestUrl.origin + '/dashboard');
}
```

**✅ Ventajas:**
- **Ejecuta en el servidor** - No hay problemas de timing con el frontend
- **Usa `createRouteHandlerClient`** - Específico para Next.js
- **Cookies manejadas por Next.js** - Session persistida automáticamente
- **Simple y directo** - 6 líneas de código
- **No lee de la DB** - Solo intercambia código por sesión

#### JANDI - Component React (`AuthCallbackSimple.tsx`)
```typescript
// Ejecuta en el CLIENTE
const handleCallback = async () => {
  // 1. Intercambiar código
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  
  // 2. Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();
  
  // 3. Upsert usuario en DB (con RLS)
  const { data: existingUser } = await supabase.from('users').select().eq('id', userId).maybeSingle();
  
  if (!existingUser) {
    await supabase.from('users').insert({ id, email, ... });
  }
  
  // 4. Leer usuario de DB (con RLS) ⏱️ AQUÍ SE CUELGA
  const { data: userData } = await supabase.from('users').select().eq('id', userId).single();
  
  // 5. Refresh session
  await supabase.auth.refreshSession();
  
  // 6. Esperar 3 segundos
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 7. Redirigir
  navigate(destination);
};
```

**❌ Problemas:**
1. **Ejecuta en el cliente** - Race conditions con useAuth
2. **Múltiples queries a DB con RLS** - Las queries tardan 8+ segundos o timeout
3. **Depende de que useAuth cargue el usuario** - Timing complejo
4. **Esperas artificiales** - 3 segundos hardcodeados
5. **90+ líneas de código** vs 6 líneas de PMS

---

### 3. getCurrentUser() - ¿Por qué se cuelga?

#### PMS - No hace query a `users`
```typescript
async getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Obtiene roles usando API route (service role, sin RLS)
  const roles = await this.getUserRoles(user.id);

  return {
    id: user.id,
    email: user.email!,
    roles,
    metadata: user.user_metadata,
  };
}
```

**✅ Cómo evita el problema:**
- No hace query directa a la tabla `users`
- Usa una **API route con service_role** para leer datos sin RLS
- Solo usa `auth.getUser()` que es instantáneo

#### JANDI - Query directa con RLS
```typescript
async getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // ⏱️ QUERY QUE SE CUELGA (8+ segundos)
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData as User;
}
```

**❌ Por qué se cuelga:**
1. **RLS está habilitado** en la tabla `users`
2. La query usa `auth.uid()` en la política RLS
3. En el contexto del cliente, `auth.uid()` puede no estar disponible inmediatamente después del OAuth
4. **Posible problema de sincronización** entre el JWT y las políticas RLS
5. Supabase puede estar esperando que el JWT se propague a la DB

---

### 4. Políticas RLS

#### PMS - RLS con bypass mediante service_role
```sql
-- Política básica en users
CREATE POLICY "Users can read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

**Pero en el código:**
```typescript
// API route usa service_role que BYPASEA RLS
const supabaseAdmin = supabaseAdmin(); // service_role
const { data } = await supabaseAdmin.from('users').select();
```

**✅ Ventaja:** Las queries críticas NO pasan por RLS

#### JANDI - RLS sin bypass
```sql
-- Misma política
CREATE POLICY "Users can read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

**Pero en el código:**
```typescript
// Cliente usa anon_key - TODAS las queries pasan por RLS
const { data } = await supabase.from('users').select();
```

**❌ Problema:** Todas las queries pasan por RLS, sin alternativa

---

## 🎯 Causas Raíz del Problema en JANDI

### 1. **RLS Timing Issue**
Después del OAuth callback, el JWT del usuario puede no estar completamente sincronizado con las políticas RLS. Cuando `getCurrentUser()` intenta leer de `users`:

```sql
-- La política verifica:
USING (auth.uid() = id)
```

Pero `auth.uid()` puede devolver:
- `null` (JWT no propagado aún)
- Un valor pero la DB aún no reconoce la sesión
- Un valor correcto pero con lag de red

Resultado: **Query se cuelga esperando el JWT válido**

### 2. **Sin Service Role para Bypass**
PMS puede hacer queries críticas con `service_role` que ignora RLS:
```typescript
// PMS
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY);
const user = await supabaseAdmin.from('users').select(); // Sin RLS
```

JANDI no tiene esta opción en el frontend.

### 3. **Arquitectura Client-side vs Server-side**
- **PMS (Next.js)**: El callback OAuth ejecuta en el servidor, donde las cookies y el JWT se manejan de forma confiable
- **JANDI (React SPA)**: Todo ejecuta en el cliente, dependiendo de que el browser sincronice correctamente el JWT

### 4. **detectSessionInUrl: false**
JANDI deshabilitó esto para "evitar conflictos", pero eso significa:
- Supabase NO maneja automáticamente el código OAuth
- Hay que hacerlo manualmente en `AuthCallbackSimple`
- Más complejo y propenso a errores

---

## ✅ Soluciones Propuestas

### Opción 1: Migrar a Next.js (Solución Ideal)
Cambiar JANDI de React (Vite) a Next.js para:
- Usar `@supabase/auth-helpers-nextjs`
- Callbacks OAuth en API routes (servidor)
- Bypass de RLS con service_role cuando sea necesario

**Pros:** 
- Resuelve el problema completamente
- Arquitectura más robusta
- SSR, SEO, mejores prácticas

**Contras:**
- Requiere refactorizar toda la app
- Tiempo significativo de desarrollo

---

### Opción 2: Habilitar `detectSessionInUrl: true`
Cambiar la configuración de Supabase para que maneje el callback automáticamente:

```typescript
// supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,  // ✅ HABILITAR
    flowType: 'pkce',
  },
});
```

**Luego:**
1. Eliminar `AuthCallbackSimple.tsx` completamente
2. Dejar que Supabase maneje el código OAuth automáticamente
3. Simplificar el routing: `/auth/callback` puede ser una ruta vacía o redirigir directo

**Pros:**
- Simple, menos código
- Menos propenso a errores
- Supabase maneja el timing

**Contras:**
- Menos control sobre el flujo
- Puede haber conflictos con React Router (hay que testear)

---

### Opción 3: Crear Backend API para Auth (Solución Intermedia)
Crear un backend simple (Express, NestJS, o Next.js API only) que:
1. Maneje el callback OAuth
2. Use service_role para crear/actualizar usuarios (sin RLS)
3. Redirija al frontend con el usuario listo

**Arquitectura:**
```
Google OAuth → Supabase → Backend API (/auth/callback)
                                ↓
                          service_role query
                                ↓
                          Frontend (usuario listo)
```

**Pros:**
- Resuelve el problema de RLS
- Mantiene React SPA
- Más control

**Contras:**
- Requiere infraestructura adicional
- Más complejo de deployar

---

### Opción 4: Deshabilitar RLS Temporalmente (No Recomendado para Producción)
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Solo para confirmar que RLS es el problema, luego buscar otra solución.

**Pros:**
- Confirma el diagnóstico
- Solución inmediata

**Contras:**
- **Inseguro** - Cualquiera puede leer/escribir users
- No es viable para producción

---

### Opción 5: Simplificar el Callback (Solución Actual Mejorada)
Si mantenemos la arquitectura actual, simplificar al máximo:

```typescript
// AuthCallbackSimple.tsx - VERSIÓN SIMPLIFICADA
const handleCallback = async () => {
  const code = url.searchParams.get('code');
  
  if (!code) {
    navigate('/login');
    return;
  }

  // 1. Intercambiar código
  await supabase.auth.exchangeCodeForSession(code);
  
  // 2. Redirigir inmediatamente - dejar que AuthGuard y useAuth manejen el resto
  navigate('/onboarding');
};
```

**Cambios necesarios:**
- NO intentar leer el usuario en el callback
- NO hacer upsert manual - usar database triggers
- Dejar que `useAuth` cargue el usuario con reintentos
- `AuthGuard` debe esperar más tiempo (15-20 segundos)

**Pros:**
- Menos cambios
- Mantiene la arquitectura actual

**Contras:**
- Sigue dependiendo de timing
- Puede seguir fallando si RLS es lento

---

## 📋 Recomendación Final

**Orden de preferencia:**

1. **Opción 2** (Corto plazo) - Habilitar `detectSessionInUrl: true` + eliminar callback manual
   - Más rápido de implementar
   - Menos código = menos bugs
   - Si funciona, problema resuelto

2. **Opción 3** (Mediano plazo) - Backend API para auth
   - Si la Opción 2 no funciona
   - Mantiene React SPA
   - Bypass de RLS confiable

3. **Opción 1** (Largo plazo) - Migrar a Next.js
   - Solo si JANDI va a crecer mucho
   - Beneficios más allá de auth (SEO, SSR, etc.)

---

## 🔧 Próximos Pasos (NO EJECUTAR TODAVÍA)

### Para Opción 2:
1. Backup del código actual
2. Cambiar `detectSessionInUrl: false` → `true` en `supabase.ts`
3. Eliminar `AuthCallbackSimple.tsx`
4. Actualizar routing en `index.tsx` - `/auth/callback` puede ser ruta vacía
5. Testear login con Google

### Para Opción 3:
1. Crear backend simple (puede ser Next.js API standalone)
2. Configurar `SUPABASE_SERVICE_ROLE_KEY`
3. Crear endpoint `/api/auth/callback`
4. Actualizar redirect URL en Google Console y Supabase
5. Frontend solo recibe sesión lista

### Para depuración adicional:
1. Ejecutar `TEST_RLS.sql` en Supabase mientras estás autenticado en la app
2. Medir tiempo exacto de queries con Network tab en DevTools
3. Revisar logs de Supabase Dashboard → Logs → Postgres
4. Verificar que `auth.uid()` no sea null en queries RLS

---

## 📊 Tabla Comparativa Final

| Característica | PMS | JANDI | Impacto |
|----------------|-----|-------|---------|
| Callback en servidor | ✅ | ❌ | 🔴 Alto |
| Service role disponible | ✅ | ❌ | 🔴 Alto |
| detectSessionInUrl | ✅ | ❌ | 🟡 Medio |
| Queries directas a users con RLS | ❌ | ✅ | 🔴 Alto |
| Complejidad del callback | Baja | Alta | 🟡 Medio |
| Framework moderno | ✅ | ✅ | 🟢 Bajo |
| Google OAuth | ❌ | ✅ | 🟢 Bajo |

**Conclusión:** El problema NO es Google OAuth en sí, sino cómo se maneja en una arquitectura client-side con RLS habilitado y sin bypass mediante service_role.

---

Documento generado: 2026-01-26
