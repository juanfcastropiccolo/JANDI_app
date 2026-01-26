# Plan de Corrección: Flujo de Registro → Onboarding → Chat

**Fecha:** 26 de enero de 2026  
**Problema:** Usuario recién registrado es redirigido a `/login` en lugar de `/onboarding`  
**Severidad:** 🔴 CRÍTICA - Bloquea el registro de nuevos usuarios

---

## 🔍 Análisis del Problema

### Flujo Actual (ROTO)

```
1. Usuario en /register
   ↓
2. Completa formulario y hace submit
   ↓
3. Se ejecuta register() del AuthContext
   ↓
4. Registro exitoso → onRegisterSuccess()
   ↓
5. window.location.href = '/onboarding' (RECARGA PÁGINA)
   ↓
6. Página se recarga, contexto se reinicia
   ↓
7. /onboarding tiene <AuthGuard>
   ↓
8. AuthGuard verifica usuario
   ↓
9. ⚠️ PROBLEMA: Usuario todavía no está en el contexto
   ↓
10. AuthGuard.initialCheckDone = true (porque loading = false)
   ↓
11. AuthGuard ve que no hay user
   ↓
12. ❌ Redirige a /login (INCORRECTO)
```

### Flujo Esperado (CORRECTO)

```
1. Usuario en /register
   ↓
2. Completa formulario y hace submit
   ↓
3. Se ejecuta register() del AuthContext
   ↓
4. Registro exitoso → AuthContext.user actualizado
   ↓
5. Redirigir a /onboarding (SIN recargar página)
   ↓
6. /onboarding tiene <AuthGuard>
   ↓
7. AuthGuard verifica usuario (YA EXISTE en contexto)
   ↓
8. ✅ Permite acceso a /onboarding
   ↓
9. Usuario completa 6 pasos del onboarding
   ↓
10. Código de acceso validado
   ↓
11. onboarding_completed = true
   ↓
12. refetchUser() actualiza contexto
   ↓
13. ✅ Redirige a /chat
```

### Flujo de Login (DEBE MANTENERSE)

```
1. Usuario en /login
   ↓
2. Completa formulario y hace submit
   ↓
3. Se ejecuta login() del AuthContext
   ↓
4. Login exitoso → AuthContext.user actualizado
   ↓
5. Redirigir a /chat
   ↓
6. /chat tiene <AuthGuard> + <OnboardingGuard>
   ↓
7. AuthGuard verifica usuario ✓
   ↓
8. OnboardingGuard verifica onboarding_completed
   ↓
   SI onboarding_completed = false:
   → Redirige a /onboarding
   
   SI onboarding_completed = true:
   → ✅ Permite acceso a /chat
```

---

## 🎯 Causa Raíz del Problema

### 1. Uso de `window.location.href` (RECARGA DE PÁGINA)

**Ubicación:** `router/index.tsx` línea 52

```typescript
<RegisterForm
  onNavigateToLogin={() => window.location.href = '/login'}
  onRegisterSuccess={() => window.location.href = '/onboarding'}  // ← PROBLEMA
/>
```

**Por qué es un problema:**
- `window.location.href` fuerza una recarga completa de la página
- El contexto de autenticación se pierde y se reinicia desde cero
- El hook `useAuth` debe volver a cargar el usuario desde Supabase
- Existe una **race condition** entre:
  - El AuthGuard verificando si hay usuario
  - El useAuth cargando el usuario desde Supabase

### 2. AuthGuard Termina el Check Demasiado Rápido

**Ubicación:** `router/AuthGuard.tsx` líneas 39-44

```typescript
// Si loading terminó y no hay usuario, marcar como completado
if (!loading && !user) {
  console.log('[AuthGuard] Loading finished, no user found');
  setInitialCheckDone(true);  // ← DEMASIADO RÁPIDO
  return;
}
```

**Por qué es un problema:**
- Después de la recarga de página, `loading` puede ser `false` muy rápido
- El usuario todavía no cargó desde Supabase
- El AuthGuard marca `initialCheckDone = true` y redirige a `/login`

### 3. Timing de Supabase Auth

El proceso de autenticación tiene varios pasos:
1. `supabase.auth.signUp()` crea el usuario en Supabase Auth
2. Se inserta el registro en la tabla `users`
3. La sesión se establece en el cliente
4. El evento `onAuthStateChange` se dispara
5. El hook `useAuth` carga los datos del usuario de la tabla `users`

**El problema:** Entre los pasos 1-5 pueden pasar **1-3 segundos**, pero el AuthGuard está decidiendo en < 1 segundo si hay usuario o no.

---

## 🔧 Soluciones Propuestas

### Solución 1: Usar React Router Navigate en lugar de window.location.href ⭐ RECOMENDADA

