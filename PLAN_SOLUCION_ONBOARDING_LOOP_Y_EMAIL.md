# Plan de Solución: Loop de Onboarding y Email de Bienvenida

**Fecha:** 28 de enero de 2026  
**Problema Reportado:**
1. El usuario se registra con Google pero NO recibe email de bienvenida de Supabase
2. Después de completar todos los pasos del onboarding, en lugar de ir a `/chat`, vuelve a `/onboarding` (paso 1)

---

## 🔍 Análisis del Problema

### Problema 1: Loop de Onboarding

**Causa Raíz:**

El problema está en la arquitectura de datos del usuario. Existen **DOS fuentes de datos del usuario** que no están sincronizadas:

1. **Supabase Auth User** (`@supabase/supabase-js` - tipo `User`)
   - Propiedades: `id`, `email`, `user_metadata`, `created_at`, etc.
   - NO incluye `onboarding_completed`
   - Este es el usuario que devuelve `supabase.auth.getUser()`

2. **Tabla `users` en la base de datos**
   - Propiedades: `id`, `email`, `onboarding_completed`, `full_name`, etc.
   - Este es el usuario customizado con datos adicionales
   - Se consulta con `supabase.from('users').select()`

**El Flujo Actual (ROTO):**

```
1. Usuario completa onboarding
2. submitOnboarding() → Actualiza tabla users con onboarding_completed: true ✅
3. refetchUser() → Solo obtiene supabase.auth.getUser() ❌
   - Esto SOLO trae el Auth User de Supabase
   - NO trae los datos de la tabla users
   - Por lo tanto, NO tiene onboarding_completed
4. OnboardingGuard verifica user.onboarding_completed
   - Como user es el Auth User, onboarding_completed es undefined
   - !undefined = true, entonces redirige a /onboarding ❌
5. LOOP INFINITO
```

**Evidencia en el Código:**

```typescript:chat-client/hooks/useAuth.ts
// Línea 23: Se usa el tipo User de Supabase, no el tipo personalizado
const [user, setUser] = useState<User | null>(null);

// Línea 27-30: Solo obtiene el Auth User
supabase.auth.getUser().then(({ data: { user } }) => {
  setUser(user); // Este user NO tiene onboarding_completed
  setLoading(false);
});

// Línea 145: refetchUser solo obtiene Auth User
const refetchUser = async () => {
  try {
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    setUser(refreshedUser); // Sigue sin onboarding_completed
  } catch (err) {
    console.error('Error refreshing user:', err);
  }
};
```

```typescript:chat-client/router/OnboardingGuard.tsx
// Línea 29: Verifica onboarding_completed que NO existe en Auth User
if (user && !user.onboarding_completed) {
  return <Navigate to="/onboarding" replace />;
}
```

### Problema 2: No llega Email de Bienvenida

**Causa Raíz:**

Cuando un usuario se registra con **OAuth (Google)**, Supabase **NO envía email de confirmación** porque:

1. Google ya verificó el email del usuario
2. El usuario ya está autenticado por Google
3. Supabase confía en la verificación de Google

**Esto es comportamiento normal y esperado** de OAuth.

Sin embargo, hay dos casos donde SÍ se envía email:

1. **Registro con email/password:** Supabase envía email de confirmación
2. **Email personalizado de bienvenida:** Se puede configurar un email custom después del registro OAuth

---

## 🛠️ Solución Propuesta

### Solución 1: Loop de Onboarding

Hay **3 opciones** para solucionar esto:

#### **Opción A: Sincronizar Auth User con Tabla Users (RECOMENDADA)**

Modificar el hook `useAuth` para que **combine** los datos del Auth User con los datos de la tabla `users`.

**Ventajas:**
- ✅ Mantiene compatibilidad con Supabase Auth
- ✅ Permite usar todas las propiedades customizadas
- ✅ Un solo objeto `user` con todos los datos
- ✅ Mínimos cambios en el resto del código

**Desventajas:**
- ⚠️ Requiere una consulta adicional a la base de datos

**Implementación:**

1. Crear una función helper que obtenga el usuario completo:

```typescript
// En services/auth.service.ts o hooks/useAuth.ts
async function getFullUser(authUserId: string) {
  // 1. Obtener Auth User
  const { data: { user: authUser }, error: authError } = 
    await supabase.auth.getUser();
  
  if (authError || !authUser) return null;

  // 2. Obtener datos de la tabla users
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (dbError) {
    console.error('Error fetching user from database:', dbError);
    // Devolver solo authUser si falla la consulta de DB
    return authUser;
  }

  // 3. Combinar ambos (priorizar datos de la tabla users)
  return {
    ...authUser,
    ...dbUser,
    // Asegurar que propiedades críticas vengan de la tabla users
    onboarding_completed: dbUser.onboarding_completed,
    full_name: dbUser.full_name,
    phone: dbUser.phone,
    // Mantener propiedades de Auth
    email: authUser.email,
    id: authUser.id,
  };
}
```

