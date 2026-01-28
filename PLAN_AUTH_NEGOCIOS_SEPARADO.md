# Plan: Sistema de Autenticación Separado para Negocios

## Fecha
2026-01-27

## Objetivo
Implementar un sistema de autenticación completamente separado para negocios, con registro, confirmación de email, y onboarding de 6 pasos.

---

## Problema Actual

Actualmente tenemos:
- ✅ Login/Register para usuarios consumidores (funciona)
- ❌ Sistema de auth para negocios mezclado en el onboarding
- ❌ No hay confirmación de email para negocios
- ❌ No hay login separado para negocios

---

## Solución: Dos Sistemas Completamente Separados

### Sistema 1: Usuarios Consumidores (YA EXISTE)
```
/login           → Login de consumidores
/register        → Register de consumidores
/auth/callback   → Callback genérico
/onboarding      → Onboarding de consumidores
/chat            → App principal
```

### Sistema 2: Negocios (A IMPLEMENTAR)
```
/business/login          → Login de negocios
/business/register       → Register de negocios
/business/auth/callback  → Callback específico para negocios
/business/onboarding     → Onboarding de negocios (6 pasos)
/business/dashboard/:id  → Dashboard (requiere negocio creado)
```

---

## Flujo Completo del Usuario de Negocio

### 1. Registro Inicial

```
Usuario → /business
         ↓
    [Landing Page]
    "Registrar Negocio"
         ↓
    /business/register
         ↓
    [Formulario Simple]
    - Email *
    - Contraseña *
    - Confirmar Contraseña *
    - Checkbox: "Acepto términos y condiciones"
         ↓
    Click "Crear Cuenta"
         ↓
    supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: 'http://localhost:5173/business/auth/callback',
        data: {
          user_type: 'business',
          onboarding_completed: false
        }
      }
    })
         ↓
    [Pantalla de Éxito]
    "✉️ Te enviamos un email a tu correo
     Por favor revisa tu bandeja de entrada y
     haz click en el link de confirmación"
         ↓
    Usuario sale de la app
```

### 2. Confirmación de Email

```
Usuario revisa su email
         ↓
    [Email de Supabase]
    "Confirma tu cuenta"
         ↓
    Click en el link
         ↓
    Supabase valida el token
         ↓
    Redirección a:
    http://localhost:5173/business/auth/callback?token=...
         ↓
    [BusinessAuthCallback Component]
    - Extrae el token
    - Confirma la sesión
    - Verifica user_type === 'business'
    - Redirecciona a: /business/login
         ↓
    [Pantalla de Éxito]
    "✅ Email confirmado
     Ya puedes iniciar sesión"
```

### 3. Primer Login

```
Usuario → /business/login
         ↓
    [Formulario de Login]
    - Email *
    - Contraseña *
         ↓
    Click "Iniciar Sesión"
         ↓
    supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
         ↓
    Verificar:
    - ✅ user.email_confirmed_at existe?
    - ✅ user.user_metadata.user_type === 'business'?
         ↓
    Verificar si tiene negocio:
    SELECT * FROM businesses WHERE email = user.email
         ↓
    ¿Tiene negocio?
    ├─ SI → Redirigir a /business/dashboard/:businessId
    └─ NO → Redirigir a /business/onboarding
```

### 4. Onboarding (Primera Vez)

```
Usuario → /business/onboarding
         ↓
    [Guard: BusinessOnboardingGuard]
    - Verifica autenticación
    - Verifica que NO tenga negocio
    - Si ya tiene negocio → redirect a dashboard
         ↓
    [6 Pasos de Onboarding]
    
    PASO 1: Información Básica
    - Nombre del negocio *
    - Razón social
    - Tipo de negocio *
    - Descripción
    - Email (pre-llenado, read-only)
    - Teléfono *
    - Dirección *
    
    PASO 2: Documentación Legal
    - Tipo de entidad *
    - DNI/CUIT *
    - Upload de documentos
    
    PASO 3: Catálogo
    - Agregar productos iniciales (opcional)
    
    PASO 4: Entrega
    - Radio de delivery
    - Costo de envío
    - Pedido mínimo
    - Tiempo de preparación
    
    PASO 5: Configuración UCP
    - Regiones de operación
    - Métodos de entrega
    - Métodos de pago
    - Políticas
    - Contacto
    
    PASO 6: Revisión Final
    - Preview de toda la información
    - Botón "Crear Negocio"
         ↓
    Click "Crear Negocio"
         ↓
    await businessService.createBusiness({
      ...businessData,
      email: user.email
    })
         ↓
    await authService.updateUserMetadata({
      onboarding_completed: true,
      business_id: business.id
    })
         ↓
    navigate(`/business/dashboard/${business.id}`)
```

