# Plan de Solución: Redirección Incorrecta de Usuarios Business al Onboarding de Consumidor

**Fecha:** 28 de enero de 2026 (Actualizado: 31 de enero de 2026)  
**Problema:** Los usuarios de tipo "business" están siendo redirigidos al onboarding de consumidor (`/onboarding`) cuando deberían ir directamente al dashboard de su negocio (`/business/dashboard/:businessId`).

---

## ⚠️ ACTUALIZACIÓN IMPORTANTE (31 Enero 2026)

Después de revisar los datos reales en Supabase, se identificó que:

1. **`user_type` está en `users.metadata` (campo JSONB)**, NO en `auth.users.raw_user_meta_data`
2. La solución debe usar **`user.metadata.user_type`**, NO `user.user_metadata.user_type`
3. Se recomienda **mejorar el esquema de base de datos** agregando una columna `user_type` directa (ver Paso 4 Opcional)

**Datos reales en la tabla users:**

| Email | metadata.user_type | Estado |
|-------|-------------------|---------|
| `juan@integralo.io` | `'business'` | ✅ Correcto |
| `juanfcastropiccolo@gmail.com` | `undefined` | ✅ Se trata como 'consumer' |

---

## 🔍 Análisis del Problema

### Estructura de Datos en Supabase

**Tabla `users` (nuestra tabla custom):**
```sql
create table public.users (
  id uuid not null,
  email character varying(255) not null,
  full_name character varying(255) null,
  metadata jsonb null default '{}'::jsonb,  -- ⚠️ AQUÍ está user_type
  onboarding_completed boolean null default false,
  -- ... otras columnas
);
```

**Ejemplos de datos reales:**

1. **Usuario Business** (juan@integralo.io):
```json
{
  "metadata": {
    "user_type": "business",
    "onboarding_completed": false
  },
  "onboarding_completed": false
}
```

2. **Usuario Consumer** (juanfcastropiccolo@gmail.com):
```json
{
  "metadata": {
    "iss": "https://accounts.google.com",
    "name": "Juan Castro Piccolo",
    "email": "juanfcastropiccolo@gmail.com",
    // ❌ NO tiene "user_type" definido
  },
  "onboarding_completed": false
}
```

### Escenario Actual (ROTO)

```
1. Usuario business hace login en /business/login
2. BusinessLoginForm verifica credenciales ✅
3. BusinessLoginForm verifica user_type === 'business' ✅
4. BusinessLoginForm busca negocio en tabla businesses ✅
5. Encuentra negocio → llama onLoginSuccess(businessId) ✅
6. Router navega a /business/dashboard/:businessId ✅
7. ❌ PERO: AuthGuard permite acceso (usuario autenticado)
8. ❌ OnboardingGuard verifica onboarding_completed
   - user.onboarding_completed = false (usuarios business NO completan este onboarding)
   - NO verifica user.metadata.user_type
   - Redirige a /onboarding ❌❌❌
9. Usuario business termina en onboarding de consumidor ❌
```

### Causa Raíz

El **`OnboardingGuard`** NO distingue entre usuarios tipo "consumer" y tipo "business":

```typescript:chat-client/router/OnboardingGuard.tsx
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  // ❌ PROBLEMA: Solo verifica onboarding_completed
  // NO verifica el tipo de usuario en metadata
  if (user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
```

**El problema:**
- Usuarios **consumer** tienen `metadata.user_type` undefined o 'consumer' + `onboarding_completed: false` → deben hacer onboarding ✅
- Usuarios **business** tienen `metadata.user_type: 'business'` + `onboarding_completed: false` → NO deben hacer ese onboarding ❌
- El guard actual redirige a **TODOS** los usuarios con `onboarding_completed: false`

### ⚠️ Diferencia Crítica: metadata vs user_metadata

**IMPORTANTE:** Hay DOS campos `metadata` diferentes:

1. **`auth.users.raw_user_meta_data`** → En el Auth User de Supabase
   - Accesible como `authUser.user_metadata`
   - Contiene datos de OAuth (Google, etc.)
   - NO controlamos esto directamente

2. **`public.users.metadata`** → En nuestra tabla custom
   - Accesible como `user.metadata` después de `getFullUser()`
   - Aquí guardamos `user_type: 'business' | 'consumer'`
   - Lo controlamos nosotros

