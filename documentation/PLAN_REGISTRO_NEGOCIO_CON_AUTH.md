# Plan: Registro de Negocio con Autenticación Previa

## Fecha
2026-01-27

## Objetivo

Agregar un paso inicial de **creación de cuenta de usuario** al flujo de registro de negocios, para que el usuario esté autenticado durante todo el proceso y pueda acceder a un dashboard de gestión después del registro.

---

## Flujo Actual (Problemático)

```
┌─────────────────────────────────────────────────────────────┐
│ Paso 1: Info Básica                                        │
│ Paso 2: Documentación Legal                                │
│ Paso 3: Catálogo                                            │
│ Paso 4: Entrega                                             │
│ Paso 5: UCP Config                                          │
│ Paso 6: Revisión Final                                      │
│   └─> [Crear Negocio] ❌ FALLA: Usuario no autenticado     │
└─────────────────────────────────────────────────────────────┘
```

### Problemas Identificados:
- ❌ Usuario no autenticado → No hay JWT
- ❌ Políticas RLS bloquean INSERT (requieren `TO authenticated`)
- ❌ No hay forma de asociar el negocio con un usuario dueño
- ❌ No hay dashboard post-registro

---

## Flujo Propuesto (Solución)

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 0: CREAR CUENTA (NUEVO)                               │
│ ├─ Email del negocio                                        │
│ ├─ Contraseña                                               │
│ ├─ Confirmar contraseña                                     │
│ └─> [Sign Up + Auto Login] ✅ Usuario autenticado          │
├─────────────────────────────────────────────────────────────┤
│ Paso 1: Info Básica del Negocio                            │
│ Paso 2: Documentación Legal                                │
│ Paso 3: Catálogo                                            │
│ Paso 4: Métodos de Entrega                                 │
│ Paso 5: Configuración UCP                                  │
│ Paso 6: Revisión Final                                      │
│   └─> [Crear Negocio] ✅ Con usuario autenticado           │
├─────────────────────────────────────────────────────────────┤
│ REDIRECCIÓN: DASHBOARD DE NEGOCIO (NUEVO)                  │
│ ├─ Vista general del negocio                                │
│ ├─ Gestión de productos (.csv upload)                       │
│ ├─ Gestión de órdenes                                       │
│ ├─ Configuración del agente                                 │
│ ├─ Perfil del negocio                                       │
│ └─ Logout                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Nuevo Paso 0: Crear Cuenta de Usuario

### 1.1. Nuevo Componente: `BusinessAuthStep.tsx`

**Ubicación:** `chat-client/components/Business/steps/BusinessAuthStep.tsx`

**Funcionalidad:**
- Formulario de registro con email y contraseña
- Validación de contraseñas coincidentes
- Integración con Supabase Auth
- Auto-login después del registro
- Manejo de errores (email duplicado, contraseña débil, etc.)

**Campos:**
```typescript
interface BusinessAuthData {
  email: string;           // Email del usuario/negocio
  password: string;        // Contraseña (mínimo 8 caracteres)
  confirmPassword: string; // Confirmación de contraseña
}
```

**Validaciones:**
- ✅ Email válido (formato)
- ✅ Email no registrado previamente
- ✅ Contraseña mínimo 8 caracteres
- ✅ Contraseña incluye mayúsculas, minúsculas, números
- ✅ Contraseñas coinciden
- ✅ Términos y condiciones aceptados

**Código Base:**
```typescript
const handleSignUp = async () => {
  // Validar campos
  if (password !== confirmPassword) {
    setError('Las contraseñas no coinciden');
    return;
  }

  // Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        user_type: 'business',
        onboarding_step: 1, // Indica que está en proceso de onboarding
      }
    }
  });

  if (error) {
    setError(error.message);
    return;
  }

  // Auto-login (Supabase lo hace automáticamente después de signUp)
  // Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    onValidationChange(true); // Habilitar botón "Siguiente"
    onChange({ email: user.email, userId: user.id });
  }
};
```