### 5. Logins Subsecuentes

```
Usuario → /business/login
         ↓
    Inicia sesión
         ↓
    Verificar negocio:
    SELECT * FROM businesses WHERE email = user.email
         ↓
    business existe?
    ├─ SI → Redirigir a /business/dashboard/:businessId
    └─ NO → Redirigir a /business/onboarding
```

---

## Archivos a Crear (8 archivos)

### 1. `/business/register` - Registro Simple

**Archivo:** `chat-client/components/Business/Auth/BusinessRegisterForm.tsx`

```tsx
interface BusinessRegisterFormProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export function BusinessRegisterForm({ 
  onNavigateToLogin, 
  onRegisterSuccess 
}: BusinessRegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/business/auth/callback`,
          data: {
            user_type: 'business',
            onboarding_completed: false
          }
        }
      });

      if (signUpError) throw signUpError;

      // Registro exitoso
      onRegisterSuccess();
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX con formulario
  );
}
```

**Características:**
- Formulario simple: email, password, confirmPassword
- Checkbox de términos
- Validación de contraseñas coincidentes
- emailRedirectTo apunta a `/business/auth/callback`
- user_type: 'business' en metadata
- Pantalla de éxito con mensaje de verificación de email

---

### 2. `/business/auth/callback` - Callback de Email

**Archivo:** `chat-client/components/Business/Auth/BusinessAuthCallback.tsx`

```tsx
export function BusinessAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase maneja el token automáticamente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          // Verificar que sea un usuario de negocio
          const userType = session.user.user_metadata?.user_type;
          
          if (userType !== 'business') {
            throw new Error('Esta cuenta no es de tipo negocio');
          }

          setStatus('success');
          
          // Redirigir al login después de 2 segundos
          setTimeout(() => {
            navigate('/business/login', { 
              state: { emailConfirmed: true } 
            });
          }, 2000);
        } else {
          throw new Error('No se pudo confirmar la sesión');
        }
      } catch (err: any) {
        console.error('Error en callback:', err);
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    // JSX con estados: loading, success, error
  );
}
```

**Características:**
- Procesa el callback de Supabase
- Verifica que user_type === 'business'
- Muestra pantalla de éxito
- Redirecciona a `/business/login` con state

---

### 3. `/business/login` - Login de Negocios

**Archivo:** `chat-client/components/Business/Auth/BusinessLoginForm.tsx`

```tsx
interface BusinessLoginFormProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (businessId?: string) => void;
}

export function BusinessLoginForm({ 
  onNavigateToRegister, 
  onLoginSuccess 
}: BusinessLoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const emailConfirmed = location.state?.emailConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Iniciar sesión
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // 2. Verificar que sea usuario de negocio
      const userType = data.user?.user_metadata?.user_type;
      if (userType !== 'business') {
        await supabase.auth.signOut();
        throw new Error('Esta cuenta no es de tipo negocio. Por favor usa el login de usuarios.');
      }

      // 3. Verificar si tiene negocio creado
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', data.user.email)
        .single();

      if (businessError && businessError.code !== 'PGRST116') {
        // Error diferente a "no encontrado"
        throw businessError;
      }

      // 4. Redirigir según tenga o no negocio
      if (business) {
        // Ya tiene negocio → al dashboard
        onLoginSuccess(business.id);
      } else {
        // No tiene negocio → al onboarding
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX con formulario
    // Mostrar mensaje de éxito si emailConfirmed === true
  );
}
```

**Características:**
- Formulario de login: email, password
- Validación de user_type === 'business'
- Verifica si tiene negocio en BD
- Redirecciona a dashboard o onboarding según corresponda
- Mensaje de éxito si viene de confirmación de email

---

### 4. `BusinessOnboardingGuard` - Protección de Onboarding

**Archivo:** `chat-client/router/BusinessOnboardingGuard.tsx`

```tsx
interface BusinessOnboardingGuardProps {
  children: React.ReactNode;
}

