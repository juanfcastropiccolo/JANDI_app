# Plan Detallado: Sistema de Autenticación, Onboarding y Registro de Comercios - JANDI

**Fecha:** 25 de enero de 2026  
**Versión:** 1.0  
**Estado:** Planificación

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Paleta de Colores JANDI](#paleta-de-colores-jandi)
4. [Sistema de Base de Datos - Supabase](#sistema-de-base-de-datos-supabase)
5. [Componentes a Desarrollar](#componentes-a-desarrollar)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [Integraciones Técnicas](#integraciones-técnicas)
8. [Plan de Implementación](#plan-de-implementación)

---

## 1. Resumen Ejecutivo

### Objetivo
Desarrollar un sistema completo de autenticación, onboarding de usuarios y registro de comercios para JANDI, siguiendo los principios de UCP (Universal Commerce Protocol) y utilizando Google ADK para la integración de agentes.

### Alcance del Proyecto

#### 1.1 Landing Page
- Logo JANDI prominente
- Dos botones principales: **Ingresar** y **Registrarse**
- Footer con enlace a **"Publicá tu negocio en JANDI"**
- Diseño minimalista y moderno

#### 1.2 Sistema de Autenticación
- Login con Google OAuth 2.0
- Login tradicional (email/contraseña)
- Registro de nuevos usuarios
- Recuperación de contraseña

#### 1.3 Onboarding de Usuario (5 Pantallas)
1. **Datos básicos y logística**
2. **Universo de compras**
3. **Preferencias y reglas de decisión**
4. **Nivel de autonomía del agente**
5. **Configuración de pago**

#### 1.4 Portal de Registro para Comercios
- Interfaz inspirada en PedidosYa
- Formulario multi-paso
- Carga de documentación
- Configuración de catálogo y stock
- Integración con UCP

---

## 2. Arquitectura General

### Stack Tecnológico

```
Frontend (Chat Client)
├── React 18+
├── TypeScript
├── Vite
├── TailwindCSS (inline styles con variables CSS)
└── React Router (para navegación)

Backend
├── Supabase (Base de datos PostgreSQL)
├── Supabase Auth (Autenticación)
├── Supabase Storage (Almacenamiento de imágenes)
└── Google ADK (Python) - Business Agent

Integraciones
├── Google OAuth 2.0
├── Mercado Pago API (mockup)
├── UCP Protocol v2026-01-11
└── A2A (Agent-to-Agent) Protocol
```

### Arquitectura de Carpetas

```
chat-client/
├── components/
│   ├── Auth/
│   │   ├── LandingPage.tsx          # Landing principal
│   │   ├── LoginForm.tsx            # Formulario de login
│   │   ├── RegisterForm.tsx         # Formulario de registro
│   │   ├── GoogleAuthButton.tsx    # Botón OAuth Google
│   │   └── AuthLayout.tsx           # Layout compartido
│   ├── Onboarding/
│   │   ├── OnboardingContainer.tsx  # Contenedor principal
│   │   ├── Step1Identity.tsx        # Pantalla 1: Datos básicos
│   │   ├── Step2Shopping.tsx        # Pantalla 2: Contexto de compras
│   │   ├── Step3Preferences.tsx     # Pantalla 3: Preferencias
│   │   ├── Step4Autonomy.tsx        # Pantalla 4: Autonomía
│   │   ├── Step5Payment.tsx         # Pantalla 5: Pago
│   │   ├── StepIndicator.tsx        # Indicador de progreso
│   │   └── NavigationButtons.tsx    # Botones siguiente/atrás
│   ├── Business/
│   │   ├── BusinessLanding.tsx      # Landing para comercios
│   │   ├── BusinessRegister.tsx     # Registro de comercios
│   │   ├── StepProgress.tsx         # Barra de progreso
│   │   ├── BusinessInfo.tsx         # Info del negocio
│   │   ├── MenuUpload.tsx           # Carga de menú/productos
│   │   ├── DocumentUpload.tsx       # Carga de documentos
│   │   └── UCPConfiguration.tsx     # Configuración UCP
│   └── Shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── SuccessMessage.tsx
├── contexts/
│   ├── AuthContext.tsx              # Context de autenticación
│   └── OnboardingContext.tsx        # Context de onboarding
├── hooks/
│   ├── useAuth.ts                   # Hook para autenticación
│   ├── useSupabase.ts              # Hook para Supabase
│   └── useOnboarding.ts            # Hook para onboarding
├── services/
│   ├── supabase.ts                  # Cliente de Supabase
│   ├── auth.service.ts              # Servicios de auth
│   └── business.service.ts          # Servicios de comercios
└── types/
    ├── auth.types.ts
    ├── onboarding.types.ts
    └── business.types.ts
```

---

## 3. Paleta de Colores JANDI

### Variables CSS (ya existentes en `index.css`)

```css
:root {
  --jandi-dark-blue: #071952;    /* Azul oscuro principal */
  --jandi-medium-blue: #088395;  /* Azul medio - Hover states */
  --jandi-light-blue: #37B7C3;   /* Azul claro/turquesa - Acentos */
  --jandi-background: #EBF4F6;   /* Fondo principal */
  --jandi-white: #FFFFFF;
  --jandi-gray-light: #F9FAFB;
  --jandi-gray: #9CA3AF;
}
```

### Uso en Componentes

- **Fondos principales:** `#EBF4F6`
- **Botones primarios:** `#37B7C3` (light-blue)
- **Botones hover:** `#088395` (medium-blue)
- **Headers/Sidebar:** `#071952` (dark-blue)
- **Texto principal:** `#071952`
- **Texto secundario:** `#9CA3AF`

---

## 4. Sistema de Base de Datos - Supabase

### 4.1 Información de Conexión

```
Proyecto: JANDI_db
URL: https://bstddwmpsbfrwqaudkai.supabase.co
```

### 4.2 Schema de Base de Datos

#### Tabla: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- OAuth info
  google_id VARCHAR(255) UNIQUE,
  auth_provider VARCHAR(50) DEFAULT 'email', -- 'email' | 'google'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

#### Tabla: `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Onboarding Step 1: Identidad y logística
  nickname VARCHAR(100),
  primary_address JSONB, -- {street, city, state, zip, country, lat, lng}
  secondary_addresses JSONB[], -- Array de direcciones
  
  -- Onboarding Step 2: Contexto de compras
  shopping_categories TEXT[], -- ['supermercado', 'limpieza', 'mascotas', etc.]
  custom_categories TEXT[],
  
  -- Onboarding Step 3: Preferencias
  priority VARCHAR(50), -- 'precio' | 'marca' | 'calidad' | 'consistencia'
  out_of_stock_action VARCHAR(50), -- 'replace' | 'notify'
  favorite_brands JSONB, -- {category: [brands]}
  
  -- Onboarding Step 4: Autonomía
  autonomy_level VARCHAR(50), -- 'full' | 'semi' | 'manual'
  max_amount_per_purchase DECIMAL(10, 2),
  max_amount_per_month DECIMAL(10, 2),
  notification_preference VARCHAR(50), -- 'always' | 'threshold' | 'never'
  summary_frequency VARCHAR(50), -- 'daily' | 'weekly' | 'on_anomaly'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### Tabla: `payment_methods`
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- UCP Payment Handler info
  handler_id VARCHAR(255) NOT NULL,
  handler_name VARCHAR(255) NOT NULL, -- 'com.mercadopago.tokenizer'
  
  -- Payment instrument data (encrypted/tokenized)
  type VARCHAR(50) NOT NULL, -- 'card' | 'mercadopago' | 'bank'
  brand VARCHAR(50), -- 'visa' | 'mastercard'
  last_digits VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  
  -- Token/credential reference (NEVER store raw card data)
  token_reference TEXT NOT NULL, -- Encrypted token from payment provider
  
  -- Billing address
  billing_address JSONB,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
```

#### Tabla: `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255),
  
  -- A2A Context
  context_id VARCHAR(255), -- A2A contextId
  task_id VARCHAR(255), -- A2A taskId
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated ON conversations(user_id, updated_at DESC);
```

#### Tabla: `messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  sender VARCHAR(50) NOT NULL, -- 'user' | 'model'
  text TEXT,
  
  -- Message data (products, checkout, etc.)
  products JSONB,
  checkout JSONB,
  payment_methods JSONB,
  payment_instrument JSONB,
  
  -- Flags
  is_loading BOOLEAN DEFAULT false,
  is_user_action BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);
```

#### Tabla: `businesses`
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información básica
  business_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Contacto
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  website_url TEXT,
  
  -- Dirección
  address JSONB, -- {street, city, state, zip, country, lat, lng}
  
  -- Legal info
  tax_id VARCHAR(100), -- CUIT/DNI
  business_type VARCHAR(50), -- 'restaurant' | 'store' | 'pharmacy' | 'supermarket'
  legal_entity_type VARCHAR(50), -- 'individual' | 'company'
  
  -- UCP Profile
  ucp_profile JSONB, -- Complete UCP profile according to spec
  
  -- Horarios
  business_hours JSONB, -- {monday: {open: '09:00', close: '18:00'}, ...}
  
  -- Delivery info
  delivery_radius_km DECIMAL(5, 2),
  delivery_fee DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_businesses_email ON businesses(email);
CREATE INDEX idx_businesses_active ON businesses(is_active) WHERE is_active = true;
```

#### Tabla: `business_documents`
```sql
CREATE TABLE business_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  document_type VARCHAR(50) NOT NULL, -- 'dni' | 'cuit' | 'menu' | 'contract' | 'bank_account'
  document_url TEXT NOT NULL, -- URL in Supabase Storage
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_business_documents_business_id ON business_documents(business_id);
```

#### Tabla: `products`
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- UCP Product Schema
  product_id VARCHAR(255) NOT NULL, -- SKU or unique identifier
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  compare_at_price DECIMAL(10, 2), -- Precio tachado
  
  -- Images
  images TEXT[], -- Array de URLs
  
  -- Categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  stock_status VARCHAR(50) DEFAULT 'in_stock', -- 'in_stock' | 'out_of_stock' | 'low_stock'
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Attributes (UCP Schema)
  attributes JSONB, -- Size, color, weight, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(business_id, product_id)
);

CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_active ON products(business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_products_category ON products(category, subcategory);
```

#### Tabla: `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  conversation_id UUID REFERENCES conversations(id),
  
  -- UCP Checkout data
  checkout_id VARCHAR(255),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  
  -- Order items
  line_items JSONB NOT NULL, -- UCP line_items schema
  
  -- Amounts (in cents)
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  shipping INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Delivery
  delivery_address JSONB NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_method_id UUID REFERENCES payment_methods(id),
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'refunded'
  payment_handler_id VARCHAR(255),
  payment_data JSONB, -- UCP payment instrument
  
  -- Order status (UCP Order schema)
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled'
  fulfillment_status VARCHAR(50), -- UCP fulfillment status
  
  -- Tracking
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

#### Tabla: `order_events`
```sql
CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL, -- 'status_changed' | 'payment_completed' | 'shipped' | etc.
  event_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_created ON order_events(order_id, created_at);
```

---

## 5. Componentes a Desarrollar

### 5.1 Landing Page

**Archivo:** `components/Auth/LandingPage.tsx`

```tsx
interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToBusiness: () => void;
}

// Diseño:
// - Fondo con gradiente sutil de JANDI (background → light-blue)
// - Logo JANDI centrado (grande)
// - Dos botones centrados: "Ingresar" y "Registrarse"
// - Footer pegado abajo con link "Publicá tu negocio en JANDI"
```

**Características:**
- Animación de fade-in al cargar
- Botones con efecto hover (cambio de color)
- Responsive (mobile-first)
- Logo desde `/images/JANDI_LOGO_COMPLETO.png`

---

### 5.2 Sistema de Login

**Archivo:** `components/Auth/LoginForm.tsx`

```tsx
interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
}

// Campos:
// - Email
// - Contraseña
// - Botón "Ingresar"
// - Botón "Continuar con Google" (OAuth)
// - Link "¿Olvidaste tu contraseña?"
// - Link "¿No tenés cuenta? Registrate"
```

**Funcionalidades:**
1. Validación de formulario
2. Integración con Supabase Auth
3. Manejo de errores (credenciales incorrectas, cuenta no verificada)
4. Google OAuth flow
5. Redirección post-login

---

### 5.3 Google OAuth Button

**Archivo:** `components/Auth/GoogleAuthButton.tsx`

```tsx
// Botón estilizado con logo de Google oficial
// Colores: fondo blanco, borde gris, hover con sombra
// Logo descargado de: https://developers.google.com/identity/branding-guidelines
```

**Implementación:**
```typescript
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
};
```

---

### 5.4 Onboarding Container

**Archivo:** `components/Onboarding/OnboardingContainer.tsx`

```tsx
interface OnboardingData {
  step: number;
  totalSteps: 5;
  data: {
    identity: IdentityData;
    shopping: ShoppingData;
    preferences: PreferencesData;
    autonomy: AutonomyData;
    payment: PaymentData;
  };
}

// Contenedor principal que:
// 1. Maneja el estado global del onboarding
// 2. Controla la navegación entre pasos
// 3. Implementa animación de slide (translateX)
// 4. Persiste datos en localStorage (backup)
// 5. Submit final a Supabase
```

**Animación de transición:**
```css
.onboarding-container {
  overflow-x: hidden;
  position: relative;
}

.step-wrapper {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 500%; /* 5 pantallas × 100% */
}

.step {
  min-width: 20%; /* 100% / 5 */
  padding: 2rem;
}

/* Cuando step = 2, transform: translateX(-20%) */
```

---

### 5.5 Onboarding - Pantalla 1: Identidad

**Archivo:** `components/Onboarding/Step1Identity.tsx`

```tsx
interface IdentityData {
  nickname: string;
  email: string; // Pre-filled desde auth
  phone: string;
  primaryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  secondaryAddresses: Address[];
}

// Copy:
// "Arranquemos por lo básico"
// "Esto le permite a JANDI saber quién sos y dónde hacer llegar las cosas."

// Campos mandatorios:
// - Nombre/Apodo
// - Teléfono
// - Dirección principal
```

**Validaciones:**
- Email: formato válido (pre-llenado)
- Teléfono: formato argentino (+54 9 11...)
- Dirección: todos los campos requeridos
- Botón "Siguiente" habilitado solo si todo está completo

---

### 5.6 Onboarding - Pantalla 2: Compras

**Archivo:** `components/Onboarding/Step2Shopping.tsx`

```tsx
interface ShoppingData {
  categories: string[];
  customCategories: string[];
}

// Copy:
// "¿Qué cosas comprás normalmente?"
// "Elegí las cosas que comprás seguido. Esto no te ata a nada."

// Chips seleccionables (multi-select):
const CATEGORIES = [
  { id: 'supermercado', label: '🥦 Supermercado / Almacén', icon: '🥦' },
  { id: 'limpieza', label: '🧼 Limpieza', icon: '🧼' },
  { id: 'mascotas', label: '🐶 Mascotas', icon: '🐶' },
  { id: 'farmacia', label: '💊 Farmacia', icon: '💊' },
  { id: 'bebidas', label: '🍷 Bebidas', icon: '🍷' },
  { id: 'bebes', label: '👶 Bebés', icon: '👶' },
  { id: 'reposicion', label: '🧻 Reposición básica', icon: '🧻' },
];

// Campo opcional:
// - "¿Algo más que compres seguido?" (input de texto)
```

**Diseño:**
- Grid de chips con colores JANDI
- Chips seleccionados: background light-blue, border medium-blue
- Chips no seleccionados: background white, border gray
- Animación al seleccionar (scale + color transition)

---

### 5.7 Onboarding - Pantalla 3: Preferencias

**Archivo:** `components/Onboarding/Step3Preferences.tsx`

```tsx
interface PreferencesData {
  priority: 'price' | 'brand' | 'quality' | 'consistency';
  outOfStockAction: 'replace' | 'notify';
  favoriteBrands: { [category: string]: string[] };
}

// Copy:
// "Ayudanos a decidir como vos"
// "Así JANDI puede avanzar sin molestarte."

// Radio buttons:
// "Cuando comprás, priorizás:"
// ⭕ Precio
// ⭕ Marca
// ⭕ Calidad
// ⭕ Siempre lo mismo

// Radio buttons:
// "Si no hay stock:"
// ⭕ Reemplazá por algo similar
// ⭕ Avisame

// Opcional:
// "Marcas favoritas" (input con tags)
```

---

### 5.8 Onboarding - Pantalla 4: Autonomía

**Archivo:** `components/Onboarding/Step4Autonomy.tsx`

```tsx
interface AutonomyData {
  autonomyLevel: 'full' | 'semi' | 'manual';
  maxAmountPerPurchase: number;
  maxAmountPerMonth: number;
  notificationPreference: 'always' | 'threshold' | 'never';
  summaryFrequency: 'daily' | 'weekly' | 'on_anomaly';
}

// Copy:
// "¿Cuánta libertad le damos a JANDI?"
// "Vos ponés las reglas. JANDI las sigue."

// Sliders o inputs:
// "JANDI puede comprar solo hasta:"
// - $X por compra (slider con input numérico)
// - $X por mes (slider con input numérico)

// Radio buttons:
// "Antes de comprar:"
// ⭕ Siempre avisame
// ⭕ Solo si pasa $X
// ⭕ Nunca (modo autónomo)

// Radio buttons:
// "¿Querés resúmenes?"
// ⭕ Diario
// ⭕ Semanal
// ⭕ Solo cuando pase algo raro
```

**UI Especial:**
- Sliders personalizados con colores JANDI
- Visualización en tiempo real del nivel de autonomía
- Advertencia visual si autonomía = "full"

---

### 5.9 Onboarding - Pantalla 5: Pago

**Archivo:** `components/Onboarding/Step5Payment.tsx`

```tsx
interface PaymentData {
  method: 'mercadopago' | 'card';
  mercadoPagoEmail?: string;
  cardData?: {
    number: string; // Tokenizado
    name: string;
    expiry: string;
    cvv: string; // No se guarda
  };
}

// Copy:
// "Listo. JANDI ya puede encargarse."
// "Siempre bajo tus reglas."

// Opciones:
// 1. Conectar con Mercado Pago (botón con logo)
// 2. Cargar tarjeta manualmente

// Para testing (mockup):
// - Cualquier número de tarjeta (formato 16 dígitos)
// - Cualquier fecha futura
// - Cualquier CVV (3 dígitos)
```

**Validaciones (mockup):**
- Número de tarjeta: 16 dígitos
- Fecha de expiración: MM/YY, fecha futura
- CVV: 3 dígitos
- Nombre: cualquier texto

**Tokenización (simulada):**
```typescript
const tokenizeCard = (cardData: CardData): string => {
  // En producción, esto llamaría a Mercado Pago o PSP
  // Para testing, generar token aleatorio
  return `tok_${crypto.randomUUID()}`;
};
```

---

### 5.10 Business Landing Page

**Archivo:** `components/Business/BusinessLanding.tsx`

**Diseño inspirado en PedidosYa:**
- Hero section con imagen de fondo
- Headline: "¿Querés vender más? Publicá tu negocio en JANDI"
- Subheadline: "Conectá con miles de clientes que usan inteligencia artificial para comprar"
- Botón CTA: "Registrar mi negocio"
- Sección "¿Cómo funciona?" (3-4 pasos)
- Sección "Beneficios" (tarjetas con íconos)
- Testimonios (opcional)
- Footer con contacto

**Características:**
- Scroll animations (fade-in, slide-up)
- Responsive
- Colores JANDI con dominancia del light-blue para CTAs

---

### 5.11 Business Registration

**Archivo:** `components/Business/BusinessRegister.tsx`

**Flow multi-paso:**

#### Paso 1: Información Básica
```tsx
// Campos:
- Nombre del negocio
- Nombre legal (opcional)
- Tipo de negocio (dropdown: restaurant, store, pharmacy, etc.)
- Email
- Teléfono
- Dirección completa
- Logo (upload)
```

#### Paso 2: Información Legal
```tsx
// Campos:
- Tipo de entidad (Persona física / Persona jurídica)
- CUIT o DNI
- Upload de documentos:
  - DNI (ambas caras) o CUIT
  - Contrato social (si es jurídica)
  - Habilitación comercial (opcional)
```

#### Paso 3: Catálogo de Productos
```tsx
// Opciones:
1. Cargar menú/catálogo desde archivo (Excel, CSV, JSON)
2. Agregar productos manualmente (form)
3. Conectar con sistema existente (API) - futuro

// Campos por producto:
- Nombre
- Descripción
- Precio
- Categoría
- Imágenes
- Stock inicial
```

#### Paso 4: Configuración de Entrega
```tsx
// Campos:
- Radio de entrega (km)
- Costo de envío (fijo o por distancia)
- Monto mínimo de pedido
- Horarios de atención (lunes-domingo)
- Tiempo estimado de preparación
```

#### Paso 5: Configuración UCP
```tsx
// Generación automática del UCP profile:
{
  "ucp": {
    "version": "2026-01-11",
    "services": {
      "dev.ucp.shopping": {
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specification/overview",
        "rest": {
          "schema": "https://ucp.dev/services/shopping/rest.openapi.json",
          "endpoint": "https://jandi.app/api/businesses/{business_id}/ucp"
        }
      }
    },
    "capabilities": [
      {
        "name": "dev.ucp.shopping.checkout",
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specification/checkout",
        "schema": "https://ucp.dev/schemas/shopping/checkout.json"
      },
      {
        "name": "dev.ucp.shopping.fulfillment",
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specification/fulfillment",
        "schema": "https://ucp.dev/schemas/shopping/fulfillment.json",
        "extends": "dev.ucp.shopping.checkout"
      }
    ]
  },
  "payment": {
    "handlers": [
      {
        "id": "jandi_payment_provider",
        "name": "com.jandi.payment",
        "version": "2026-01-11",
        "spec": "https://jandi.app/specs/payment",
        "config": {
          "type": "CARD",
          "tokenization_specification": {
            "type": "PUSH",
            "parameters": {
              "token_retrieval_url": "https://api.jandi.app/v1/tokens"
            }
          }
        }
      }
    ]
  }
}
```

#### Paso 6: Revisión y Confirmación
```tsx
// Resumen de toda la información
// Checkbox de términos y condiciones
// Botón "Enviar para revisión"
```

---

## 6. Flujos de Usuario

### 6.1 Flujo de Registro y Onboarding

```
┌─────────────────────┐
│   Landing Page      │
│                     │
│  [Registrarse]      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Register Form     │
│                     │
│  - Email            │
│  - Contraseña       │
│  [Registrarse]      │
│  [Google OAuth]     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Email Verification │ (Supabase Auto)
│  (opcional)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Onboarding Step 1  │
│  (Identidad)        │
│  [Siguiente]        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Onboarding Step 2  │
│  (Compras)          │
│  [Siguiente]        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Onboarding Step 3  │
│  (Preferencias)     │
│  [Siguiente]        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Onboarding Step 4  │
│  (Autonomía)        │
│  [Siguiente]        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Onboarding Step 5  │
│  (Pago)             │
│  [Finalizar]        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Chat Home         │
│   (App principal)   │
└─────────────────────┘
```

### 6.2 Flujo de Login

```
┌─────────────────────┐
│   Landing Page      │
│                     │
│  [Ingresar]         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Login Form        │
│                     │
│  - Email            │
│  - Contraseña       │
│  [Ingresar]         │
│  [Google OAuth]     │
└──────────┬──────────┘
           │
           ▼
        ┌──┴───┐
        │      │
        ▼      ▼
   Onboarding  Chat Home
   (si no      (si onboarding
   completó)    completado)
```

### 6.3 Flujo de Registro de Comercio

```
┌─────────────────────┐
│  Business Landing   │
│                     │
│  [Registrar negocio]│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 1: Info Básica│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 2: Legal      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 3: Catálogo   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 4: Entrega    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 5: UCP Config │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paso 6: Revisión   │
│                     │
│  [Enviar]           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Confirmación       │
│                     │
│  "Tu solicitud está │
│   en revisión"      │
└─────────────────────┘
```

---

## 7. Integraciones Técnicas

### 7.1 Supabase Auth

**Configuración:**

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bstddwmpsbfrwqaudkai.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurar OAuth providers en Supabase Dashboard:
// Authentication > Providers > Google
// - Client ID: [Google Cloud Console]
// - Client Secret: [Google Cloud Console]
// - Redirect URLs: 
//   - http://localhost:5173/auth/callback
//   - https://jandi.app/auth/callback
```

**Hooks de autenticación:**

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
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

### 7.2 Google OAuth Setup

**1. Crear proyecto en Google Cloud Console**
- Ir a: https://console.cloud.google.com/
- Crear nuevo proyecto: "JANDI"
- Habilitar Google+ API

**2. Configurar OAuth consent screen**
- User Type: External
- App name: JANDI
- User support email: [tu email]
- Authorized domains: jandi.app

**3. Crear OAuth 2.0 credentials**
- Tipo: Web application
- Name: JANDI Web Client
- Authorized JavaScript origins:
  - http://localhost:5173
  - https://jandi.app
- Authorized redirect URIs:
  - http://localhost:5173/auth/callback
  - https://jandi.app/auth/callback

**4. Descargar logos de Google**
```bash
# Logos oficiales para el botón de Google Sign-In
# Usar desde: https://developers.google.com/identity/branding-guidelines
# Colocar en: chat-client/images/google/
```

### 7.3 Integración con Google ADK

**Archivo de configuración:** `seller_agent/llms-full.txt`

**Puntos clave para seguir:**

1. **Configuración de Persistencia (Session Service):**
   Para asegurar que la memoria del agente persista y escale, utilizaremos `DatabaseSessionService` conectado a Supabase (PostgreSQL).

```python
from google.adk.sessions import DatabaseSessionService
import os

# Connection string de Supabase (PostgreSQL)
# Formato: postgresql://user:password@host:port/dbname
db_url = os.getenv("SUPABASE_DB_URL")

# Inicializar servicio de sesiones
session_service = DatabaseSessionService(db_url=db_url)
```

2. **Inicialización del agente con ADK:**
```python
from google.adk.agents import Agent
from google.adk.tools import google_search

# Crear business agent
business_agent = Agent(
    name="jandi_business_agent",
    model="gemini-2.5-flash",
    session_service=session_service, # Usar Supabase para sesiones
    instruction="""
    Eres JANDI, un asistente de compras inteligente.
    Ayudas a los usuarios a encontrar productos y completar compras.
    Tienes acceso al catálogo de negocios registrados en la plataforma.
    """,
    description="Agente de negocios JANDI para UCP",
    tools=[
        # Tools personalizados para UCP
        get_business_catalog,
        create_checkout_session,
        update_checkout,
        complete_checkout,
    ]
)
```

3. **Herramientas UCP como tools de ADK:**
```python
@tool
async def create_checkout_session(
    business_id: str,
    line_items: list[dict],
    user_id: str
) -> dict:
    """
    Crea una sesión de checkout siguiendo UCP spec.
    
    Args:
        business_id: ID del negocio en JANDI
        line_items: Items del carrito (UCP schema)
        user_id: ID del usuario
        
    Returns:
        Checkout session con status, payment handlers, etc.
    """
    # Llamar a Supabase para crear checkout
    # Retornar UCP-compliant checkout object
    pass

@tool
async def get_business_catalog(
    business_id: str,
    category: Optional[str] = None,
    search_query: Optional[str] = None
) -> list[dict]:
    """
    Obtiene el catálogo de productos de un negocio.
    
    Args:
        business_id: ID del negocio
        category: Filtrar por categoría
        search_query: Búsqueda por texto
        
    Returns:
        Lista de productos (UCP Product schema)
    """
    # Query a Supabase products table
    pass
```

3. **Conexión con Supabase desde Python:**
```python
from supabase import create_client, Client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Queries
def get_user_profile(user_id: str):
    return supabase.table('user_profiles').select('*').eq('user_id', user_id).execute()

def create_order(order_data: dict):
    return supabase.table('orders').insert(order_data).execute()
```

### 7.4 UCP Profile Generation

**Generación automática del perfil UCP para cada negocio:**

```typescript
// services/business.service.ts
import { Business } from '../types/business.types';

export function generateUCPProfile(business: Business): UCPProfile {
  const baseUrl = `https://api.jandi.app/businesses/${business.id}`;
  
  return {
    ucp: {
      version: '2026-01-11',
      services: {
        'dev.ucp.shopping': {
          version: '2026-01-11',
          spec: 'https://ucp.dev/specification/overview',
          rest: {
            schema: 'https://ucp.dev/services/shopping/rest.openapi.json',
            endpoint: `${baseUrl}/ucp`,
          },
          a2a: {
            endpoint: `${baseUrl}/.well-known/agent-card.json`,
          },
        },
      },
      capabilities: [
        {
          name: 'dev.ucp.shopping.checkout',
          version: '2026-01-11',
          spec: 'https://ucp.dev/specification/checkout',
          schema: 'https://ucp.dev/schemas/shopping/checkout.json',
        },
        {
          name: 'dev.ucp.shopping.fulfillment',
          version: '2026-01-11',
          spec: 'https://ucp.dev/specification/fulfillment',
          schema: 'https://ucp.dev/schemas/shopping/fulfillment.json',
          extends: 'dev.ucp.shopping.checkout',
        },
        {
          name: 'dev.ucp.shopping.order',
          version: '2026-01-11',
          spec: 'https://ucp.dev/specification/order',
          schema: 'https://ucp.dev/schemas/shopping/order.json',
        },
      ],
    },
    payment: {
      handlers: [
        {
          id: crypto.randomUUID(),
          name: 'com.jandi.payment',
          version: '2026-01-11',
          spec: 'https://jandi.app/specs/payment',
          config_schema: 'https://jandi.app/schemas/payment-config.json',
          instrument_schemas: [
            'https://ucp.dev/schemas/shopping/types/card_payment_instrument.json',
          ],
          config: {
            type: 'CARD',
            tokenization_specification: {
              type: 'PUSH',
              parameters: {
                token_retrieval_url: `${baseUrl}/payment/tokens`,
              },
            },
          },
        },
      ],
    },
    signing_keys: [
      // Generar JWK para firma de webhooks
      generateSigningKey(business.id),
    ],
  };
}
```

---

## 8. Plan de Implementación

### Fase 1: Setup Inicial (Semana 1)

**Día 1-2: Configuración de Supabase**
- [ ] Crear proyecto JANDI_db en Supabase
- [ ] Ejecutar schema SQL completo
- [ ] Configurar Row Level Security (RLS)
- [ ] Configurar Storage buckets:
  - `business-documents` (privado)
  - `business-logos` (público)
  - `product-images` (público)
  - `user-avatars` (público)
- [ ] Configurar Google OAuth en Supabase
- [ ] Generar y guardar API keys

**Día 3-4: Setup del Frontend**
- [ ] Instalar dependencias necesarias:
  ```bash
  cd chat-client
  npm install @supabase/supabase-js
  npm install react-router-dom
  npm install @heroicons/react
  npm install framer-motion # Para animaciones
  ```
- [ ] Crear estructura de carpetas
- [ ] Configurar variables de entorno (.env.local)
- [ ] Setup de tipos TypeScript
- [ ] Crear servicios base (supabase.ts, auth.service.ts)

**Día 5: Google OAuth Setup**
- [ ] Crear proyecto en Google Cloud Console
- [ ] Configurar OAuth consent screen
- [ ] Crear credentials
- [ ] Descargar logos oficiales de Google
- [ ] Probar flow OAuth en localhost

### Fase 2: Autenticación (Semana 1-2)

**Día 6-7: Landing Page**
- [ ] Componente LandingPage.tsx
- [ ] Diseño responsive
- [ ] Animaciones de entrada
- [ ] Links a login, registro y business

**Día 8-9: Login System**
- [ ] Componente LoginForm.tsx
- [ ] GoogleAuthButton.tsx
- [ ] Validación de formularios
- [ ] Manejo de errores
- [ ] Integración con Supabase Auth
- [ ] Testing de flujo completo

**Día 10: Register System**
- [ ] Componente RegisterForm.tsx
- [ ] Validación de email único
- [ ] Confirmación de contraseña
- [ ] Email verification (opcional)
- [ ] Testing

### Fase 3: Onboarding (Semana 2)

**Día 11-12: Onboarding Container**
- [ ] OnboardingContainer.tsx
- [ ] Sistema de navegación entre steps
- [ ] Animaciones de slide
- [ ] Persistencia en localStorage
- [ ] StepIndicator.tsx
- [ ] NavigationButtons.tsx

**Día 13: Steps 1 & 2**
- [ ] Step1Identity.tsx
- [ ] Step2Shopping.tsx
- [ ] Validaciones
- [ ] Estilos JANDI

**Día 14: Steps 3 & 4**
- [ ] Step3Preferences.tsx
- [ ] Step4Autonomy.tsx
- [ ] Componentes personalizados (sliders, chips)

**Día 15: Step 5 & Finalización**
- [ ] Step5Payment.tsx
- [ ] Mockup de tokenización
- [ ] Submit final a Supabase
- [ ] Redirección a Chat Home

### Fase 4: Business Portal (Semana 3)

**Día 16-17: Business Landing**
- [ ] BusinessLanding.tsx
- [ ] Hero section con imagen
- [ ] Secciones "Cómo funciona" y "Beneficios"
- [ ] Animaciones scroll
- [ ] Responsive design

**Día 18-20: Business Registration**
- [ ] BusinessRegister.tsx container
- [ ] Paso 1: Información básica
- [ ] Paso 2: Información legal
- [ ] DocumentUpload.tsx component
- [ ] Integración con Supabase Storage

**Día 21-22: Catálogo y Delivery**
- [ ] Paso 3: Catálogo de productos
- [ ] MenuUpload.tsx component
- [ ] Parser de archivos CSV/Excel
- [ ] Paso 4: Configuración de entrega

**Día 23: UCP Configuration**
- [ ] Paso 5: Generación de UCP profile
- [ ] UCPConfiguration.tsx
- [ ] Visualización del profile generado
- [ ] Paso 6: Revisión final

### Fase 5: Integración Backend (Semana 4)

**Día 24-25: Python ADK Setup**
- [ ] Setup del agente en business_agent/
- [ ] Configurar environment variables
- [ ] Crear tools para UCP:
  - get_business_catalog
  - create_checkout_session
  - update_checkout
  - complete_checkout
  - get_order_status
- [ ] Integración con Supabase desde Python

**Día 26-27: API Endpoints**
- [ ] Crear endpoints REST para negocios
- [ ] `/api/businesses/:id/ucp` (UCP profile)
- [ ] `/api/businesses/:id/catalog` (productos)
- [ ] `/api/businesses/:id/checkout` (checkout flow)
- [ ] Validación de requests (UCP schema)

**Día 28: Testing E2E**
- [ ] Testing del flow completo de usuario
- [ ] Testing del flow de registro de negocio
- [ ] Testing de integración chat → backend → Supabase
- [ ] Testing de UCP compliance

**Día 29-30: Polish & Documentation**
- [ ] Refinar animaciones
- [ ] Optimizar performance
- [ ] Documentar APIs
- [ ] Crear README para cada módulo
- [ ] Screenshots y videos demo

---

## 9. Consideraciones de Seguridad

### 9.1 Autenticación
- ✅ Usar Supabase Auth (maneja tokens, refresh, etc.)
- ✅ Nunca guardar contraseñas en plain text
- ✅ Implementar rate limiting en login
- ✅ Validar tokens en cada request

### 9.2 Pagos (PCI Compliance)
- ✅ **NUNCA** guardar datos completos de tarjetas
- ✅ Solo guardar tokens de payment providers
- ✅ Usar HTTPS en producción
- ✅ Validar CVV pero no guardarlo
- ✅ Implementar 3DS para transacciones de alto riesgo

### 9.3 Row Level Security (RLS) en Supabase

```sql
-- Users: solo pueden ver y editar su propio perfil
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- User profiles: ídem
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own user_profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Payment methods: privados del usuario
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- Conversations: privadas del usuario
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Messages: solo si la conversación pertenece al usuario
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Businesses: públicos (para lectura), privados para escritura
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active businesses"
  ON businesses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL
  USING (email = auth.jwt() ->> 'email');

-- Products: públicos si el business está activo
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products of active businesses"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = products.business_id
      AND businesses.is_active = true
    )
  );