**UI Propuesta:**
```
┌─────────────────────────────────────────────────────────┐
│  🏢 Registro de Negocio                                 │
│                                                          │
│  Paso 1: Crear tu cuenta                                │
│  ─────────────────────────────────────────────────      │
│                                                          │
│  📧 Email del negocio *                                 │
│  [_____________________________________________]         │
│                                                          │
│  🔒 Contraseña *                                        │
│  [_____________________________________________]         │
│  Mínimo 8 caracteres                                    │
│                                                          │
│  🔒 Confirmar contraseña *                              │
│  [_____________________________________________]         │
│                                                          │
│  ☑ Acepto los términos y condiciones                   │
│                                                          │
│  [<- Volver]                    [Crear Cuenta ->]       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Modificaciones al Flujo de Registro

### 2.1. Actualizar `BusinessRegister.tsx`

**Cambios:**

1. **Agregar nuevo paso 0:**
```typescript
const STEP_LABELS = [
  'Crear Cuenta',    // NUEVO - Paso 0 (o Paso 1)
  'Info Básica',     // Era Paso 1, ahora Paso 2
  'Documentación',   // Era Paso 2, ahora Paso 3
  'Catálogo',        // Era Paso 3, ahora Paso 4
  'Entrega',         // Era Paso 4, ahora Paso 5
  'UCP',             // Era Paso 5, ahora Paso 6
  'Revisión',        // Era Paso 6, ahora Paso 7
];

