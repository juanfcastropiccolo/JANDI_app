-- ============================================================
-- MIGRATION: Fix Google Login
-- ============================================================
-- ESTADO: El backfill (INSERT) ya corrió y hay 2 filas en public.users.
-- Pendiente: solo el fix del trigger.
--
-- ⚠️  El ALTER TABLE auth.users requiere rol "supabase_admin".
-- No puede ejecutarse desde el SQL Editor con el rol "postgres".
--
-- OPCIONES PARA FIJAR EL TRIGGER:
--
-- OPCIÓN A — Supabase Dashboard (recomendado):
--   1. Ir a Database → Triggers
--   2. Buscar "on_auth_user_created" (tabla auth.users)
--   3. Hacer click en Edit
--   4. Cambiar "Fires" de "ORIGIN" a "ALWAYS"
--   5. Guardar
--
-- OPCIÓN B — SQL con SET ROLE (puede funcionar en algunos proyectos):
-- ============================================================

SET ROLE supabase_admin;
ALTER TABLE auth.users ENABLE ALWAYS TRIGGER on_auth_user_created;
RESET ROLE;

-- ============================================================
-- Verificaciones:
-- ============================================================
-- SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- → Debe retornar 'A' (ALWAYS). Actualmente retorna 'O' (ORIGIN).
--
-- SELECT COUNT(*) FROM public.users;
-- → Ya retorna 2 (backfill ejecutado).
-- ============================================================