-- Orders: privados para el usuario y el negocio
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Businesses can view their orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = orders.business_id
      AND businesses.email = auth.jwt() ->> 'email'
    )
  );
```

---

## 10. Variables de Entorno

### Frontend (`chat-client/.env.local`)

```bash
# Supabase
VITE_SUPABASE_URL=https://bstddwmpsbfrwqaudkai.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# App Config
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000

# Mercado Pago (mockup)
VITE_MP_PUBLIC_KEY=TEST-mockup-key
```

### Backend (`business_agent/.env`)

```bash
# Supabase
SUPABASE_URL=https://bstddwmpsbfrwqaudkai.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# Google ADK
GOOGLE_API_KEY=your_google_api_key
GOOGLE_PROJECT_ID=your_project_id

# UCP
UCP_VERSION=2026-01-11
UCP_BASE_URL=https://ucp.dev

# App Config
APP_ENV=development
API_PORT=8000
```

---

## 11. Testing Strategy

### 11.1 Unit Tests
```typescript
// Ejemplo: Step1Identity.test.tsx
describe('Step1Identity', () => {
  it('should validate required fields', () => {
    // Test validación
  });
  
  it('should enable next button when all fields are filled', () => {
    // Test estado del botón
  });
  
  it('should format phone number correctly', () => {
    // Test formato de teléfono
  });
});
```

### 11.2 Integration Tests
```typescript
// Ejemplo: Onboarding flow completo
describe('Onboarding Flow', () => {
  it('should complete all 5 steps and save to Supabase', async () => {
    // Simular completar todos los pasos
    // Verificar que se guarda en Supabase
    // Verificar redirección a Chat Home
  });
});
```

### 11.3 E2E Tests (Playwright)
```typescript
test('User can register and complete onboarding', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Registrarse');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button:has-text("Registrarse")');
  
  // Completar onboarding...
  
  await expect(page).toHaveURL('/chat');
});
```

---

## 12. Documentación Adicional

### 12.1 Iconografía

**Emojis para categorías de compras:**
- 🥦 Supermercado / Almacén
- 🧼 Limpieza
- 🐶 Mascotas
- 💊 Farmacia
- 🍷 Bebidas
- 👶 Bebés
- 🧻 Reposición básica

**Icons de Heroicons (ya instalado):**
- ChevronLeftIcon, ChevronRightIcon (navegación)
- CheckCircleIcon (completado)
- ExclamationCircleIcon (error)
- InformationCircleIcon (info)
- ShoppingCartIcon (carrito)
- UserIcon (usuario)
- BuildingStorefrontIcon (negocio)

### 12.2 Animaciones

**Framer Motion - ejemplos:**

```tsx
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <LandingPage />
</motion.div>