export function BusinessOnboardingGuard({ children }: BusinessOnboardingGuardProps) {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Verificar tipo de usuario
      if (user.user_metadata?.user_type !== 'business') {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Verificar si ya tiene negocio
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          // Ya tiene negocio → no debería estar en onboarding
          setHasAccess(false);
        } else {
          // No tiene negocio → OK para onboarding
          setHasAccess(true);
        }
      } catch (err) {
        console.error('Error checking business:', err);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading]);

  // Loading states
  if (loading || checking) {
    return <LoadingSpinner />;
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/business/login" replace />;
  }

  // Ya tiene negocio
  if (hasAccess === false) {
    // Buscar el business_id para redirigir
    const businessId = user.user_metadata?.business_id;
    if (businessId) {
      return <Navigate to={`/business/dashboard/${businessId}`} replace />;
    }
    return <Navigate to="/business/login" replace />;
  }

  return <>{children}</>;
}
```

**Características:**
- Verifica autenticación
- Verifica user_type === 'business'
- Verifica que NO tenga negocio creado
- Redirecciona al dashboard si ya tiene negocio
- Redirecciona al login si no está autenticado

---

### 5. Actualizar `BusinessRegister` - Volver a 6 Pasos

**Archivo:** `chat-client/components/Business/BusinessRegister.tsx`

**Cambios:**
1. **Eliminar paso de autenticación:**
   ```tsx
   // Antes (7 pasos)
   const STEP_LABELS = [
     'Crear Cuenta',      // ❌ ELIMINAR
     'Información Básica',
     // ...
   ];
   
   // Después (6 pasos)
   const STEP_LABELS = [
     'Información Básica',
     'Documentación Legal',
     'Catálogo',
     'Entrega',
     'Configuración UCP',
     'Revisión Final'
   ];
   
   const totalSteps = 6; // En vez de 7
   ```

2. **Eliminar estado de auth:**
   ```tsx
   const [businessData, setBusinessData] = useState<any>({
     // auth: null, // ❌ ELIMINAR
     basicInfo: null,
     legalDocs: null,
     // ...
   });
   ```

3. **Actualizar renderCurrentStep:**
   ```tsx
   const renderCurrentStep = () => {
     switch (currentStep) {
       // ❌ ELIMINAR case 1 con BusinessAuthStep
       
       case 1: // Ahora es el primero
         return (
           <BusinessInfoStep
             data={businessData.basicInfo}
             onChange={(data) => handleStepDataChange('basicInfo', data)}
             onValidationChange={setCanProceed}
             userEmail={user?.email} // Viene del useAuth
           />
         );
       // ... resto de casos
     }
   };
   ```

4. **Actualizar handleNext (paso final):**
   ```tsx
   const handleNext = async () => {
     if (currentStep === totalSteps) { // 6 en vez de 7
       setLoading(true);
       setError(null);
       
       try {
         const user = await authService.getCurrentUser();
         
         if (!user) {
           throw new Error('Debes estar autenticado para crear un negocio');
         }
         
         // El email viene del usuario autenticado
         const business = await businessService.createBusiness({
           ...businessData.basicInfo,
           ...businessData.legalDocs,
           ...businessData.delivery,
           email: user.email, // ✅ Del usuario autenticado
           // ... resto de campos
         });
         
         // ... resto del código
       }
     }
   };
   ```

5. **Eliminar import de BusinessAuthStep:**
   ```tsx
   // ❌ ELIMINAR
   // import { BusinessAuthStep } from './steps/BusinessAuthStep';
   ```

**Props que recibe:**
```tsx
interface BusinessRegisterProps {
  onComplete?: (businessId: string) => void;
}
```

No necesita `onNavigateBack` porque ya está autenticado cuando llega aquí.

---

### 6. Actualizar Rutas en `router/index.tsx`

```tsx
import { BusinessRegisterForm } from '../components/Business/Auth/BusinessRegisterForm';
import { BusinessLoginForm } from '../components/Business/Auth/BusinessLoginForm';
import { BusinessAuthCallback } from '../components/Business/Auth/BusinessAuthCallback';
import { BusinessOnboardingGuard } from './BusinessOnboardingGuard';
import { BusinessRegister } from '../components/Business/BusinessRegister';