**En nuestro código, debemos verificar `user.metadata.user_type`** (de la tabla users), NO `user.user_metadata.user_type` (del Auth)

### Arquitectura de Tipos de Usuario

```
Tabla users (nuestra tabla custom)
├── metadata.user_type = 'consumer' (o undefined) → Onboarding de consumidor (/onboarding)
└── metadata.user_type = 'business' → Onboarding de negocio (/business/onboarding)
```

**Usuarios Consumer:**
- `metadata.user_type`: undefined o 'consumer'
- Hacen onboarding en `/onboarding` (6 pasos)
- Al completarlo, `users.onboarding_completed = true`
- Pueden acceder a `/chat`

**Usuarios Business:**
- `metadata.user_type`: 'business'
- Hacen onboarding en `/business/onboarding` (registro de negocio)
- Al completarlo, crean registro en tabla `businesses`
- `users.onboarding_completed` permanece `false` (no hacen el onboarding de consumidor)
- Acceden a `/business/dashboard/:businessId`

---

## 🎯 Solución Propuesta

### Opción A: Modificar OnboardingGuard para Verificar Tipo de Usuario (RECOMENDADA)

Actualizar el `OnboardingGuard` para que **SOLO** redirija a usuarios de tipo "consumer":

**Ventajas:**
- ✅ Solución simple y directa
- ✅ Un solo archivo modificado
- ✅ Mantiene la lógica de guards separada
- ✅ Fácil de entender y mantener

**Desventajas:**
- ⚠️ El OnboardingGuard ahora conoce sobre tipos de usuario

**Implementación:**

```typescript
// router/OnboardingGuard.tsx

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  // SOLUCIÓN: Solo redirigir usuarios consumer que no completaron onboarding
  if (user) {
    // ⚠️ CRÍTICO: Leer user_type de metadata (tabla users), NO de user_metadata (auth)
    const userType = user.metadata?.user_type || 'consumer';
    
    console.log('[OnboardingGuard] User type:', userType, 'from metadata:', user.metadata);
    
    // Si es usuario business, permitir acceso sin verificar onboarding
    if (userType === 'business') {
      console.log('[OnboardingGuard] Business user, allowing access');
      return <>{children}</>;
    }
    
    // Si es usuario consumer y no completó onboarding, redirigir
    if (!user.onboarding_completed) {
      console.log('[OnboardingGuard] Consumer user without onboarding, redirecting');
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
```

### Opción B: Crear BusinessAuthGuard Separado

Crear un guard específico para rutas de business que maneje toda la lógica de business.

**Ventajas:**
- ✅ Separación de responsabilidades clara
- ✅ Más robusto para escalar

**Desventajas:**
- ⚠️ Más archivos y complejidad
- ⚠️ Duplicación de lógica de autenticación

**Implementación:**

```typescript
// router/BusinessAuthGuard.tsx (NUEVO ARCHIVO)

export function BusinessAuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Verificar tipo de usuario
      const userType = user.user_metadata?.user_type;
      if (userType !== 'business') {
        console.log('❌ Not a business user');
        setHasAccess(false);
        return;
      }

      // Verificar si tiene negocio
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', user.email)
        .single();

      if (business) {
        setBusinessId(business.id);
        setHasAccess(true);
      } else {
        // Redirigir a onboarding de business
        setHasAccess(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading]);

  if (loading || hasAccess === null) {
    return <LoadingSpinner />;
  }

  if (!user || hasAccess === false) {
    return <Navigate to="/business/login" replace />;
  }

  return <>{children}</>;
}
```

Luego actualizar rutas:

```typescript
// router/index.tsx
{
  path: '/business/dashboard/:businessId',
  element: (
    <BusinessAuthGuard>
      <BusinessDashboard />
    </BusinessAuthGuard>
  ),
}
```

### Opción C: Modificar AuthGuard con Lógica de Tipos

Agregar lógica de tipos de usuario directamente en `AuthGuard`.

**Ventajas:**
- ✅ Centraliza toda la lógica de autenticación

**Desventajas:**
- ❌ AuthGuard se vuelve demasiado complejo
- ❌ Mezcla responsabilidades

**NO RECOMENDADA**

---

