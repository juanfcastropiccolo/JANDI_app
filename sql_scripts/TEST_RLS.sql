-- ============================================
-- TEST DE DIAGNÓSTICO RLS - EJECUTAR ESTO
-- ============================================
-- IMPORTANTE: Ejecutá este script en el SQL Editor de Supabase
-- mientras estés autenticado (después de hacer login en tu app)
-- ============================================

-- TEST 1: Ver tu ID de usuario actual
SELECT '1️⃣ MI USER ID' as test, auth.uid() as user_id;
-- ✅ Debería devolver tu UUID
-- ❌ Si devuelve NULL → No estás autenticado en SQL Editor

-- TEST 2: Ver si RLS está habilitado
SELECT '2️⃣ RLS HABILITADO' as test, 
       tablename, 
       rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
-- ✅ rls_enabled debe ser TRUE
-- ❌ Si es FALSE → Ejecutar: ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- TEST 3: Ver las políticas RLS actuales
SELECT '3️⃣ POLÍTICAS' as test,
       policyname,
       cmd as comando,
       qual as usando_condicion,
       with_check as con_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';
-- ✅ Deberías ver 3 políticas:
--    - Users can insert their own record (INSERT)
--    - Users can read their own record (SELECT)
--    - Users can update their own record (UPDATE)
-- ❌ Si ves 0 filas → Ejecutar SUPABASE_RLS_POLICIES.sql

-- TEST 4: Intentar leer TU usuario
SELECT '4️⃣ LECTURA' as test, 
       id, 
       email, 
       onboarding_completed
FROM users
WHERE id = auth.uid();
-- ✅ Debería devolver TU fila
-- ❌ Si falla con "permission denied" → Problema de RLS, ejecutar SUPABASE_RLS_POLICIES.sql
-- ❌ Si devuelve 0 filas → Tu usuario no existe en la tabla users

-- TEST 5: Ver TODOS los usuarios (para admin/testing)
SELECT '5️⃣ TODOS LOS USUARIOS' as test,
       COUNT(*) as total_usuarios
FROM users;
-- ℹ️ Esto puede fallar si RLS está bien configurado (es normal)
-- Solo deberías ver tu propio usuario, no todos

-- ============================================
-- DIAGNÓSTICO DE PROBLEMAS
-- ============================================

-- ❌ PROBLEMA: Test 1 devuelve NULL
--    SOLUCIÓN: No estás autenticado. Primero hacé login en tu app,
--              luego volvé al SQL Editor y ejecutá este script.

-- ❌ PROBLEMA: Test 2 muestra rls_enabled = FALSE
--    SOLUCIÓN: Ejecutar:
--              ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ❌ PROBLEMA: Test 3 devuelve 0 filas (no hay políticas)
--    SOLUCIÓN: Ejecutar todo el archivo: SUPABASE_RLS_POLICIES.sql

-- ❌ PROBLEMA: Test 4 falla con "permission denied"
--    SOLUCIÓN: Las políticas no están bien. Ejecutar:
--              SUPABASE_RLS_POLICIES.sql

-- ❌ PROBLEMA: Test 4 devuelve 0 filas
--    SOLUCIÓN: Tu usuario no existe en la tabla users.
--              Verificá que el callback de OAuth esté insertando correctamente.
--              Podés insertarlo manualmente:
--              INSERT INTO users (id, email, auth_provider, onboarding_completed)
--              VALUES (auth.uid(), 'tu@email.com', 'google', false);

-- ============================================
-- SOLUCIÓN TEMPORAL (SOLO PARA TESTING)
-- ============================================
-- Si necesitás deshabilitar RLS temporalmente:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- 
-- ADVERTENCIA: Esto permite que cualquiera lea/escriba usuarios.
-- NO USAR EN PRODUCCIÓN. Solo para diagnosticar problemas.