**Ventajas:**
- No recarga la página
- El contexto se mantiene
- El usuario ya está disponible en el contexto
- Navegación suave sin flicker

**Desventajas:**
- Ninguna significativa

**Archivos a modificar:**
- `router/index.tsx`

**Cambios:**

```typescript
// ANTES (INCORRECTO)
<RegisterForm
  onNavigateToLogin={() => window.location.href = '/login'}
  onRegisterSuccess={() => window.location.href = '/onboarding'}
/>

<LoginForm
  onNavigateToRegister={() => window.location.href = '/register'}
  onNavigateToForgotPassword={() => window.location.href = '/forgot-password'}
  onLoginSuccess={() => window.location.href = '/chat'}
/>

// DESPUÉS (CORRECTO)
import { useNavigate } from 'react-router-dom';

function Routes() {
  const navigate = useNavigate();
  
  return (
    <>
      <RegisterForm
        onNavigateToLogin={() => navigate('/login')}
        onRegisterSuccess={() => navigate('/onboarding')}
      />
      
      <LoginForm
        onNavigateToRegister={() => navigate('/register')}
        onNavigateToForgotPassword={() => navigate('/forgot-password'}
        onLoginSuccess={() => navigate('/chat')}
      />
    </>
  );
}
```

**Nota:** Necesitaremos crear un componente wrapper para cada ruta que use `useNavigate` desde React Router.

---

### Solución 2: Mejorar el AuthGuard para Esperar Más Tiempo Después del Registro

**Ventajas:**
- No requiere cambiar las redirecciones
- Solución de respaldo si algo falla

**Desventajas:**
- Agrega complejidad
- No resuelve la causa raíz
- Puede causar experiencia de usuario más lenta

**Archivos a modificar:**
- `router/AuthGuard.tsx`

**Cambios:**

```typescript
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuthContext();
  const [initialCheckDone, setInitialCheckDone] = React.useState(false);
  const [waitTime, setWaitTime] = React.useState(0);

  React.useEffect(() => {
    // Si ya tenemos usuario, listo
    if (user) {
      console.log('[AuthGuard] User found:', user.email);
      setInitialCheckDone(true);
      return;
    }

    // Incrementar contador de espera cada 500ms
    const interval = setInterval(() => {
      setWaitTime(prev => prev + 500);
    }, 500);

    // Si después de 10 segundos no hay usuario, asumir que no está logueado
    const safetyTimer = setTimeout(() => {
      console.log('[AuthGuard] Safety timeout after 10s');
      setInitialCheckDone(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [user]);

  // No marcar como completado hasta que:
  // 1. Tengamos usuario, O
  // 2. Hayan pasado al menos 3 segundos Y loading = false
  React.useEffect(() => {
    if (!user && !loading && waitTime >= 3000) {
      console.log('[AuthGuard] No user after 3s with loading=false');
      setInitialCheckDone(true);
    }
  }, [user, loading, waitTime]);

  // ... resto del código
}
```

---

### Solución 3: Agregar Flag "justRegistered" en localStorage

**Ventajas:**
- El AuthGuard puede saber que el usuario acaba de registrarse
- Puede dar más tiempo de espera específicamente después del registro

**Desventajas:**
- Requiere limpiar el flag después
- Agrega lógica de estado adicional

**Archivos a modificar:**
- `hooks/useAuth.ts`
- `router/AuthGuard.tsx`

**Cambios:**

```typescript
// En useAuth.ts - función register()
const register = async (credentials: RegisterCredentials) => {
  try {
    setError(null);
    setLoading(true);
    
    // Marcar que el usuario acaba de registrarse
    localStorage.setItem('jandi_just_registered', 'true');
    
    const newUser = await authService.register(credentials);
    setUser(newUser);
  } catch (err) {
    localStorage.removeItem('jandi_just_registered');
    // ... manejo de error
  } finally {
    setLoading(false);
  }
};

// En AuthGuard.tsx
const justRegistered = localStorage.getItem('jandi_just_registered') === 'true';

// Si acaba de registrarse, dar más tiempo
const maxWaitTime = justRegistered ? 15000 : 8000;

// Limpiar flag cuando el usuario carga
React.useEffect(() => {
  if (user) {
    localStorage.removeItem('jandi_just_registered');
  }
}, [user]);
```

---

## 📋 Plan de Implementación Recomendado

### Fase 1: Cambiar de window.location.href a React Router Navigate ⭐

**Prioridad:** ALTA  
**Complejidad:** MEDIA  
**Impacto:** Resuelve el problema de raíz

**Pasos:**

1. **Crear componentes wrapper para cada ruta que necesita navegación**
   - Archivos: `router/index.tsx`
   - Crear componente `RouteWrapper` que use `useNavigate`

2. **Actualizar todas las rutas para usar el wrapper**
   - Rutas afectadas: `/`, `/login`, `/register`, `/forgot-password`, `/business`, `/business/register`