## 📋 Plan de Implementación (Opción A - RECOMENDADA)

### Paso 1: Actualizar OnboardingGuard

**Archivo:** `chat-client/router/OnboardingGuard.tsx`

**Cambios:**
1. Agregar verificación de `user.metadata.user_type` (de tabla users)
2. Permitir acceso a usuarios business sin verificar `onboarding_completed`
3. Solo redirigir a `/onboarding` a usuarios consumer sin onboarding completado
4. Agregar logs detallados para debugging

**Código:**

```typescript
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  if (user) {
    // ⚠️ CRÍTICO: Leer de user.metadata (tabla users), NO de user.user_metadata (auth)
    const userType = user.metadata?.user_type || 'consumer';
    
    console.log('[OnboardingGuard] User type:', userType, 'onboarding_completed:', user.onboarding_completed);
    console.log('[OnboardingGuard] Metadata:', user.metadata);
    
    // Si es usuario business, permitir acceso sin verificar onboarding
    // Los usuarios business tienen su propio flujo de onboarding
    if (userType === 'business') {
      console.log('[OnboardingGuard] Business user detected, allowing access');
      return <>{children}</>;
    }
    
    // Si es usuario consumer (tipo por defecto cuando user_type no está definido)
    // Verificar si completó el onboarding de consumidor
    if (!user.onboarding_completed) {
      console.log('[OnboardingGuard] Consumer user without onboarding, redirecting to /onboarding');
      return <Navigate to="/onboarding" replace />;
    }
    
    console.log('[OnboardingGuard] Consumer user with onboarding completed, allowing access');
  }

  return <>{children}</>;
}
```

### Paso 2: Verificar Integración con getFullUser

**Importante:** Verificar que `getFullUser()` en `auth.service.ts` incluya `metadata` de la tabla users en el objeto combinado.

**Archivo:** `chat-client/services/auth.service.ts`

**Verificar que la función incluya:**

```typescript
const fullUser: CustomUser = {
  ...authUser,
  ...dbUser,
  // ✅ CRÍTICO: metadata viene de dbUser (tabla users)
  metadata: dbUser.metadata || {}, // Aquí está user_type
  // Asegurar propiedades críticas
  onboarding_completed: dbUser.onboarding_completed ?? false,
  full_name: dbUser.full_name,
  phone: dbUser.phone,
  auth_provider: dbUser.auth_provider,
  is_active: dbUser.is_active,
  email: authUser.email!,
  id: authUser.id,
};
```

**IMPORTANTE:** El campo `metadata` debe venir de `dbUser` (tabla users), NO de `authUser`.

Si `metadata` no está incluido, agregarlo explícitamente.

### Paso 3: Actualizar Tipos TypeScript

**Archivo:** `chat-client/types/auth.types.ts`

Verificar que el tipo `User` incluya `metadata` con el tipo correcto:

```typescript
export interface User extends Partial<SupabaseUser> {
  id: string;
  email: string;
  
  // Propiedades de la tabla users
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  google_id?: string;
  auth_provider: 'email' | 'google';
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  
  // ✅ CRÍTICO: metadata de la tabla users (aquí está user_type)
  metadata?: {
    user_type?: 'consumer' | 'business';
    [key: string]: any;
  };
}
```

**IMPORTANTE:** El campo `metadata` es de la tabla `users`, no confundir con `user_metadata` del Auth User.

### Paso 4: (OPCIONAL PERO RECOMENDADO) Mejorar Esquema de Base de Datos

**Problema actual:** `user_type` está dentro del campo JSON `metadata`, lo que:
- ❌ Dificulta hacer queries SQL eficientes
- ❌ No tiene validación a nivel de base de datos
- ❌ Puede causar inconsistencias
- ❌ Es menos legible

**Solución recomendada:** Agregar columna `user_type` directamente en la tabla `users`.

**Script SQL:**