2. Modificar `useAuth` para usar esta función:

```typescript
// useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<any>(null); // Usar any o crear tipo User extendido
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener usuario completo al iniciar
    getFullUser().then(fullUser => {
      setUser(fullUser);
      setLoading(false);
    });

    // Escuchar cambios en auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const fullUser = await getFullUser();
          setUser(fullUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... resto de funciones ...

  const refetchUser = async () => {
    try {
      const fullUser = await getFullUser();
      setUser(fullUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    refetchUser, // Ahora sí actualiza correctamente
  };
}
```

3. Actualizar tipos:

```typescript
// types/auth.types.ts
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Extender el tipo de Supabase con nuestras propiedades custom
export interface User extends SupabaseUser {
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
  metadata?: Record<string, unknown>;
}
```

#### **Opción B: Almacenar onboarding_completed en user_metadata**

Guardar `onboarding_completed` en `user_metadata` del Auth User de Supabase.

**Ventajas:**
- ✅ No requiere consulta adicional a la DB
- ✅ Los datos están en el Auth User

**Desventajas:**
- ⚠️ user_metadata tiene límites de tamaño
- ⚠️ Duplicación de datos (está en users y en user_metadata)
- ⚠️ Más complejo mantener sincronizado

**Implementación:**

1. Al completar onboarding, actualizar también user_metadata:

```typescript
// onboarding.service.ts - línea 86
// Actualizar usuario como onboarding completado
const { error: userError } = await supabase
  .from('users')
  .update({ 
    onboarding_completed: true,
    full_name: identity.nickname,
    phone: identity.phone,
  })
  .eq('id', userId);

if (userError) throw userError;

// NUEVO: También actualizar user_metadata
const { error: metadataError } = await supabase.auth.updateUser({
  data: {
    onboarding_completed: true,
  }
});

if (metadataError) throw metadataError;
```

2. En OnboardingGuard, leer de user_metadata:

```typescript
// router/OnboardingGuard.tsx
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useAuthContext();

  // Leer de user_metadata
  const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;

  if (user && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
```

#### **Opción C: Crear Context separado para datos del usuario**

Crear un `UserProfileContext` que maneje los datos de la tabla `users`.

**Ventajas:**
- ✅ Separación clara de responsabilidades
- ✅ Fácil de mantener

**Desventajas:**
- ⚠️ Más complejo, dos contexts
- ⚠️ Requiere cambios en muchos componentes

**No recomendada** para este caso.

---

### Solución 2: Email de Bienvenida

#### **Opción A: Configurar Email Personalizado en Supabase (RECOMENDADA)**

1. **Ir a Supabase Dashboard:**
   - Authentication → Email Templates
   - Configurar un template para "Magic Link" o crear uno custom

2. **Enviar email programáticamente después del registro OAuth:**

```typescript
// En AuthCallbackSimple.tsx o después de crear el usuario
import { Resend } from 'resend'; // O el servicio de email que uses

async function sendWelcomeEmail(userEmail: string, userName: string) {
  // Opción 1: Usar un servicio como Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'JANDI <hola@jandi.com>',
    to: userEmail,
    subject: '¡Bienvenido a JANDI!',
    html: `
      <h1>¡Hola ${userName}!</h1>
      <p>Gracias por unirte a JANDI. Estamos emocionados de tenerte con nosotros.</p>
      <p>Completa tu perfil para empezar a disfrutar de todas nuestras funcionalidades.</p>
      <a href="${window.location.origin}/onboarding">Completar perfil</a>
    `,
  });
}

// En AuthCallbackSimple.tsx, después de crear el usuario:
async function handleUserProfile(user: any, ...) {
  // ... código existente ...
  
  // Verificar si es la primera vez que se registra
  const { data: existingProfile } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', user.id)
    .single();
  
  const isNewUser = !existingProfile || 
    new Date(existingProfile.created_at).getTime() > Date.now() - 10000; // Creado hace menos de 10s
  
  if (isNewUser) {
    await sendWelcomeEmail(user.email, user.user_metadata?.name || 'Usuario');
  }
  
  // ... resto del código ...
}
```

#### **Opción B: Usar Supabase Edge Functions**

Crear una Edge Function que se dispare automáticamente cuando se crea un usuario.

1. **Crear Edge Function:**