3. **Modificar las props de los componentes para recibir funciones navigate**
   - Ya están definidas, solo cambiar la implementación

4. **Testing:**
   - Registrar nuevo usuario → Debe ir a `/onboarding` sin recargar
   - Completar onboarding → Debe ir a `/chat`
   - Login con usuario existente con onboarding → Debe ir a `/chat`
   - Login con usuario existiente sin onboarding → Debe ir a `/onboarding` → `/chat`

### Fase 2: Mejorar AuthGuard como Respaldo

**Prioridad:** MEDIA  
**Complejidad:** BAJA  
**Impacto:** Seguridad adicional

**Pasos:**

1. **Aumentar el tiempo de espera mínimo antes de decidir que no hay usuario**
   - De 8s a 10s en el safety timer
   - Agregar check de que hayan pasado al menos 2-3 segundos antes de redirigir

2. **Agregar logs más detallados**
   - Ayuda a debuggear problemas futuros

3. **Testing:**
   - Simular registro lento
   - Verificar que espera el tiempo adecuado

### Fase 3: Validación Completa del Flujo

**Prioridad:** ALTA  
**Complejidad:** BAJA  
**Impacto:** Asegurar que todo funcione

**Escenarios a probar:**

1. **Registro con Email + Password:**
   - Usuario nuevo → /register → Completar formulario → /onboarding → Completar 6 pasos → /chat ✓

2. **Registro con Google OAuth:**
   - Usuario nuevo → /login → Click Google → Callback → /onboarding → Completar 6 pasos → /chat ✓

3. **Login con usuario que ya completó onboarding:**
   - Usuario existente → /login → /chat ✓

4. **Login con usuario que NO completó onboarding:**
   - Usuario existente sin onboarding → /login → /onboarding → Completar pasos → /chat ✓

5. **Acceso directo sin autenticación:**
   - Sin login → /chat → /login ✓
   - Sin login → /onboarding → /login ✓

6. **Logout:**
   - /chat → Click "Cerrar sesión" → / (home) ✓
   - Intentar acceder /chat → /login ✓

---

## 🚨 Código Específico a Modificar

### Archivo 1: `router/index.tsx`

**Problema actual (líneas 31-100):**
```typescript
export const router = createBrowserRouter([
  {
    path: '/register',
    element: <RegisterForm
      onNavigateToLogin={() => window.location.href = '/login'}
      onRegisterSuccess={() => window.location.href = '/onboarding'}  // ← PROBLEMA
    />,
  },
  // ... más rutas con window.location.href
]);
```

**Solución propuesta:**
```typescript
// Crear un componente que envuelva las rutas y use useNavigate
function RegisterRoute() {
  const navigate = useNavigate();
  
  return (
    <RegisterForm
      onNavigateToLogin={() => navigate('/login')}
      onRegisterSuccess={() => navigate('/onboarding', { replace: true })}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  
  return (
    <LoginForm
      onNavigateToRegister={() => navigate('/register')}
      onNavigateToForgotPassword={() => navigate('/forgot-password')}
      onLoginSuccess={() => navigate('/chat', { replace: true })}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/register',
    element: <RegisterRoute />,
  },
  {
    path: '/login',
    element: <LoginRoute />,
  },
  // ... etc
]);
```

---

### Archivo 2: `router/AuthGuard.tsx`

**Problema actual (líneas 31-53):**
```typescript
React.useEffect(() => {
  if (user) {
    setInitialCheckDone(true);
    return;
  }

  if (!loading && !user) {  // ← DEMASIADO RÁPIDO
    setInitialCheckDone(true);
    return;
  }

  const safetyTimer = setTimeout(() => {
    setInitialCheckDone(true);
  }, 8000);  // ← POCO TIEMPO

  return () => clearTimeout(safetyTimer);
}, [user, loading]);
```

**Solución propuesta:**
```typescript
React.useEffect(() => {
  if (user) {
    console.log('[AuthGuard] User found:', user.email);
    setInitialCheckDone(true);
    return;
  }

  // NO terminar el check solo porque loading = false
  // Esperar al menos el safety timer
  
  const safetyTimer = setTimeout(() => {
    console.log('[AuthGuard] Safety timeout after 12s, user:', user ? user.email : 'null');
    setInitialCheckDone(true);
  }, 12000);  // ← MÁS TIEMPO (12 segundos)

  return () => clearTimeout(safetyTimer);
}, [user, loading]);

// El check de !loading && !user se elimina completamente
// Dejar que el timer decida cuando terminar
```

---

## ✅ Checklist de Implementación