const [currentStep, setCurrentStep] = useState(1); // Empieza en paso 1 (Crear Cuenta)
```

2. **Agregar estado para auth data:**
```typescript
const [businessData, setBusinessData] = useState<any>({
  auth: null,        // NUEVO - Datos de autenticación
  basicInfo: null,
  legalInfo: null,
  catalog: null,
  delivery: null,
  ucpConfig: null,
});
```

3. **Actualizar renderCurrentStep():**
```typescript
const renderCurrentStep = () => {
  switch (currentStep) {
    case 1: // NUEVO
      return (
        <BusinessAuthStep
          data={businessData.auth}
          onChange={(data) => handleStepDataChange('auth', data)}
          onValidationChange={setCanProceed}
        />
      );
    case 2: // Era caso 1
      return (
        <BusinessInfoStep
          data={businessData.basicInfo}
          onChange={(data) => handleStepDataChange('basicInfo', data)}
          onValidationChange={setCanProceed}
          userEmail={businessData.auth?.email} // NUEVO - Pre-llenar con email de auth
        />
      );
    // ... resto de casos (incrementar números)
    case 7: // Era caso 6
      return (
        <ReviewStep
          businessData={businessData}
          onValidationChange={setCanProceed}
        />
      );
  }
};
```

4. **Modificar handleNext() en el paso final:**
```typescript
const handleNext = async () => {
  if (currentStep === 7) { // Era 6, ahora 7
    try {
      setLoading(true);
      setError(null);
      
      // Verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Sesión expirada. Por favor, vuelve a iniciar el proceso.');
        setLoading(false);
        return;
      }
      
      // Crear el negocio con el email del usuario autenticado
      const business = await businessService.createBusiness({
        // ... datos del formulario ...
        email: user.email, // IMPORTANTE: Usar email del usuario autenticado
      });
      
      // Guardar configuración UCP
      if (businessData.ucpConfig) {
        await businessConfigService.saveConfiguration(business.id, businessData.ucpConfig);
      }
      
      // NUEVO: Marcar onboarding como completado en user_metadata
      await supabase.auth.updateUser({
        data: {
          onboarding_completed: true,
          business_id: business.id,
        }
      });
      
      // NUEVO: Redirigir al dashboard de negocios
      navigate(`/business/dashboard/${business.id}`);
      
    } catch (err: any) {
      console.error('Error creating business:', err);
      setError(err?.message || 'Error al registrar el negocio.');
    } finally {
      setLoading(false);
    }
  } else {
    setCurrentStep(currentStep + 1);
    setCanProceed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
```

### 2.2. Actualizar `BusinessInfoStep.tsx`

Pre-llenar el email con el del usuario autenticado:

```typescript
interface BusinessInfoStepProps {
  data: BusinessInfoData | null;
  onChange: (data: BusinessInfoData) => void;
  onValidationChange: (isValid: boolean) => void;
  userEmail?: string; // NUEVO - Email del usuario autenticado
}

export function BusinessInfoStep({ 
  data, 
  onChange, 
  onValidationChange,
  userEmail // NUEVO
}: BusinessInfoStepProps) {
  const [formData, setFormData] = useState<BusinessInfoData>(
    data || {
      businessName: '',
      legalName: '',
      businessType: '',
      email: userEmail || '', // NUEVO - Pre-llenar con email de auth
      // ... resto de campos
    }
  );

  // NUEVO: Deshabilitar campo email (ya fue establecido en auth)
  // O permitir edición pero validar que coincida
}
```

---

## 3. Dashboard de Negocios (Post-Registro)

### 3.1. Nueva Estructura de Rutas

**Ubicación:** `chat-client/App.tsx` o Router principal

```typescript
// Rutas protegidas para negocios
<Route path="/business" element={<ProtectedRoute userType="business" />}>
  <Route path="dashboard/:businessId" element={<BusinessDashboard />} />
  <Route path="products/:businessId" element={<ProductsManagement />} />
  <Route path="orders/:businessId" element={<OrdersManagement />} />
  <Route path="config/:businessId" element={<BusinessConfigPanel />} />
  <Route path="profile/:businessId" element={<BusinessProfile />} />
</Route>
```

### 3.2. Componente: `ProtectedRoute.tsx`

**Ubicación:** `chat-client/components/Shared/ProtectedRoute.tsx`

**Funcionalidad:**
- Verificar que el usuario esté autenticado
- Verificar que el usuario sea de tipo "business"
- Redirigir a login si no está autenticado
- Verificar que el businessId pertenezca al usuario

```typescript
export function ProtectedRoute({ 
  children, 
  userType 
}: { 
  children: React.ReactNode; 
  userType: 'business' | 'consumer' 
}) {
  const { user, loading } = useAuth(); // Custom hook
  const { businessId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Verificar que el usuario tenga acceso a este negocio
    if (user && businessId) {
      verifyBusinessAccess(user.id, businessId).then(hasAccess => {
        if (!hasAccess) {
          navigate('/unauthorized');
        }
      });
    }
  }, [user, loading, businessId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <>{children}</>;
}
```

### 3.3. Custom Hook: `useAuth.ts`

**Ubicación:** `chat-client/hooks/useAuth.ts`

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Escuchar cambios en auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### 3.4. Componente: `BusinessDashboard.tsx`

**Ubicación:** `chat-client/components/Business/Dashboard/BusinessDashboard.tsx`

**Estructura:**
```
┌────────────────────────────────────────────────────────────┐
│  🏢 JANDI Business                            👤 Juan 🔽   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Dashboard de Pizzería Corleone                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ 📦 Productos│  │ 📋 Órdenes  │  │ 💰 Ventas   │       │
│  │     15      │  │      3      │  │  $12,500    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
│  📈 Órdenes Recientes                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ #ORD-001  Pizza Napolitana x2    $850   Pendiente   │ │
│  │ #ORD-002  Empanadas x12          $600   En camino   │ │
│  │ #ORD-003  Combo Familiar         $1200  Entregado   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  🔗 Acciones Rápidas                                       │
│  [➕ Agregar Producto] [⬆️ Subir CSV] [⚙️ Configurar]    │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  📊 Dashboard  │  📦 Productos  │  📋 Órdenes  │  ⚙️ Config│
└────────────────────────────────────────────────────────────┘
```

**Secciones:**
1. **Header** - Logo, nombre del negocio, perfil del usuario
2. **Métricas** - Cards con estadísticas clave
3. **Órdenes recientes** - Lista de últimas órdenes
4. **Acciones rápidas** - Botones para acciones comunes
5. **Navigation tabs** - Tabs para navegar entre secciones

---

## 4. Gestión de Productos

### 4.1. Componente: `ProductsManagement.tsx`

**Ubicación:** `chat-client/components/Business/Dashboard/ProductsManagement.tsx`

**Funcionalidades:**
- ✅ Listar productos del negocio
- ✅ Agregar producto manualmente
- ✅ Editar producto existente
- ✅ Eliminar producto
- ✅ Upload de CSV con validación
- ✅ Exportar catálogo a CSV
- ✅ Búsqueda y filtros
- ✅ Paginación

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  📦 Gestión de Productos                                   │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  [🔍 Buscar...]  [Categoría 🔽]  [➕ Agregar]  [⬆️ CSV]   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Imagen │ Nombre       │ Precio │ Stock │ Estado │ ✏️│ │
│  ├────────┼──────────────┼────────┼───────┼────────┼───┤ │
│  │ 🍕     │ Pizza Napo.. │ $425   │ 50    │ ✅     │✏️│ │
│  │ 🥟     │ Empanadas..  │ $50    │ 200   │ ✅     │✏️│ │
│  │ 🍷     │ Vino Tinto   │ $350   │ 10    │ ❌     │✏️│ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  📄 Mostrando 1-10 de 15 productos   [← 1 2 3 →]          │
└────────────────────────────────────────────────────────────┘
```

### 4.2. Upload de CSV

**Servicio:** `ProductImportService.ts`

**Formato CSV Esperado:**
```csv
product_id,name,description,price,currency,stock_quantity,category,images
PIZZA-001,Pizza Napolitana,Pizza con tomate y mozzarella,425,ARS,50,pizzas,https://...
EMPAN-001,Empanadas de Carne,Empanadas caseras,50,ARS,200,empanadas,https://...
```

**Validaciones:**
- ✅ Formato CSV válido
- ✅ Campos requeridos presentes
- ✅ Precios válidos (números positivos)
- ✅ Stock válido (enteros no negativos)
- ✅ URLs de imágenes válidas
- ✅ Product IDs únicos

**Flujo:**
```typescript
const handleCSVUpload = async (file: File) => {
  // 1. Leer archivo CSV
  const text = await file.text();
  const rows = parseCSV(text);
  
  // 2. Validar formato
  const validation = validateCSVFormat(rows);
  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }
  
  // 3. Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from('product-imports')
    .upload(`${businessId}/${Date.now()}.csv`, file);
  
  // 4. Crear registro en business_catalog_imports
  await supabase.from('business_catalog_imports').insert({
    business_id: businessId,
    source_type: 'csv',
    file_url: data.path,
    status: 'pending',
  });
  
  // 5. Procesar en background (o en frontend)
  await processCSVImport(businessId, rows);
  
  // 6. Mostrar resultados
  showImportResults(results);
};
```

---

## 5. Gestión de Órdenes

### 5.1. Componente: `OrdersManagement.tsx`

**Ubicación:** `chat-client/components/Business/Dashboard/OrdersManagement.tsx`

**Funcionalidades:**
- ✅ Listar órdenes del negocio
- ✅ Filtrar por estado (pendiente, en proceso, completado, cancelado)
- ✅ Ver detalle de orden
- ✅ Actualizar estado de orden
- ✅ Notificar al cliente
- ✅ Estadísticas de órdenes

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  📋 Gestión de Órdenes                                     │
│  ────────────────────────────────────────────────────────  │
│                                                             │
│  [Todas] [Pendientes (3)] [En Proceso (2)] [Completadas]  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ #ORD-001         Juan Castro         $850    10:30   │ │
│  │ 📦 Pizza Napolitana x2                                │ │
│  │ 🏠 Delivery a: Céspedes 2563                          │ │
│  │ [👁️ Ver] [✅ Aceptar] [❌ Rechazar]                   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ #ORD-002         María García        $600    11:15   │ │
│  │ 📦 Empanadas x12                                      │ │
│  │ 🏃 Pickup en local                                    │ │
│  │ [👁️ Ver] [✅ Listo para retirar]                     │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Base de Datos: Cambios Necesarios

### 6.1. Tabla: `users`

**Ya existe**, pero agregar metadata:

```sql
-- En el user_metadata de Supabase Auth
{
  "user_type": "business" | "consumer",
  "onboarding_completed": true/false,
  "business_id": "uuid" (si es business),
  "onboarding_step": 1-7 (durante el proceso)
}
```

### 6.2. Tabla: `business_owners` (Nueva - Opcional)

Para soportar múltiples dueños por negocio en el futuro:

```sql
CREATE TABLE business_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'admin', 'manager'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_id, user_id)
);

-- Índices
CREATE INDEX idx_business_owners_business_id ON business_owners(business_id);
CREATE INDEX idx_business_owners_user_id ON business_owners(user_id);

-- RLS
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business ownerships"
  ON business_owners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### 6.3. Función: Verificar Acceso al Negocio

```sql
CREATE OR REPLACE FUNCTION user_has_business_access(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el email del usuario coincide con el email del negocio
  RETURN EXISTS (
    SELECT 1
    FROM businesses
    WHERE id = p_business_id
      AND email = (
        SELECT email
        FROM auth.users
        WHERE id = p_user_id
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.4. Actualizar Política RLS de `businesses`

Ya la tenemos correcta, pero para verificar:

```sql
-- Política de SELECT para el dashboard
CREATE POLICY "Business owners can view their own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);
```

---

## 7. Servicios y Utilidades

### 7.1. Servicio: `AuthService.ts`

**Ubicación:** `chat-client/services/auth.service.ts`

```typescript
export class AuthService {
  /**
   * Registrar nuevo usuario de negocio
   */
  async signUpBusiness(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'business',
          onboarding_completed: false,
          onboarding_step: 1,
        },
        emailRedirectTo: `${window.location.origin}/business/verify`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Login de usuario de negocio
   */
  async signInBusiness(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Verificar que sea un usuario de tipo business
    if (data.user?.user_metadata?.user_type !== 'business') {
      throw new Error('Este usuario no es un negocio');
    }

    return data;
  }

  /**
   * Logout
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Actualizar metadata del usuario
   */
  async updateUserMetadata(metadata: any) {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (error) throw error;
    return data;
  }
}

export const authService = new AuthService();
```

### 7.2. Servicio: `BusinessDashboardService.ts`

**Ubicación:** `chat-client/services/business-dashboard.service.ts`

```typescript
export class BusinessDashboardService {
  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(businessId: string) {
    // Obtener conteo de productos
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('is_active', true);

    // Obtener conteo de órdenes por estado
    const { data: orders } = await supabase
      .from('orders')
      .select('status, total')
      .eq('business_id', businessId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;

    return {
      productCount,
      pendingOrders,
      totalRevenue,
      ordersCount: orders?.length || 0,
    };
  }

  /**
   * Obtener órdenes recientes
   */
  async getRecentOrders(businessId: string, limit = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:user_id(email, full_name),
        order_items(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Actualizar estado de orden
   */
  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Crear evento de cambio de estado
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'status_changed',
      event_data: { new_status: status },
    });

    return data;
  }
}

export const businessDashboardService = new BusinessDashboardService();
```

---

## 8. Navegación y Header del Dashboard

### 8.1. Componente: `BusinessHeader.tsx`

**Ubicación:** `chat-client/components/Business/Dashboard/BusinessHeader.tsx`

```typescript
export function BusinessHeader() {
  const { user } = useAuth();
  const { businessId } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadBusiness(businessId);
    }
  }, [businessId]);

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <img src="/images/JANDI_LOGO_COMPLETO.png" alt="JANDI" className="h-8" />
          <span className="text-lg font-semibold">Business</span>
        </div>

        {/* Nombre del negocio */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold">{business?.business_name}</h1>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
            <span>{user?.email}</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
              <Link to={`/business/profile/${businessId}`}>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  👤 Mi Perfil
                </button>
              </Link>
              <Link to={`/business/config/${businessId}`}>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  ⚙️ Configuración
                </button>
              </Link>
              <hr />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

### 8.2. Componente: `BusinessNavigation.tsx`

**Ubicación:** `chat-client/components/Business/Dashboard/BusinessNavigation.tsx`

```typescript
export function BusinessNavigation() {
  const { businessId } = useParams();
  const location = useLocation();

  const navItems = [
    { path: `/business/dashboard/${businessId}`, label: '📊 Dashboard', icon: '📊' },
    { path: `/business/products/${businessId}`, label: '📦 Productos', icon: '📦' },
    { path: `/business/orders/${businessId}`, label: '📋 Órdenes', icon: '📋' },
    { path: `/business/config/${businessId}`, label: '⚙️ Configuración', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-3 border-b-2 transition-colors ${
                location.pathname === item.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

---

## 9. Flujo Completo Paso a Paso

### 9.1. Secuencia de Registro

```
1. Usuario va a /business/register
   └─> Muestra BusinessRegister con Paso 1: Crear Cuenta

2. Usuario ingresa email y contraseña
   └─> BusinessAuthStep llama a supabase.auth.signUp()
   └─> Usuario queda autenticado automáticamente
   └─> JWT se guarda en localStorage

3. Usuario hace clic en "Siguiente"
   └─> Paso 2: BusinessInfoStep (email pre-llenado)
   └─> Paso 3: LegalInfoStep
   └─> Paso 4: CatalogStep
   └─> Paso 5: DeliveryStep
   └─> Paso 6: UCPConfigStep
   └─> Paso 7: ReviewStep

4. Usuario hace clic en "Registrar" en ReviewStep
   └─> businessService.createBusiness() con JWT válido
   └─> Política RLS permite INSERT (email coincide)
   └─> businessConfigService.saveConfiguration()
   └─> supabase.auth.updateUser() marca onboarding_completed: true
   └─> navigate(`/business/dashboard/${business.id}`)

5. Usuario llega al Dashboard
   └─> BusinessDashboard carga
   └─> ProtectedRoute verifica autenticación
   └─> businessDashboardService.getDashboardStats()
   └─> Muestra métricas, órdenes, productos
```

### 9.2. Secuencia de Login (Usuario Existente)

```
1. Usuario va a /business/login
   └─> Muestra formulario de login

2. Usuario ingresa email y contraseña
   └─> authService.signInBusiness()
   └─> Verifica user_type === 'business'
   └─> JWT se guarda en localStorage

3. Si onboarding_completed === false
   └─> Redirigir a /business/register (continuar onboarding)
   └─> Recuperar onboarding_step del user_metadata
   
   Si onboarding_completed === true
   └─> Buscar business_id en user_metadata
   └─> Redirigir a /business/dashboard/${business_id}

4. Usuario llega al Dashboard
   └─> BusinessDashboard carga normalmente
```

---

## 10. Checklist de Implementación

### Fase 1: Autenticación y Registro
- [ ] Crear `BusinessAuthStep.tsx`
- [ ] Crear `AuthService.ts`
- [ ] Actualizar `BusinessRegister.tsx` (agregar paso 0, incrementar números)
- [ ] Actualizar `StepProgress.tsx` (7 pasos en vez de 6)
- [ ] Actualizar `BusinessInfoStep.tsx` (pre-llenar email)
- [ ] Probar flujo de registro completo

### Fase 2: Dashboard Base
- [ ] Crear `ProtectedRoute.tsx`
- [ ] Crear `useAuth.ts` hook
- [ ] Crear estructura de rutas en App.tsx
- [ ] Crear `BusinessHeader.tsx`
- [ ] Crear `BusinessNavigation.tsx`
- [ ] Crear `BusinessDashboard.tsx` (versión básica)
- [ ] Crear `BusinessDashboardService.ts`

### Fase 3: Gestión de Productos
- [ ] Crear `ProductsManagement.tsx`
- [ ] Crear formulario de agregar producto
- [ ] Implementar edición de producto
- [ ] Implementar eliminación de producto
- [ ] Crear `ProductImportService.ts`
- [ ] Implementar upload de CSV
- [ ] Implementar validación de CSV
- [ ] Implementar preview de CSV antes de importar
- [ ] Crear tabla `business_catalog_imports` (ya existe)

### Fase 4: Gestión de Órdenes
- [ ] Crear `OrdersManagement.tsx`
- [ ] Implementar lista de órdenes con filtros
- [ ] Crear modal de detalle de orden
- [ ] Implementar actualización de estado
- [ ] Agregar notificaciones al cliente
- [ ] Implementar estadísticas de órdenes

### Fase 5: Configuración del Negocio
- [ ] Reutilizar `BusinessConfigPanel.tsx` existente
- [ ] Integrar en el dashboard
- [ ] Agregar opción de regenerar Agent Card

### Fase 6: Perfil del Negocio
- [ ] Crear `BusinessProfile.tsx`
- [ ] Permitir cambiar email (con re-autenticación)
- [ ] Permitir cambiar contraseña
- [ ] Permitir cambiar logo/imágenes
- [ ] Permitir cambiar información básica

### Fase 7: Testing y Pulido
- [ ] Probar flujo completo de registro
- [ ] Probar flujo de login
- [ ] Probar gestión de productos
- [ ] Probar gestión de órdenes
- [ ] Probar configuración
- [ ] Responsive design
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Success messages

---

## 11. Archivos a Crear

### Nuevos Componentes (16 archivos)
```
chat-client/components/Business/steps/
├── BusinessAuthStep.tsx (NUEVO)

chat-client/components/Business/Dashboard/
├── BusinessDashboard.tsx (NUEVO)
├── BusinessHeader.tsx (NUEVO)
├── BusinessNavigation.tsx (NUEVO)
├── ProductsManagement.tsx (NUEVO)
├── ProductForm.tsx (NUEVO)
├── ProductCSVUpload.tsx (NUEVO)
├── OrdersManagement.tsx (NUEVO)
├── OrderDetail.tsx (NUEVO)
├── BusinessProfile.tsx (NUEVO)

chat-client/components/Shared/
├── ProtectedRoute.tsx (NUEVO)
├── LoadingSpinner.tsx (NUEVO)
```

### Nuevos Servicios (3 archivos)
```
chat-client/services/
├── auth.service.ts (NUEVO)
├── business-dashboard.service.ts (NUEVO)
├── product-import.service.ts (NUEVO)
```

### Nuevos Hooks (1 archivo)
```
chat-client/hooks/
├── useAuth.ts (NUEVO)
```

### Archivos a Modificar (5 archivos)
```
chat-client/components/Business/
├── BusinessRegister.tsx (MODIFICAR - agregar paso 0, actualizar lógica)
├── StepProgress.tsx (MODIFICAR - 7 pasos)

chat-client/components/Business/steps/
├── BusinessInfoStep.tsx (MODIFICAR - pre-llenar email)

chat-client/
├── App.tsx (MODIFICAR - agregar rutas protegidas)

chat-client/services/
├── business.service.ts (YA MODIFICADO - mapeo de campos)
```

### SQL Scripts (1 archivo)
```
sql_scripts/
├── BUSINESS_AUTH_AND_DASHBOARD.sql (NUEVO)
```

---

## 12. Script SQL para Dashboard

### Archivo: `sql_scripts/BUSINESS_AUTH_AND_DASHBOARD.sql`

```sql
-- ============================================
-- Business Authentication and Dashboard Support
-- Fecha: 2026-01-27
-- ============================================

BEGIN;

-- ============================================
-- 1. Tabla: business_owners (Opcional - para futuro)
-- ============================================
CREATE TABLE IF NOT EXISTS business_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'admin', 'manager'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_owners_business_id ON business_owners(business_id);
CREATE INDEX IF NOT EXISTS idx_business_owners_user_id ON business_owners(user_id);

ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business ownerships"
  ON business_owners FOR SELECT
  TO authenticated
  USING (user_id::text = (auth.jwt() ->> 'sub')::text);

-- ============================================
-- 2. Función: Verificar acceso al negocio
-- ============================================
CREATE OR REPLACE FUNCTION user_has_business_access(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si el email del usuario coincide con el email del negocio
  RETURN EXISTS (
    SELECT 1
    FROM businesses
    WHERE id = p_business_id
      AND email = (
        SELECT raw_user_meta_data->>'email'
        FROM auth.users
        WHERE id = p_user_id
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Vista: business_with_stats (para dashboard)
-- ============================================
CREATE OR REPLACE VIEW business_with_stats AS
SELECT
  b.*,
  COUNT(DISTINCT p.id) as product_count,
  COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_revenue
FROM businesses b
LEFT JOIN products p ON p.business_id = b.id AND p.is_active = true
LEFT JOIN orders o ON o.business_id = b.id AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.id;

COMMIT;
```

---

## 13. Consideraciones de Seguridad

### 13.1. Validación de Email

- ✅ Verificar que el email sea único en Supabase Auth
- ✅ Enviar email de confirmación
- ✅ No permitir login hasta confirmar email (opcional)

### 13.2. Contraseñas

- ✅ Mínimo 8 caracteres
- ✅ Incluir mayúsculas, minúsculas, números
- ✅ Hash automático por Supabase Auth
- ✅ Permitir reset de contraseña

### 13.3. Acceso al Dashboard

- ✅ Solo usuarios autenticados
- ✅ Solo usuarios de tipo "business"
- ✅ Solo el dueño del negocio puede acceder
- ✅ Verificar businessId en cada request

### 13.4. RLS Policies

- ✅ Ya configuradas correctamente en FIX_RLS_BUSINESSES.sql
- ✅ Verificar que todas las tablas tengan RLS habilitado
- ✅ Políticas específicas para products, orders, etc.

---

## 14. Mejoras Futuras (Post-MVP)

### 14.1. Features Adicionales
- [ ] Multi-usuario por negocio (business_owners con roles)
- [ ] Notificaciones en tiempo real (órdenes nuevas)
- [ ] Chat con clientes
- [ ] Analytics y reportes avanzados
- [ ] Integración con sistemas externos (POS, accounting)
- [ ] App móvil para negocios
- [ ] QR code para menú digital
- [ ] Programa de fidelización

### 14.2. Optimizaciones
- [ ] Caching de datos del dashboard
- [ ] Lazy loading de órdenes antiguas
- [ ] Paginación server-side
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Service Worker para notificaciones push

---

## 15. Testing

### 15.1. Test Cases del Flujo de Registro

```
TC-001: Registro exitoso
- Ingresar email válido
- Ingresar contraseña válida (8+ chars)
- Confirmar contraseña
- Completar todos los pasos
- Verificar que el negocio se cree
- Verificar redirección al dashboard

TC-002: Email duplicado
- Intentar registrar con email existente
- Verificar error "Email already registered"

TC-003: Contraseñas no coinciden
- Ingresar contraseña
- Ingresar contraseña diferente en confirmación
- Verificar error "Las contraseñas no coinciden"

TC-004: Sesión persistente
- Registrar negocio
- Cerrar browser
- Abrir browser
- Verificar que sigue logueado
- Navegar a dashboard

TC-005: Logout
- Hacer logout
- Intentar acceder a /business/dashboard/:id
- Verificar redirección a /login
```

### 15.2. Test Cases del Dashboard

```
TC-101: Ver estadísticas
- Login como negocio
- Verificar que se muestren métricas correctas
- Verificar conteo de productos
- Verificar conteo de órdenes
- Verificar total de ventas

TC-102: Gestión de productos
- Agregar producto
- Editar producto
- Eliminar producto
- Upload CSV
- Verificar validaciones

TC-103: Gestión de órdenes
- Ver lista de órdenes
- Filtrar por estado
- Cambiar estado de orden
- Verificar que el cliente reciba notificación
```

---

## 16. Estimación de Esfuerzo

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| Fase 1: Auth y Registro | 12 tareas | 2-3 días |
| Fase 2: Dashboard Base | 7 tareas | 1-2 días |
| Fase 3: Gestión Productos | 9 tareas | 2-3 días |
| Fase 4: Gestión Órdenes | 6 tareas | 1-2 días |
| Fase 5: Configuración | 3 tareas | 0.5-1 día |
| Fase 6: Perfil | 5 tareas | 1 día |
| Fase 7: Testing | - | 1-2 días |
| **TOTAL** | **42 tareas** | **8-14 días** |

---

## 17. Priorización (MVP)

### Must Have (P0)
- ✅ Paso de creación de cuenta (BusinessAuthStep)
- ✅ Dashboard básico con métricas
- ✅ Lista de productos (sin CSV upload)
- ✅ Lista de órdenes (sin cambio de estado)
- ✅ Logout

### Should Have (P1)
- ✅ Gestión completa de productos
- ✅ CSV upload
- ✅ Cambio de estado de órdenes
- ✅ Configuración del negocio

### Could Have (P2)
- ⚪ Perfil del negocio editable
- ⚪ Notificaciones en tiempo real
- ⚪ Analytics avanzados

### Won't Have (Futuro)
- ⚪ Multi-usuario
- ⚪ Chat con clientes
- ⚪ App móvil

---

## Conclusión

Este plan cubre completamente el flujo de registro de negocios con autenticación previa y dashboard post-registro. La implementación seguirá este orden:

1. ✅ Crear BusinessAuthStep (paso 0 de registro)
2. ✅ Actualizar BusinessRegister con nuevo flujo
3. ✅ Crear infraestructura de dashboard (rutas, auth, etc.)
4. ✅ Implementar dashboard básico
5. ✅ Agregar gestión de productos
6. ✅ Agregar gestión de órdenes
7. ✅ Testing completo

**Archivos a crear:** ~20 nuevos archivos  
**Archivos a modificar:** ~5 archivos  
**Script SQL:** 1 archivo  
**Tiempo estimado:** 8-14 días de desarrollo

---

**Próximos pasos:**
1. Revisar y aprobar el plan
2. Priorizar features (MVP vs Nice-to-Have)
3. Comenzar implementación por Fase 1
4. Iterar y probar cada fase antes de continuar