```sql
-- 1. Agregar columna user_type
ALTER TABLE public.users 
ADD COLUMN user_type character varying(20) NULL DEFAULT 'consumer';

-- 2. Crear constraint para validar valores
ALTER TABLE public.users
ADD CONSTRAINT users_user_type_check 
CHECK (user_type IN ('consumer', 'business'));

-- 3. Migrar datos existentes del metadata JSON a la nueva columna
UPDATE public.users
SET user_type = COALESCE(
  (metadata->>'user_type')::character varying,
  'consumer'
)
WHERE user_type IS NULL;

-- 4. Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_users_user_type 
ON public.users USING btree (user_type);

-- 5. (Opcional) Limpiar user_type del metadata JSON
UPDATE public.users
SET metadata = metadata - 'user_type'
WHERE metadata ? 'user_type';

-- 6. Hacer la columna NOT NULL después de migrar datos
ALTER TABLE public.users 
ALTER COLUMN user_type SET NOT NULL;
```

**Si se implementa este cambio:**

El código del OnboardingGuard se simplifica aún más:

```typescript
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  if (user) {
    // Ahora es más simple: user_type es una columna directa
    const userType = user.user_type || 'consumer';
    
    console.log('[OnboardingGuard] User type:', userType);
    
    if (userType === 'business') {
      return <>{children}</>;
    }
    
    if (!user.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
```

Y actualizar el tipo TypeScript:

```typescript
export interface User extends Partial<SupabaseUser> {
  id: string;
  email: string;
  user_type: 'consumer' | 'business'; // ✅ Columna directa
  onboarding_completed: boolean;
  // ... resto de propiedades
}
```

**Ventajas de esta mejora:**
- ✅ Queries SQL más simples y rápidas
- ✅ Validación a nivel de base de datos
- ✅ Código más legible
- ✅ Menos propenso a errores
- ✅ Mejor para escalabilidad

**Tiempo estimado:** 15 minutos (incluye backup y testing)

**Riesgo:** Bajo (si se hace con backup previo)

### Paso 5: Testing

**Escenarios de prueba:**

#### Test 1: Usuario Business con Negocio Existente

1. Login como usuario business que ya tiene negocio
2. Verificar que va directo a `/business/dashboard/:businessId`
3. Verificar que NO pasa por `/onboarding`
4. En consola debe aparecer: `[OnboardingGuard] Business user detected, allowing access`

#### Test 2: Usuario Business sin Negocio

1. Login como usuario business SIN negocio
2. Debería ir a `/business/onboarding` (manejado por BusinessLoginForm)
3. NO debe pasar por OnboardingGuard

#### Test 3: Usuario Consumer sin Onboarding

1. Registrarse como consumer (con Google o email)
2. Verificar que va a `/onboarding`
3. En consola debe aparecer: `[OnboardingGuard] Consumer user without onboarding, redirecting`

#### Test 4: Usuario Consumer con Onboarding Completado

1. Login como consumer que ya completó onboarding
2. Verificar que va directo a `/chat`
3. En consola debe aparecer: `[OnboardingGuard] Consumer user with onboarding completed, allowing access`

### Paso 5: Compilar y Verificar

```bash
cd chat-client
npm run build
```

Verificar que no hay errores de TypeScript.

---

## 🔄 Flujo Corregido

### Usuario Business - Login

```
1. Usuario business hace login en /business/login
2. BusinessLoginForm verifica credenciales ✅
3. BusinessLoginForm verifica user_type === 'business' ✅
4. BusinessLoginForm busca negocio en tabla businesses ✅
5a. SI tiene negocio:
    → Navega a /business/dashboard/:businessId
    → OnboardingGuard detecta user_type === 'business'
    → ✅ Permite acceso sin verificar onboarding_completed
    → Usuario ve su Dashboard ✅
    
5b. SI NO tiene negocio:
    → Navega a /business/onboarding
    → BusinessOnboardingGuard maneja la lógica
    → Al completar, crea negocio en DB
    → Redirige a /business/dashboard/:businessId ✅
```

### Usuario Consumer - Login

```
1. Usuario consumer hace login (Google o email)
2. AuthCallbackSimple o LoginForm autentica ✅
3. Navega a /chat
4. OnboardingGuard detecta user_type === 'consumer' (o undefined = default consumer)
5. Verifica onboarding_completed
6a. SI onboarding_completed === false:
    → ✅ Redirige a /onboarding
    → Usuario completa 6 pasos
    → onboarding_completed = true
    → Redirige a /chat ✅
    
6b. SI onboarding_completed === true:
    → ✅ Permite acceso a /chat ✅
```

---

## 🚨 Puntos Críticos

### 1. metadata de tabla users en getFullUser

