-- ============================================
-- TEST RÁPIDO: Verificar si RLS funciona
-- Ejecutar DESPUÉS de hacer login con Google
-- ============================================

-- 1. Ver tu ID de usuario actual
SELECT 'MI USER ID:' as info, auth.uid() as my_id;

-- Si esto devuelve NULL, no estás autenticado en el SQL Editor
-- Necesitás estar autenticado para que RLS funcione

-- 2. Intentar leer la tabla users (debería funcionar si RLS está bien)
SELECT 'PRUEBA LECTURA:' as info, COUNT(*) as total_users
FROM users;

-- Si esto falla con "permission denied" → RLS está mal

-- 3. Ver las políticas actuales
SELECT 'POLÍTICAS ACTUALES:' as info, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Deberías ver 3 políticas:
-- - Users can insert their own record (INSERT)
-- - Users can read their own record (SELECT)  
-- - Users can update their own record (UPDATE)

-- 4. Ver si RLS está habilitado
SELECT 'RLS HABILITADO:' as info, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- rowsecurity debe ser TRUE

-- ============================================
-- Si alguno de estos tests falla:
-- ============================================

-- ❌ Test 2 falla (permission denied):
--    → Ejecutar: SUPABASE_RLS_POLICIES.sql

-- ❌ Test 3 devuelve 0 filas (sin políticas):
--    → Ejecutar: SUPABASE_RLS_POLICIES.sql

-- ❌ Test 4 muestra rowsecurity = FALSE:
--    → Ejecutar: SUPABASE_RLS_POLICIES.sql

-- ============================================
-- SOLUCIÓN RÁPIDA: Ejecutar esto si todo falla
-- ============================================

-- Deshabilitar RLS temporalmente para testing (NO USAR EN PRODUCCIÓN)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Esto permite que el callback funcione sin RLS
-- Una vez que funcione, volvé a habilitar RLS y agregá las políticas correctas
