-- ============================================
-- SCRIPT DE VERIFICACIÓN COMPLETA
-- Ejecutar en Supabase SQL Editor para diagnosticar todos los problemas
-- ============================================

-- 1. Verificar que las tablas existan
SELECT '1. TABLAS EXISTENTES' as check_name, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'user_profiles', 'conversations', 'messages', 'payment_methods', 'businesses')
ORDER BY tablename;

-- Resultado esperado: 6 tablas con rls_enabled = true

-- 2. Verificar estructura de la tabla users
SELECT '2. ESTRUCTURA TABLA USERS' as check_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Resultado esperado: id, email, full_name, phone, avatar_url, google_id, auth_provider, 
-- is_active, onboarding_completed, created_at, updated_at, last_login_at, metadata

-- 3. Verificar políticas RLS en tabla users
SELECT '3. POLÍTICAS RLS TABLA USERS' as check_name, policyname, cmd as command, permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Resultado esperado: 3 políticas (INSERT, SELECT, UPDATE)

-- 4. Verificar tu sesión actual (solo funciona si estás autenticado)
SELECT '4. SESIÓN ACTUAL' as check_name, 
       auth.uid() as current_user_id,
       auth.jwt() ->> 'email' as current_email;

-- Si devuelve NULL, no estás autenticado en el SQL Editor

-- 5. Intentar leer la tabla users (TEST)
SELECT '5. TEST LECTURA TABLA USERS' as check_name, COUNT(*) as total_users
FROM users;

-- Si falla con "permission denied", RLS está mal configurado

-- 6. Ver todos los usuarios (solo si RLS permite)
SELECT '6. USUARIOS EN LA DB' as check_name, id, email, full_name, auth_provider, onboarding_completed
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- DIAGNÓSTICO RÁPIDO
-- ============================================

-- Si alguno de estos checks falla:

-- ❌ Check 1 falla (tablas no existen):
--    → Ejecutar SUPABASE_SCHEMA.sql

-- ❌ Check 2 falla (columnas faltantes):
--    → Ejecutar SUPABASE_SCHEMA.sql de nuevo

-- ❌ Check 3 falla (sin políticas):
--    → Ejecutar SUPABASE_RLS_POLICIES.sql

-- ❌ Check 5 falla (permission denied):
--    → RLS está bloqueando. Ejecutar SUPABASE_RLS_POLICIES.sql

-- ✅ Si todos pasan:
--    → El problema está en el código del frontend