// Slide de onboarding
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '-100%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <Step2Shopping />
</motion.div>

// Chip selection
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className={selected ? 'chip-selected' : 'chip'}
>
  {label}
</motion.button>
```

### 12.3 Responsive Breakpoints

```css
/* Mobile first approach */
/* Base: 0-639px (mobile) */

@media (min-width: 640px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop */
}

@media (min-width: 1280px) {
  /* Large desktop */
}
```

---

## 13. Próximos Pasos Después de la Implementación

1. **Admin Dashboard** para gestión de comercios y usuarios
2. **Sistema de notificaciones** (email, push, in-app)
3. **Analytics** y métricas de uso
4. **Sistema de reseñas** y ratings
5. **Programa de fidelización** para usuarios
6. **API pública** para integraciones externas
7. **Mobile apps** (React Native o Flutter)
8. **Sistema de promociones** y descuentos
9. **Live tracking** de entregas
10. **Chat de soporte** integrado

---

## 14. Recursos y Referencias

### Documentación Oficial
- [Supabase Docs](https://supabase.com/docs)
- [UCP Specification](https://ucp.dev/specification/overview/)
- [Google ADK](https://google.github.io/adk-docs/)
- [A2A Protocol](https://github.com/google-a2a/A2A/)
- [React Router](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)

### Inspiración de UI
- [PedidosYa Socios](https://socios.pedidosya.com.ar/)
- [Uber Eats Restaurant](https://merchants.ubereats.com/)
- [Rappi Aliados](https://aliados.rappi.com/)

### Assets
- [Google Identity Branding](https://developers.google.com/identity/branding-guidelines)
- [Heroicons](https://heroicons.com/)
- [Unsplash](https://unsplash.com/) para imágenes de fondo

---

## 15. Checklist Final

### Pre-Launch
- [ ] Todas las pantallas implementadas
- [ ] Tests pasando (unit + integration)
- [ ] Performance optimizado (Lighthouse > 90)
- [ ] SEO básico configurado
- [ ] Analytics configurado
- [ ] Error tracking (Sentry)
- [ ] Backups de Supabase configurados
- [ ] SSL certificate en producción
- [ ] CORS configurado correctamente
- [ ] Rate limiting en APIs
- [ ] Logs centralizados
- [ ] Documentación completa

### Post-Launch
- [ ] Monitoreo de errores activo
- [ ] Métricas de uso siendo recolectadas
- [ ] Plan de escalabilidad definido
- [ ] Soporte al cliente configurado
- [ ] Plan de marketing listo
- [ ] Feedback loop establecido

---

## Conclusión

Este plan cubre la implementación completa del sistema de autenticación, onboarding y registro de comercios para JANDI, siguiendo las mejores prácticas de:

- ✅ **UX/UI**: Diseño moderno, animaciones fluidas, responsive
- ✅ **Seguridad**: RLS, tokenización, OAuth, HTTPS
- ✅ **Arquitectura**: Modular, escalable, mantenible
- ✅ **Compliance**: UCP, A2A, PCI-DSS (via tokenización)
- ✅ **Developer Experience**: TypeScript, tipos, documentación

El sistema está diseñado para crecer con JANDI y soportar futuras features sin necesidad de refactorización mayor.

---

**¿Listo para comenzar? 🚀**

Siguiente paso: Ejecutar el schema de Supabase y comenzar con la Fase 1.