**CRÍTICO:** Asegurarse de que `getFullUser()` incluye `metadata` de la tabla users (aquí está `user_type`).

```typescript
// ❌ MAL: Pierde metadata de tabla users
const fullUser: CustomUser = {
  ...authUser,  // Solo tiene propiedades del Auth User
  id: authUser.id,
  email: authUser.email,
  onboarding_completed: dbUser.onboarding_completed,
  // ❌ Falta metadata con user_type
};

// ✅ BIEN: Incluye metadata con user_type
const fullUser: CustomUser = {
  ...authUser,
  ...dbUser,    // ✅ Incluye metadata de la tabla users
  metadata: dbUser.metadata || {}, // ✅ Asegurar explícitamente
  onboarding_completed: dbUser.onboarding_completed,
};
```

### 2. Valor por Defecto de user_type

Si `metadata.user_type` es `undefined`, asumir `'consumer'` por defecto:

```typescript
const userType = user.metadata?.user_type || 'consumer';
```

Esto asegura retrocompatibilidad con usuarios existentes que no tienen `user_type` definido en metadata.

**Por ejemplo:**
- Usuario consumer con Google (juanfcastropiccolo@gmail.com): `metadata.user_type` = undefined → se trata como 'consumer' ✅
- Usuario business (juan@integralo.io): `metadata.user_type` = 'business' → se trata como 'business' ✅

### 3. Usuarios Existentes en Base de Datos

**Problema potencial:** Usuarios business existentes que no tienen `user_type` en el campo `metadata` de la tabla `users`.

**Solución - Script SQL:**

```sql
-- Script para actualizar usuarios business existentes
-- Agregar user_type: 'business' al metadata JSON para usuarios que tienen negocio

UPDATE public.users
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"user_type": "business"}'::jsonb
WHERE email IN (
  SELECT DISTINCT email 
  FROM public.businesses
)
AND (metadata->>'user_type') IS NULL;

-- Verificar cambios
SELECT 
  id, 
  email, 
  metadata->>'user_type' as user_type,
  metadata
FROM public.users
WHERE email IN (SELECT DISTINCT email FROM public.businesses);
```

**Alternativa (si implementaste la columna user_type del Paso 4 Opcional):**

```sql
-- Actualizar columna user_type directamente
UPDATE public.users
SET user_type = 'business'
WHERE email IN (
  SELECT DISTINCT email 
  FROM public.businesses
)
AND user_type != 'business';
```

Ejecutar uno de estos scripts en Supabase SQL Editor para usuarios business existentes.

### 4. AuthCallbackSimple para Business

Verificar que cuando un usuario business se registra con Google, se establece correctamente `user_type: 'business'`.

Actualmente `AuthCallbackSimple` se usa para consumidores. Los negocios usan `BusinessAuthCallback`.

---

## 📊 Matriz de Decisión

| Criterio | Opción A (Modificar OnboardingGuard) | Opción B (BusinessAuthGuard) | Opción C (Modificar AuthGuard) |
|----------|-------------------------------------|------------------------------|--------------------------------|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Tiempo de implementación** | ⭐⭐⭐⭐⭐ (5 min) | ⭐⭐⭐ (30 min) | ⭐⭐⭐ (20 min) |
| **Escalabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Testing necesario** | ⭐⭐⭐⭐⭐ (minimal) | ⭐⭐⭐ (moderado) | ⭐⭐⭐⭐ (moderado) |
| **Riesgo de bugs** | ⭐⭐⭐⭐⭐ (muy bajo) | ⭐⭐⭐⭐ (bajo) | ⭐⭐⭐ (medio) |

**Recomendación:** **Opción A** - Modificar OnboardingGuard

**Razón:** Es la solución más simple, rápida y con menor riesgo. Resuelve el problema directamente en el lugar donde ocurre sin agregar complejidad innecesaria.

---

## 🎯 Checklist de Implementación

### Pre-implementación
- [ ] Hacer backup de la base de datos (por si acaso)
- [ ] Tener usuario business de prueba listo
- [ ] Tener usuario consumer de prueba listo

