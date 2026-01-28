-- ============================================
-- Business Authentication and Dashboard Support
-- Fecha: 2026-01-27
-- Objetivo: Soporte para dashboard de negocios con autenticación
-- ============================================

BEGIN;

-- ============================================
-- 1. Tabla: business_owners (Opcional - para futuro multi-usuario)
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_owners'
      AND policyname = 'Users can view their own business ownerships'
  ) THEN
    CREATE POLICY "Users can view their own business ownerships"
      ON business_owners FOR SELECT
      TO authenticated
      USING (user_id::text = (auth.jwt() ->> 'sub')::text);
  END IF;
END
$$;

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

-- ============================================
-- 4. Índices adicionales para performance del dashboard
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_business_status 
  ON orders(business_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_business_created 
  ON orders(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_business_active 
  ON products(business_id, is_active);

-- ============================================
-- Verificación
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✓ BUSINESS DASHBOARD SETUP COMPLETADO';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✓ business_owners (para futuro multi-usuario)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✓ user_has_business_access()';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  ✓ business_with_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Índices creados:';
  RAISE NOTICE '  ✓ idx_orders_business_status';
  RAISE NOTICE '  ✓ idx_orders_business_created';
  RAISE NOTICE '  ✓ idx_products_business_active';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
END
$$;

COMMIT;