// Wrapper para register
function BusinessRegisterRoute() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-light-blue)' }}>
            <span className="text-4xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Revisa tu email!
          </h2>
          <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
            Te enviamos un email de confirmación. Por favor revisa tu bandeja de entrada y haz click en el link para activar tu cuenta.
          </p>
          <button
            onClick={() => navigate('/business/login')}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <BusinessRegisterForm
      onNavigateToLogin={() => navigate('/business/login')}
      onRegisterSuccess={() => setShowSuccess(true)}
    />
  );
}

// Wrapper para login
function BusinessLoginRoute() {
  const navigate = useNavigate();
  
  return (
    <BusinessLoginForm
      onNavigateToRegister={() => navigate('/business/register')}
      onLoginSuccess={(businessId) => {
        if (businessId) {
          navigate(`/business/dashboard/${businessId}`, { replace: true });
        } else {
          navigate('/business/onboarding', { replace: true });
        }
      }}
    />
  );
}

// Actualizar router
export const router = createBrowserRouter([
  // ... rutas existentes de consumidores ...
  
  // Rutas de negocios - Auth
  {
    path: '/business',
    element: <BusinessLandingRoute />,
  },
  {
    path: '/business/register',
    element: <BusinessRegisterRoute />,
  },
  {
    path: '/business/login',
    element: <BusinessLoginRoute />,
  },
  {
    path: '/business/auth/callback',
    element: <BusinessAuthCallback />,
  },
  
  // Rutas de negocios - Onboarding
  {
    path: '/business/onboarding',
    element: (
      <BusinessOnboardingGuard>
        <BusinessRegister 
          onComplete={(businessId) => {
            window.location.href = `/business/dashboard/${businessId}`;
          }}
        />
      </BusinessOnboardingGuard>
    ),
  },
  
  // Rutas de negocios - Dashboard (ya existen)
  {
    path: '/business/dashboard/:businessId',
    element: (
      <ProtectedRoute userType="business">
        <BusinessDashboard />
      </ProtectedRoute>
    ),
  },
  // ... resto de rutas del dashboard ...
]);
```

---

### 7. Actualizar `BusinessLanding`

**Archivo:** `chat-client/components/Business/BusinessLanding.tsx`

**Cambios:**
```tsx
// Botón "Registrar Negocio" debe ir a /business/register
<button
  onClick={() => onNavigateToRegister()}
  className="..."
>
  Registrar mi Negocio
</button>

// Agregar botón "Ya tengo cuenta"
<button
  onClick={() => navigate('/business/login')}
  className="..."
>
  Ya tengo cuenta
</button>
```

---

### 8. Eliminar `BusinessAuthStep.tsx`

**Archivo a eliminar:** `chat-client/components/Business/steps/BusinessAuthStep.tsx`

Ya no es necesario porque la autenticación se hace antes del onboarding.

---

## Configuración de Supabase

### 1. Email Templates

**Authentication → Email Templates → Confirm signup**

Cambiar la URL de confirmación para negocios:

```html
<h2>Confirma tu cuenta de negocio</h2>
<p>Haz click en el siguiente enlace para confirmar tu cuenta:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
```

**IMPORTANTE:** El `ConfirmationURL` debe redirigir a `/business/auth/callback`

Para esto, cuando se hace el signUp, se debe especificar:

```ts
emailRedirectTo: `${window.location.origin}/business/auth/callback`
```

### 2. Redirect URLs

**Authentication → URL Configuration**

Agregar a las URLs permitidas:
- `http://localhost:5173/business/auth/callback`
- `https://tudominio.com/business/auth/callback` (producción)

