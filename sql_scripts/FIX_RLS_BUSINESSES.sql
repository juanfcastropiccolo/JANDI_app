-- ============================================
-- FIX: Row Level Security (RLS) para Tabla Businesses
-- Fecha: 2026-01-27
-- Problema: La política actual bloquea INSERT porque usa USING en vez de WITH CHECK
-- Solución: Eliminar política genérica y crear políticas específicas por operación
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: Eliminar política problemática
-- ============================================

-- Verificar si existe la política problemática y eliminarla
DO $$
BEGIN
    -- Eliminar la política genérica "Business owners can manage their business"
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Business owners can manage their business'
    ) THEN
        DROP POLICY "Business owners can manage their business" ON businesses;
        RAISE NOTICE '✓ Política problemática eliminada: "Business owners can manage their business"';
    ELSE
        RAISE NOTICE '⚠ Política "Business owners can manage their business" no existe (ya fue eliminada o nunca existió)';
    END IF;
END
$$;

-- ============================================
-- PASO 2: Crear políticas correctas separadas por operación
-- ============================================

-- --------------------------------------------------------
-- POLÍTICA 1: INSERT - Permitir crear negocio si el email coincide con el JWT
-- --------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Authenticated users can create business with their email'
    ) THEN
        CREATE POLICY "Authenticated users can create business with their email"
          ON businesses FOR INSERT
          TO authenticated
          WITH CHECK (email = (auth.jwt() ->> 'email')::text);
        
        RAISE NOTICE '✓ Política creada: INSERT - "Authenticated users can create business with their email"';
    ELSE
        RAISE NOTICE '⚠ Política INSERT ya existe';
    END IF;
END
$$;

-- --------------------------------------------------------
-- POLÍTICA 2: SELECT - Permitir ver negocios activos (público)
-- --------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Anyone can view active businesses'
    ) THEN
        CREATE POLICY "Anyone can view active businesses"
          ON businesses FOR SELECT
          TO authenticated
          USING (is_active = true);
        
        RAISE NOTICE '✓ Política creada: SELECT - "Anyone can view active businesses"';
    ELSE
        RAISE NOTICE '⚠ Política SELECT (active businesses) ya existe';
    END IF;
END
$$;

-- --------------------------------------------------------
-- POLÍTICA 3: SELECT - Permitir a los dueños ver su propio negocio
-- --------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Business owners can view their own business'
    ) THEN
        CREATE POLICY "Business owners can view their own business"
          ON businesses FOR SELECT
          TO authenticated
          USING (email = (auth.jwt() ->> 'email')::text);
        
        RAISE NOTICE '✓ Política creada: SELECT - "Business owners can view their own business"';
    ELSE
        RAISE NOTICE '⚠ Política SELECT (own business) ya existe';
    END IF;
END
$$;

-- --------------------------------------------------------
-- POLÍTICA 4: UPDATE - Solo el dueño puede actualizar su negocio
-- --------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Business owners can update their own business'
    ) THEN
        CREATE POLICY "Business owners can update their own business"
          ON businesses FOR UPDATE
          TO authenticated
          USING (email = (auth.jwt() ->> 'email')::text)
          WITH CHECK (email = (auth.jwt() ->> 'email')::text);
        
        RAISE NOTICE '✓ Política creada: UPDATE - "Business owners can update their own business"';
    ELSE
        RAISE NOTICE '⚠ Política UPDATE ya existe';
    END IF;
END
$$;

-- --------------------------------------------------------
-- POLÍTICA 5: DELETE - Solo el dueño puede eliminar su negocio
-- --------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND policyname = 'Business owners can delete their own business'
    ) THEN
        CREATE POLICY "Business owners can delete their own business"
          ON businesses FOR DELETE
          TO authenticated
          USING (email = (auth.jwt() ->> 'email')::text);
        
        RAISE NOTICE '✓ Política creada: DELETE - "Business owners can delete their own business"';
    ELSE
        RAISE NOTICE '⚠ Política DELETE ya existe';
    END IF;
