-- ============================================
-- JANDI Database Schema - Supabase (PostgreSQL)
-- Version: 1.0
-- Date: 2026-01-25
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
-- Gestión de usuarios y autenticación
-- ============================================
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

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: user_profiles
-- Perfiles de usuario con datos del onboarding
-- ============================================
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

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: payment_methods
-- Métodos de pago tokenizados (PCI compliant)
-- ============================================
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

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: conversations
-- Conversaciones del chat con contexto A2A
-- ============================================
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

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: messages
-- Mensajes individuales en conversaciones
-- ============================================
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

-- ============================================
-- TABLA: businesses
-- Comercios registrados en la plataforma
-- ============================================
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

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: business_documents
-- Documentación legal de comercios
-- ============================================
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

-- ============================================
-- TABLA: products
-- Catálogo de productos (UCP compliant)
-- ============================================
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

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: orders
-- Órdenes de compra (UCP compliant)
-- ============================================
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

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: order_events
-- Eventos de órdenes para tracking
-- ============================================
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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

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

CREATE POLICY "Users can insert own user_profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
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

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
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

CREATE POLICY "Business owners can manage their products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = products.business_id
      AND businesses.email = auth.jwt() ->> 'email'
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

-- Order events: acceso a través de orders
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events of own orders"
  ON order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_events.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Business documents: solo el dueño del negocio
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their documents"
  ON business_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_documents.business_id
      AND businesses.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para generar order_number único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    done := NOT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number);
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar un usuario de prueba (comentado por defecto)
-- INSERT INTO users (email, full_name, onboarding_completed) 
-- VALUES ('test@jandi.com', 'Usuario de Prueba', false);

COMMENT ON TABLE users IS 'Usuarios registrados en JANDI';
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con datos del onboarding';
COMMENT ON TABLE payment_methods IS 'Métodos de pago tokenizados (PCI compliant)';
COMMENT ON TABLE conversations IS 'Conversaciones del chat con contexto A2A';
COMMENT ON TABLE messages IS 'Mensajes individuales en conversaciones';
COMMENT ON TABLE businesses IS 'Comercios registrados en la plataforma';
COMMENT ON TABLE business_documents IS 'Documentación legal de comercios';
COMMENT ON TABLE products IS 'Catálogo de productos (UCP compliant)';
COMMENT ON TABLE orders IS 'Órdenes de compra (UCP compliant)';
COMMENT ON TABLE order_events IS 'Eventos de órdenes para tracking';