```sql
-- En Supabase SQL Editor
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar a un servicio externo de email
  -- O usar pg_net para hacer HTTP request
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.resend_api_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'JANDI <hola@jandi.com>',
      'to', NEW.email,
      'subject', '¡Bienvenido a JANDI!',
      'html', '<h1>Bienvenido</h1><p>Gracias por unirte a JANDI</p>'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email();
```

#### **Opción C: No enviar email (Solo para OAuth)**

Simplemente **documentar** que para usuarios OAuth no se envía email de bienvenida porque:
- Ya están verificados por Google
- Ya tienen acceso inmediato a la aplicación
- El email de bienvenida es principalmente para verificación, no necesario para OAuth

**Si se elige esta opción:**
- Agregar un banner de bienvenida en la primera pantalla
- Mostrar un tutorial interactivo
- Enviar notificación push (si se implementa)

---

## 📋 Plan de Implementación

### Fase 1: Solucionar Loop de Onboarding (CRÍTICO)

**Opción seleccionada:** Opción A (Sincronizar Auth User con Tabla Users)

#### Paso 1.1: Crear función helper `getFullUser`

**Archivos a modificar:**
- `chat-client/services/auth.service.ts`

**Acciones:**
1. Agregar función `getFullUser()` que combine Auth User con datos de tabla `users`
2. Manejar errores correctamente
3. Agregar logs para debugging

#### Paso 1.2: Modificar hook `useAuth`

**Archivos a modificar:**
- `chat-client/hooks/useAuth.ts`

**Acciones:**
1. Reemplazar `supabase.auth.getUser()` con `getFullUser()`
2. Actualizar `refetchUser()` para usar `getFullUser()`
3. Actualizar el listener de `onAuthStateChange` para usar `getFullUser()`

#### Paso 1.3: Actualizar tipos TypeScript

**Archivos a modificar:**
- `chat-client/types/auth.types.ts`

**Acciones:**
1. Extender el tipo `User` de Supabase con propiedades custom
2. Asegurar que todos los componentes usen el tipo correcto

#### Paso 1.4: Verificar AuthCallbackSimple

**Archivos a modificar:**
- `chat-client/components/Auth/AuthCallbackSimple.tsx`

**Acciones:**
1. Asegurar que después de crear el usuario en la tabla `users`, se llame a `getFullUser()`
2. Agregar delays adecuados para replicación de base de datos

#### Paso 1.5: Testing

**Acciones:**
1. Eliminar usuario de prueba de la base de datos
2. Registrarse nuevamente con Google
3. Completar todos los pasos del onboarding
4. Verificar que después del paso 6 redirige a `/chat`
5. Verificar en consola del navegador que `user.onboarding_completed === true`
6. Recargar la página y verificar que NO vuelve a `/onboarding`

### Fase 2: Configurar Email de Bienvenida (OPCIONAL)

**Opción seleccionada:** Opción A (Email Personalizado Programático)

#### Paso 2.1: Configurar servicio de email

**Opciones:**
1. Resend (recomendado, fácil de usar)
2. SendGrid
3. AWS SES
4. Supabase Email Templates

**Acciones:**
1. Crear cuenta en el servicio elegido
2. Obtener API key
3. Agregar API key a variables de entorno

#### Paso 2.2: Crear función de envío de email

**Archivos a crear:**
- `chat-client/services/email.service.ts`

**Acciones:**
1. Crear función `sendWelcomeEmail(email: string, name: string)`
2. Crear template HTML del email
3. Manejar errores correctamente (no fallar si el email no se envía)

#### Paso 2.3: Integrar con AuthCallbackSimple

**Archivos a modificar:**
- `chat-client/components/Auth/AuthCallbackSimple.tsx`

**Acciones:**
1. Detectar si es un usuario nuevo (verificar fecha de creación)
2. Llamar a `sendWelcomeEmail()` solo para usuarios nuevos
3. NO bloquear el flujo si falla el email

#### Paso 2.4: Testing

**Acciones:**
1. Registrarse con Google
2. Verificar que llega el email de bienvenida
3. Verificar que el email tiene el formato correcto
4. Verificar que los links funcionan

---

## 🧪 Testing Checklist

### Testing de Loop de Onboarding

- [ ] Usuario nuevo con Google puede completar onboarding
- [ ] Después del paso 6, redirige a `/chat`
- [ ] No vuelve a mostrar onboarding después de completarlo
- [ ] Al recargar la página, sigue en `/chat`
- [ ] La consola muestra `onboarding_completed: true`
- [ ] Usuario con email/password también funciona correctamente

### Testing de Email

- [ ] Email llega a la bandeja de entrada
- [ ] Email no va a spam
- [ ] Links en el email funcionan
- [ ] Template se ve bien en diferentes clientes de email
- [ ] Si falla el email, la app sigue funcionando

---

## 🔧 Configuración Necesaria

