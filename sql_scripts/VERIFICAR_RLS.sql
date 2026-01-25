-- ============================================
-- SCRIPT DE VERIFICACIÓN: Políticas RLS
-- Ejecutar en Supabase SQL Editor para verificar que las políticas estén activas
-- ============================================

-- 1. Verificar que RLS esté habilitado en las tablas críticas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_profiles', 'conversations', 'messages', 'payment_methods', 'businesses')
ORDER BY tablename;

-- Resultado esperado: Todas deben tener rls_enabled = true

-- 2. Ver todas las políticas activas en la tabla 'users'
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Resultado esperado: Deberías ver 3 políticas:
-- - "Users can insert their own record" (INSERT)
-- - "Users can read their own record" (SELECT)
-- - "Users can update their own record" (UPDATE)

-- 3. Ver todas las políticas en otras tablas importantes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'conversations', 'messages', 'payment_methods')
ORDER BY tablename, policyname;

-- 4. PRUEBA RÁPIDA: ¿Puedo leer/insertar en la tabla users?
-- Ejecutar esto DESPUÉS de hacer login (cuando tengas un auth.uid() válido)
-- Si falla, las políticas RLS están mal configuradas

-- Verificar tu ID de usuario actual
SELECT auth.uid() as my_user_id;

-- Intentar leer tu propio usuario (debería funcionar)
SELECT * FROM users WHERE id = auth.uid();

-- Si el SELECT anterior devuelve "permission denied" o no devuelve nada,
-- las políticas RLS NO están funcionando correctamente.