### 3. Email Confirmation

**Authentication → Settings**

✅ **Enable email confirmations:** ON (ya está habilitado según tu imagen)

---

## Resumen de Cambios

### Archivos a CREAR (7)

1. ✅ `chat-client/components/Business/Auth/BusinessRegisterForm.tsx`
   - Formulario de registro simple
   - emailRedirectTo: `/business/auth/callback`

2. ✅ `chat-client/components/Business/Auth/BusinessLoginForm.tsx`
   - Formulario de login
   - Verifica user_type
   - Verifica si tiene negocio
   - Redirecciona según corresponda

3. ✅ `chat-client/components/Business/Auth/BusinessAuthCallback.tsx`
   - Procesa callback de email
   - Verifica user_type
   - Redirecciona a login

4. ✅ `chat-client/router/BusinessOnboardingGuard.tsx`
   - Protege ruta de onboarding
   - Verifica que NO tenga negocio
   - Redirecciona si ya tiene negocio

5. ✅ `chat-client/components/Business/Auth/BusinessRegisterSuccess.tsx` (opcional)
   - Pantalla de "Revisa tu email"

6. ✅ Crear directorio: `chat-client/components/Business/Auth/`

### Archivos a MODIFICAR (3)

1. ✅ `chat-client/components/Business/BusinessRegister.tsx`
   - Volver de 7 pasos a 6 pasos
   - Eliminar BusinessAuthStep
   - Eliminar estado de auth
   - Usar email del usuario autenticado
   - Actualizar renderCurrentStep

2. ✅ `chat-client/router/index.tsx`
   - Agregar ruta `/business/register`
   - Agregar ruta `/business/login`
   - Agregar ruta `/business/auth/callback`
   - Actualizar ruta `/business/onboarding` con guard
   - Eliminar ruta `/business/register` vieja

3. ✅ `chat-client/components/Business/BusinessLanding.tsx`
   - Botón "Registrar" → `/business/register`
   - Agregar botón "Ya tengo cuenta" → `/business/login`

### Archivos a ELIMINAR (1)

1. ❌ `chat-client/components/Business/steps/BusinessAuthStep.tsx`
   - Ya no es necesario

---

## Flujo Técnico Detallado

### Registro
```
1. Usuario → /business/register
2. Completa formulario (email, password)
3. supabase.auth.signUp() con:
   - emailRedirectTo: /business/auth/callback
   - metadata: { user_type: 'business' }
4. Supabase envía email
5. Usuario recibe email
6. Click en link → /business/auth/callback?token=...
7. BusinessAuthCallback procesa token
8. Redirect a /business/login con state { emailConfirmed: true }
9. Usuario ve mensaje "Email confirmado, ya puedes iniciar sesión"
```

### Login (Primera Vez)
```
1. Usuario → /business/login
2. Completa formulario (email, password)
3. supabase.auth.signInWithPassword()
4. Verifica user_type === 'business'
5. Busca negocio en BD por email
6. No encuentra negocio
7. Redirect a /business/onboarding
8. BusinessOnboardingGuard verifica:
   - ✅ Autenticado
   - ✅ user_type === 'business'
   - ✅ NO tiene negocio
9. Muestra BusinessRegister (6 pasos)
10. Usuario completa 6 pasos
11. Crea negocio con email del usuario
12. Actualiza metadata: onboarding_completed: true
13. Redirect a /business/dashboard/:businessId
```

### Login (Subsecuentes)
```
1. Usuario → /business/login
2. Inicia sesión
3. Busca negocio en BD
4. Encuentra negocio
5. Redirect a /business/dashboard/:businessId
```

---

## Guards y Protecciones

### BusinessOnboardingGuard
- **Ruta:** `/business/onboarding`
- **Verifica:**
  - Usuario autenticado
  - user_type === 'business'
  - NO tiene negocio creado
- **Redirecciona:**
  - Si no auth → `/business/login`
  - Si ya tiene negocio → `/business/dashboard/:id`