### Variables de Entorno

Si se implementa email personalizado:

```env
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RESEND_API_KEY=your_resend_api_key  # Solo si se usa Resend
```

### Configuración de Supabase

1. **Verificar RLS de tabla `users`:**
   - Debe permitir SELECT para usuarios autenticados
   - Debe permitir UPDATE solo del propio usuario

```sql
-- Verificar políticas RLS existentes
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Si no existe, crear política de lectura
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

2. **Verificar índices:**

```sql
-- Asegurar que hay índice en id para queries rápidas
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
```

---

## 📊 Diagrama del Flujo Corregido

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace login con Google                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AuthCallbackSimple:                                      │
│    - Supabase crea Auth User                                │
│    - Se crea registro en tabla users con                    │
│      onboarding_completed: false                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. useAuth.getFullUser():                                   │
│    - Obtiene Auth User de Supabase Auth                     │
│    - Obtiene datos de tabla users                           │
│    - COMBINA ambos en un solo objeto                        │
│    → user.onboarding_completed = false                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. OnboardingGuard:                                         │
│    - Verifica user.onboarding_completed                     │
│    - Como es false, redirige a /onboarding                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuario completa 6 pasos del onboarding                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. submitOnboarding():                                      │
│    - Guarda datos en user_profiles                          │
│    - Actualiza users.onboarding_completed = true            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. refetchUser():                                           │
│    - Llama a getFullUser() nuevamente                       │
│    - Obtiene Auth User + datos de tabla users              │
│    → user.onboarding_completed = true ✅                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. navigate('/chat')                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. OnboardingGuard:                                         │
│    - Verifica user.onboarding_completed                     │
│    - Como es true, permite acceso ✅                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Usuario accede a /chat exitosamente                    │
│     NO HAY LOOP ✅                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Puntos Críticos

### 1. Timing de Replicación de Base de Datos

**Problema potencial:**
- Después de `UPDATE users SET onboarding_completed = true`
- Inmediatamente se llama a `getFullUser()`
- Si la replicación no terminó, puede devolver `onboarding_completed: false`

**Solución:**
```typescript
// En OnboardingContainer.tsx - handleNext()
await submitOnboarding();

// Esperar un momento para replicación
await new Promise(resolve => setTimeout(resolve, 500));

// Ahora recargar usuario
await refetchUser();
```

### 2. Cache de Supabase

**Problema potencial:**
- Supabase puede tener cache de queries
- `getFullUser()` puede devolver datos cacheados

**Solución:**
```typescript
// Forzar refresh sin cache
const { data: dbUser } = await supabase
  .from('users')
  .select('*')
  .eq('id', authUser.id)
  .single()
  .throwOnError();
```

### 3. Navegación Antes de Estado Actualizado

**Problema potencial:**
- `navigate('/chat')` se ejecuta antes de que `refetchUser()` termine
- OnboardingGuard evalúa con estado viejo

**Solución:**
```typescript
// En OnboardingContainer.tsx
await submitOnboarding();
await refetchUser(); // Esperar a que termine
await new Promise(resolve => setTimeout(resolve, 100)); // Safety margin
navigate('/chat'); // Ahora sí navegar
```

---

## 📝 Notas Adicionales

### Sobre el Email de Bienvenida

- **No es crítico** para el funcionamiento de la app
- **Es normal** que usuarios OAuth no reciban email de confirmación
- **Alternativas:** Banner de bienvenida, tutorial interactivo, notificación in-app

### Sobre el Tipo de Usuario

El sistema maneja dos tipos de datos de usuario:
1. **Supabase Auth User:** Para autenticación
2. **Tabla users:** Para datos del negocio

Es importante mantenerlos sincronizados, pero cada uno tiene su propósito.

### Mejoras Futuras

1. **Cache inteligente:**
   - Implementar cache de `getFullUser()` con invalidación
   - Reducir queries a la base de datos

2. **Realtime updates:**
   - Usar Supabase Realtime para actualizar `user` automáticamente cuando cambia en la DB

3. **Optimistic updates:**
   - Actualizar `user.onboarding_completed = true` localmente antes de la respuesta del servidor

---

## ✅ Conclusión

La solución **Opción A** es la más robusta y mantiene la arquitectura actual. Requiere:

1. **Cambios mínimos** en el código existente
2. **Alta compatibilidad** con el sistema actual
3. **Fácil de debuggear** con logs adecuados

El problema del email es secundario y tiene múltiples soluciones según las necesidades del negocio.

**Próximos pasos:**
1. Implementar Fase 1 (Loop de Onboarding) - CRÍTICO
2. Testing exhaustivo
3. Evaluar si es necesario implementar Fase 2 (Email)
