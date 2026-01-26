-- ============================================
-- AUTO-CREAR USUARIO EN TABLA USERS
-- Trigger que se ejecuta automáticamente cuando un usuario
-- se registra via auth (email o Google OAuth)
-- ============================================

-- PASO 1: Crear función que maneja la creación del usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos de superusuario, bypasea RLS
SET search_path = public
AS $$
BEGIN
  -- Insertar usuario en la tabla users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    google_id,
    auth_provider,
    onboarding_completed,
    is_active,
    created_at,
    last_login_at,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    (
      SELECT (identity_data->>'sub')::text
      FROM auth.identities
      WHERE user_id = NEW.id
      AND provider = 'google'
      LIMIT 1
    ),
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM auth.identities
        WHERE user_id = NEW.id AND provider = 'google'
      ) THEN 'google'
      ELSE 'email'
    END,
    false, -- onboarding_completed
    true,  -- is_active
    NOW(),
    NOW(),
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login_at = NOW(),
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.users.full_name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      public.users.avatar_url
    );

  RETURN NEW;
END;
$$;

-- PASO 2: Crear trigger que llama a la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver que el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
✅ Ventajas de este approach:
1. NO DEPENDE DE RLS - El trigger ejecuta con SECURITY DEFINER (permisos de superusuario)
2. AUTOMÁTICO - No requiere código en el frontend/callback
3. CONFIABLE - Se ejecuta en el servidor de base de datos
4. RÁPIDO - No hay latencia de red

✅ Qué hace:
- Cuando un usuario se registra (INSERT en auth.users), crea automáticamente su perfil en users
- Cuando un usuario hace login (UPDATE en auth.users), actualiza last_login_at
- Maneja tanto email/password como Google OAuth
- Si el usuario ya existe (por alguna razón), hace UPDATE en lugar de INSERT (ON CONFLICT)

✅ Resultado:
- El callback de OAuth solo necesita verificar la sesión y redirigir
- NO necesita hacer queries a la tabla users
- NO tiene problemas de timing con RLS
*/