### ProtectedRoute (ya existe)
- **Rutas:** `/business/dashboard/*`
- **Verifica:**
  - Usuario autenticado
  - user_type === 'business'
  - Tiene acceso al negocio específico
- **Redirecciona:**
  - Si no auth → `/business/login`
  - Si no tiene acceso → `/unauthorized`

---

## Estados de Usuario

### Estado 1: Registrado pero no confirmado
- Existe en `auth.users`
- `email_confirmed_at` = NULL
- No puede hacer login

### Estado 2: Confirmado pero sin negocio
- `email_confirmed_at` != NULL
- No existe en `businesses`
- Puede hacer login
- Es redirigido a onboarding

### Estado 3: Con negocio creado
- `email_confirmed_at` != NULL
- Existe en `businesses`
- `onboarding_completed` = true
- Puede acceder al dashboard

---

## Diagrama de Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRO DE NEGOCIO                       │
└─────────────────────────────────────────────────────────────┘

[Landing] → [Register] → [Email enviado]
                ↓
         [Usuario recibe email]
                ↓
         [Click en link]
                ↓
         [Callback procesa token]
                ↓
         [Redirect a Login]
                ↓
         [Login Form] → [Verifica credenciales]
                ↓
         ¿Tiene negocio?
         ├─ SI → [Dashboard]
         └─ NO → [Onboarding 6 pasos]
                      ↓
                 [Crea negocio]
                      ↓
                 [Dashboard]
```

---

## Testing Checklist

### Registro
- [ ] Formulario de registro se muestra correctamente
- [ ] Validación de contraseñas coincidentes
- [ ] Email se envía correctamente
- [ ] Email contiene link correcto
- [ ] Link apunta a `/business/auth/callback`

### Confirmación
- [ ] Callback procesa token correctamente
- [ ] Verifica user_type === 'business'
- [ ] Redirecciona a `/business/login`
- [ ] Muestra mensaje de éxito

### Login
- [ ] Formulario de login funciona
- [ ] Verifica email confirmado
- [ ] Verifica user_type === 'business'
- [ ] Usuarios consumidores no pueden entrar
- [ ] Busca negocio en BD correctamente
- [ ] Redirecciona al onboarding si no tiene negocio
- [ ] Redirecciona al dashboard si ya tiene negocio

### Onboarding
- [ ] Guard verifica autenticación
- [ ] Guard verifica que NO tenga negocio
- [ ] Guard redirecciona si ya tiene negocio
- [ ] 6 pasos se muestran correctamente
- [ ] Email viene pre-llenado del usuario autenticado
- [ ] Creación de negocio funciona
- [ ] Metadata se actualiza correctamente
- [ ] Redirecciona al dashboard al finalizar

### Dashboard
- [ ] ProtectedRoute verifica autenticación
- [ ] Verifica acceso al negocio específico
- [ ] Funciona correctamente

---

## Queries SQL de Verificación

### Verificar usuario registrado
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type,
  raw_user_meta_data->>'onboarding_completed' as onboarding_completed,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'user_type' = 'business'
ORDER BY created_at DESC;
```

### Verificar negocio creado
```sql
SELECT 
  b.id,
  b.business_name,
  b.email,
  u.email as user_email,
  b.email = u.email as emails_match
FROM businesses b
LEFT JOIN auth.users u ON u.email = b.email
WHERE u.raw_user_meta_data->>'user_type' = 'business'
ORDER BY b.created_at DESC;
```

---

## Mejoras Futuras

### Post-MVP
- [ ] Recuperar contraseña para negocios
- [ ] Cambiar contraseña
- [ ] Reenviar email de confirmación
- [ ] Login con Google/Facebook
- [ ] 2FA para negocios

---

## Conclusión

Este plan separa completamente la autenticación de negocios de la de consumidores:

✅ **Dos registros separados**
✅ **Dos logins separados**
✅ **Confirmación de email obligatoria**
✅ **Onboarding solo después de login**
✅ **6 pasos (no 7)**
✅ **Email viene del usuario autenticado**
✅ **Guards apropiados para cada ruta**

---

**Próximo paso:** Implementar los 7 archivos nuevos y modificar los 3 existentes según este plan.