### Implementación
- [ ] **Paso 1:** Actualizar `OnboardingGuard.tsx`
- [ ] **Paso 2:** Verificar `getFullUser()` incluye `user_metadata`
- [ ] **Paso 3:** Verificar tipos TypeScript están correctos
- [ ] **Paso 4:** Compilar proyecto (`npm run build`)
- [ ] **Paso 5:** Verificar que no hay errores de TypeScript

### Testing
- [ ] **Test 1:** Login usuario business con negocio → Dashboard
- [ ] **Test 2:** Login usuario business sin negocio → Business Onboarding
- [ ] **Test 3:** Login/Register usuario consumer nuevo → Consumer Onboarding
- [ ] **Test 4:** Login usuario consumer existente → Chat
- [ ] **Test 5:** Recargar página en cada escenario (persistencia)

### Post-implementación
- [ ] Verificar logs en consola del navegador
- [ ] Verificar que no hay errores en Supabase logs
- [ ] Documentar cambios en CHANGELOG.md
- [ ] Actualizar este plan con resultados

---

## 📝 Ejemplo de Logs Esperados

### Usuario Business - Login Exitoso (juan@integralo.io)

```
[useAuth] Initializing auth hook...
[AuthService] Getting full user...
[AuthService] Auth user found: 13354ed4-55c2-4139-b3ad-2916acdd03c1 juan@integralo.io
[AuthService] DB user found, onboarding_completed: false
[AuthService] Full user assembled: { 
  id: '13354ed4-55c2-4139-b3ad-2916acdd03c1', 
  email: 'juan@integralo.io', 
  onboarding_completed: false,
  metadata: { user_type: 'business', onboarding_completed: false }
}
[useAuth] Initial user loaded: juan@integralo.io onboarding: false
[AuthGuard] ✅ User authenticated: juan@integralo.io onboarding: false
[OnboardingGuard] User type: business onboarding_completed: false
[OnboardingGuard] Metadata: { user_type: 'business', onboarding_completed: false }
[OnboardingGuard] Business user detected, allowing access
✅ Usuario en Dashboard
```

### Usuario Consumer - Necesita Onboarding (juanfcastropiccolo@gmail.com)

```
[useAuth] Initializing auth hook...
[AuthService] Getting full user...
[AuthService] Auth user found: 27b4b3de-ddf1-4702-8742-45e8d7163e9d juanfcastropiccolo@gmail.com
[AuthService] DB user found, onboarding_completed: false
[AuthService] Full user assembled: { 
  id: '27b4b3de-ddf1-4702-8742-45e8d7163e9d', 
  email: 'juanfcastropiccolo@gmail.com', 
  onboarding_completed: false,
  metadata: { iss: 'https://accounts.google.com', name: 'Juan Castro Piccolo', ... }
  // ⚠️ Nota: metadata NO tiene user_type, se trata como 'consumer' por defecto
}
[useAuth] Initial user loaded: juanfcastropiccolo@gmail.com onboarding: false
[AuthGuard] ✅ User authenticated: juanfcastropiccolo@gmail.com onboarding: false
[OnboardingGuard] User type: consumer onboarding_completed: false
[OnboardingGuard] Metadata: { iss: 'https://accounts.google.com', ... }
[OnboardingGuard] Consumer user without onboarding, redirecting to /onboarding
✅ Usuario en Onboarding
```

---

## 🔧 Código de Debugging Adicional (Opcional)

Si necesitas debugging más profundo, agregar al `useAuth.ts`:

```typescript
useEffect(() => {
  console.log('[useAuth] User changed:', {
    id: user?.id,
    email: user?.email,
    user_type: user?.metadata?.user_type, // ⚠️ De metadata, no user_metadata
    onboarding_completed: user?.onboarding_completed,
    metadata: user?.metadata, // Ver todo el objeto metadata
  });
}, [user]);
```

---

## ✅ Conclusión

**Problema:** OnboardingGuard redirige usuarios business al onboarding de consumer.

**Causa:** No verifica el tipo de usuario antes de redirigir.

**Solución:** Agregar verificación de `user_metadata.user_type` en OnboardingGuard.

**Tiempo estimado:** 10 minutos (incluyendo testing básico)

**Riesgo:** Muy bajo

**Impacto:** Alto (soluciona problema crítico)

**Archivos afectados:** 1 archivo principal (`OnboardingGuard.tsx`)

**Próximo paso:** Implementar Opción A siguiendo el checklist.