- [ ] **Fase 1: Navegación con React Router**
  - [ ] Crear `RegisterRoute` component
  - [ ] Crear `LoginRoute` component
  - [ ] Crear `LandingRoute` component
  - [ ] Crear `ForgotPasswordRoute` component
  - [ ] Crear `BusinessLandingRoute` component
  - [ ] Crear `BusinessRegisterRoute` component
  - [ ] Actualizar `router/index.tsx` con los nuevos componentes
  - [ ] Eliminar todos los `window.location.href`

- [ ] **Fase 2: Mejorar AuthGuard**
  - [ ] Aumentar safety timer a 12 segundos
  - [ ] Eliminar check rápido de `!loading && !user`
  - [ ] Agregar logs detallados con timestamps
  - [ ] Agregar indicador visual de "Cargando usuario..." cuando espera

- [ ] **Fase 3: Testing**
  - [ ] Test: Registro nuevo usuario → onboarding
  - [ ] Test: Registro con Google → onboarding
  - [ ] Test: Login usuario con onboarding → chat
  - [ ] Test: Login usuario sin onboarding → onboarding → chat
  - [ ] Test: Acceso directo /chat sin login → login
  - [ ] Test: Logout → home
  - [ ] Test: Completar onboarding con código válido → chat
  - [ ] Test: Intentar código inválido en onboarding → error

---

## 📊 Diagrama del Flujo Corregido

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRO DE NUEVO USUARIO                │
└─────────────────────────────────────────────────────────────┘

    /register
       │
       ├─ Email + Password
       │    └─> register() → navigate('/onboarding')
       │
       └─ Google OAuth
            └─> Callback → navigate('/onboarding')
       
    ↓
    
    /onboarding [AuthGuard]
       │
       ├─ Usuario en contexto? → SÍ ✓
       │
       ├─ Completar 6 pasos:
       │   1. Identidad
       │   2. Compras
       │   3. Preferencias
       │   4. Autonomía
       │   5. Pago
       │   6. Código Acceso (gala123)
       │
       └─> submitOnboarding() → refetchUser() → navigate('/chat')
    
    ↓
    
    /chat [AuthGuard + OnboardingGuard]
       │
       ├─ Usuario autenticado? → SÍ ✓
       ├─ Onboarding completo? → SÍ ✓
       │
       └─> ✅ ACCESO CONCEDIDO


┌─────────────────────────────────────────────────────────────┐
│                 LOGIN DE USUARIO EXISTENTE                  │
└─────────────────────────────────────────────────────────────┘

    /login
       │
       └─> login() → navigate('/chat')
    
    ↓
    
    /chat [AuthGuard + OnboardingGuard]
       │
       ├─ Usuario autenticado? → SÍ ✓
       │
       ├─ Onboarding completo?
       │   │
       │   ├─ SÍ → ✅ ACCESO A CHAT
       │   │
       │   └─ NO → navigate('/onboarding')
       │            └─> Completar → navigate('/chat')


┌─────────────────────────────────────────────────────────────┐
│              ACCESO SIN AUTENTICACIÓN (BLOQUEADO)           │
└─────────────────────────────────────────────────────────────┘

    /chat (directo)
       │
       └─> [AuthGuard]
             │
             └─ Usuario autenticado? → NO
                  │
                  └─> ❌ navigate('/login')
```

---

## 🎯 Resultado Esperado Después de Implementar

### ✅ Registro Nuevo Usuario
```
/register → Completar formulario → /onboarding (SIN RECARGA) 
→ Completar 6 pasos → /chat
```

### ✅ Login Usuario Existente CON Onboarding
```
/login → Completar formulario → /chat
```

### ✅ Login Usuario Existente SIN Onboarding
```
/login → Completar formulario → /onboarding → Completar pasos → /chat
```

### ✅ Protección de Rutas
```
/chat (sin login) → /login
/onboarding (sin login) → /login
```

### ✅ Google OAuth
```
/login → Click Google → Callback → /onboarding → Completar → /chat
```

---

## 📝 Notas Adicionales

### Consideraciones de UX

1. **Sin recargas de página:** La experiencia será más fluida
2. **Feedback visual:** Mantener spinners durante transiciones
3. **Estados de error:** Manejar errores de red/auth claramente

### Consideraciones de Performance

1. **React Router es más rápido:** No recarga recursos
2. **Contexto se mantiene:** No requiere recargar usuario
3. **Menos llamadas a Supabase:** Reutiliza sesión existente

### Seguridad

1. **AuthGuard sigue protegiendo rutas:** Nada cambia en seguridad
2. **OnboardingGuard sigue funcionando:** Valida código de acceso
3. **Mejora la confiabilidad:** Menos race conditions

---

**Estado del Plan:** 📋 PENDIENTE DE IMPLEMENTACIÓN  
**Próximo paso:** Revisar y aprobar el plan antes de ejecutar  
**Fecha límite sugerida:** ASAP (bloquea registro de usuarios)
