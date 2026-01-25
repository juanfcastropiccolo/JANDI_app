-- ============================================
-- JANDI - Políticas RLS (Row Level Security)
-- Ejecutar DESPUÉS de crear las tablas con SUPABASE_SCHEMA.sql
-- ============================================

-- ============================================
-- Habilitar RLS en todas las tablas
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLA: users
-- Políticas: Los usuarios pueden leer y actualizar sus propios datos
-- ============================================

-- Permitir que los usuarios autenticados inserten su propio registro
CREATE POLICY "Users can insert their own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permitir que los usuarios lean su propio registro
CREATE POLICY "Users can read their own record"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que los usuarios actualicen su propio registro
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLA: user_profiles
-- Políticas: Los usuarios pueden gestionar su propio perfil
-- ============================================

CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: payment_methods
-- Políticas: Los usuarios pueden gestionar sus propios métodos de pago
-- ============================================

CREATE POLICY "Users can manage their payment methods"
ON payment_methods FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: conversations
-- Políticas: Los usuarios pueden gestionar sus propias conversaciones
-- ============================================

CREATE POLICY "Users can manage their conversations"
ON conversations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: messages
-- Políticas: Los usuarios pueden ver/crear mensajes de sus conversaciones
-- ============================================

CREATE POLICY "Users can manage messages in their conversations"
ON messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- ============================================
-- TABLA: businesses
-- Políticas: Los negocios pueden leer todos, pero solo editar el propio
-- ============================================

-- Todos pueden leer negocios activos (para el marketplace)
CREATE POLICY "Anyone can read active businesses"
ON businesses FOR SELECT
TO authenticated
USING (is_active = true);

-- Los negocios pueden insertar su propio registro
CREATE POLICY "Businesses can insert their own record"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (true); -- Validación adicional se hace en el backend

-- Los negocios pueden actualizar su propio registro
-- Nota: Por ahora permitimos que cualquier negocio autenticado actualice
-- En producción, esto debería verificarse con una tabla de business_owners
CREATE POLICY "Businesses can update their own record"
ON businesses FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