END
$$;

-- ============================================
-- PASO 3: Verificación de políticas activas
-- ============================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'businesses';
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════';
    RAISE NOTICE '✓ FIX COMPLETADO';
    RAISE NOTICE '════════════════════════════════════════════════════';
    RAISE NOTICE 'Total de políticas activas en "businesses": %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Políticas esperadas:';
    RAISE NOTICE '  1. Authenticated users can create business with their email (INSERT)';
    RAISE NOTICE '  2. Anyone can view active businesses (SELECT)';
    RAISE NOTICE '  3. Business owners can view their own business (SELECT)';
    RAISE NOTICE '  4. Business owners can update their own business (UPDATE)';
    RAISE NOTICE '  5. Business owners can delete their own business (DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE 'Ejecuta el siguiente query para verificar las políticas:';
    RAISE NOTICE '';
    RAISE NOTICE 'SELECT policyname, cmd, qual, with_check';
    RAISE NOTICE 'FROM pg_policies';
    RAISE NOTICE 'WHERE tablename = ''businesses''';
    RAISE NOTICE 'ORDER BY policyname;';
    RAISE NOTICE '════════════════════════════════════════════════════';
END
$$;

COMMIT;

-- ============================================
-- QUERY DE VERIFICACIÓN (ejecutar después del COMMIT)
-- ============================================

-- Descomentar y ejecutar para ver las políticas aplicadas:
/*
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'N/A'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'N/A'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'businesses'
ORDER BY 
  CASE cmd
    WHEN 'INSERT' THEN 1
    WHEN 'SELECT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  policyname;
*/

-- ============================================
-- TEST DE INSERT (ejecutar después del COMMIT)
-- ============================================

-- Descomentar y ejecutar para probar la política de INSERT:
/*
-- Debe reemplazar 'tu-email@example.com' con el email de tu sesión autenticada
INSERT INTO businesses (
  business_name,
  email,
  operating_regions,
  delivery_methods,
  delivery_zones,
  payment_methods_supported,
  catalog_source_type,
  price_currency,
  agent_card,
  business_config
) VALUES (
  'Test Business RLS',
  auth.jwt() ->> 'email',  -- IMPORTANTE: Usa el email del JWT
  ARRAY['Buenos Aires'],
  '{"delivery": true, "pickup": false}'::jsonb,
  ARRAY['Capital Federal'],
  '{"cash": true, "card": false, "wallet": {"mercadoPago": false}}'::jsonb,
  'manual',
  'ARS',
  '{}'::jsonb,
  '{}'::jsonb
) RETURNING id, business_name, email, created_at;
*/

-- ============================================
-- CLEANUP TEST (ejecutar para limpiar el test)
-- ============================================

-- Descomentar para eliminar el negocio de prueba:
/*
DELETE FROM businesses 
WHERE business_name = 'Test Business RLS'
  AND email = auth.jwt() ->> 'email';
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Este script es IDEMPOTENTE: puede ejecutarse múltiples veces sin problemas
-- 2. Usa bloques DO $$ para verificar existencia antes de crear/eliminar
-- 3. Las políticas se aplican SOLO a usuarios autenticados (TO authenticated)
-- 4. La política de INSERT valida que el email coincida con el JWT
-- 5. Las políticas de SELECT permiten ver negocios activos públicamente
-- 6. Las políticas de UPDATE/DELETE solo permiten al dueño modificar su negocio

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Si el INSERT sigue fallando, verificar:

-- 1. ¿Estoy autenticado?
-- SELECT auth.uid(), auth.jwt() ->> 'email';

-- 2. ¿RLS está habilitado en la tabla?
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'businesses';

-- 3. ¿Las políticas están activas?
-- SELECT * FROM pg_policies WHERE tablename = 'businesses';

-- 4. ¿El email del JWT coincide con el email que intento insertar?
-- Verificar en el frontend que formData.email === user.email
