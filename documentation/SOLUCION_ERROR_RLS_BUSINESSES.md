# Solución al Error de RLS en la Tabla Businesses

## Fecha
2026-01-27

## Problema Identificado

Al intentar registrar un negocio, se produce un error de políticas RLS (Row Level Security):

```
Error al crear negocio: new row violates row-level security policy for table "businesses"
```

### Detalles del Error
```javascript
Supabase error details: {
  message: "new row violates row-level security policy for table "businesses"",
  details: null,
  hint: null,
  code: "42501"
}
```

El código **42501** es el error estándar de PostgreSQL para "insufficient_privilege" - violación de políticas de seguridad a nivel de fila.

---

## Análisis de la Causa Raíz

### Política RLS Actual Problemática

En `sql_scripts/SUPABASE_SCHEMA.sql` (línea 506-508):

```sql
CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL
  USING (email = auth.jwt() ->> 'email');
```

### ¿Por Qué Falla?

Esta política tiene **dos problemas críticos**:

#### 1. **Problema con USING en INSERT**

La cláusula `USING` se evalúa **ANTES** de la inserción para verificar filas existentes. En un INSERT:
- No hay filas existentes para evaluar
- El campo `email` de la nueva fila aún no existe en la tabla
- Por lo tanto, `email = auth.jwt() ->> 'email'` siempre falla

#### 2. **Falta de WITH CHECK para INSERT**

Para operaciones **INSERT**, PostgreSQL requiere la cláusula `WITH CHECK`, que se evalúa **DESPUÉS** de que se intenta insertar la fila, pero **ANTES** de confirmar la transacción.

### Diagrama del Flujo de RLS

```
INSERT:
┌─────────────────────────────────────────────────┐
│ 1. Cliente intenta INSERT                      │
│    → email: "juan@example.com"                 │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ 2. PostgreSQL crea fila temporal               │
│    → Aún no está en la tabla                   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ 3. Evalúa WITH CHECK                           │
│    → ¿email coincide con JWT email?            │
│    → SI: Permite inserción ✅                   │
│    → NO: Rechaza con error 42501 ❌             │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│ 4. Si pasa WITH CHECK → COMMIT                 │
└─────────────────────────────────────────────────┘
```

---

## Solución Propuesta

### Estrategia

1. **Eliminar** la política actual genérica "Business owners can manage their business"
2. **Crear políticas separadas** para cada operación (INSERT, SELECT, UPDATE, DELETE)
3. **INSERT**: Usar `WITH CHECK` para validar que el email del JWT coincida con el email que se está insertando
4. **SELECT/UPDATE/DELETE**: Usar `USING` para verificar que el email coincida

### Políticas Correctas

```sql
-- INSERT: Permitir si el email que se inserta coincide con el email del JWT
CREATE POLICY "Authenticated users can create business with their email"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email')::text);

-- SELECT: Permitir leer negocios activos públicamente
CREATE POLICY "Anyone can view active businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SELECT: Permitir a los dueños ver su propio negocio (incluso si no está activo)
CREATE POLICY "Business owners can view their own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);

-- UPDATE: Solo el dueño puede actualizar su negocio
CREATE POLICY "Business owners can update their own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text)
  WITH CHECK (email = (auth.jwt() ->> 'email')::text);

-- DELETE: Solo el dueño puede eliminar su negocio
CREATE POLICY "Business owners can delete their own business"
  ON businesses FOR DELETE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);
```

---

## Diferencias Clave

### Antes (❌ INCORRECTO)

```sql
CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL
  USING (email = auth.jwt() ->> 'email');
  -- ❌ Usa USING para INSERT (no funciona)
  -- ❌ No tiene WITH CHECK separado
```

### Después (✅ CORRECTO)

```sql
-- Política específica para INSERT
CREATE POLICY "Authenticated users can create business with their email"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email')::text);
  -- ✅ Usa WITH CHECK para INSERT
  -- ✅ Valida que el email coincida ANTES del commit
```

---

## Validación del Email JWT

### ¿De Dónde Viene el Email?

Cuando un usuario se autentica con Supabase:

```javascript
// En el frontend
const { data, error } = await supabase.auth.signUp({
  email: 'juan@example.com',
  password: 'password123'
});
```

Supabase genera un JWT que incluye:

```json
{
  "sub": "uuid-del-usuario",
  "email": "juan@example.com",
  "role": "authenticated",
  ...
}
```

### Cómo lo Accede PostgreSQL

```sql
-- Obtener el email del JWT
auth.jwt() ->> 'email'
-- Retorna: "juan@example.com"

-- Cast a text para comparación
(auth.jwt() ->> 'email')::text
```

---

## Consideraciones de Seguridad

### ✅ Lo Que Permite Esta Política

1. **Cualquier usuario autenticado** puede crear un negocio
2. **SOLO** si el email del negocio coincide con su email de autenticación
3. **Ejemplo válido**:
   - Usuario autenticado: `juan@example.com`
   - Intenta crear negocio con: `email: "juan@example.com"` ✅ Permitido

### ❌ Lo Que Bloquea Esta Política

1. **Usuarios no autenticados** no pueden crear negocios
2. **Usuarios autenticados** NO pueden crear negocios para otros emails
3. **Ejemplo bloqueado**:
   - Usuario autenticado: `juan@example.com`
   - Intenta crear negocio con: `email: "otro@example.com"` ❌ Bloqueado

### Caso Especial: Registro Abierto

Si quieres que **cualquier usuario autenticado** pueda crear negocios sin validar el email:

```sql
-- Política más permisiva (NO RECOMENDADO para producción)
CREATE POLICY "Any authenticated user can create business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

⚠️ **ADVERTENCIA**: Esto permitiría que cualquier usuario cree negocios con cualquier email, lo cual es un riesgo de seguridad.

---

## Orden de Ejecución del Script SQL

El script `FIX_RLS_BUSINESSES.sql` debe ejecutarse en este orden:

```sql
1. DROP POLICY (si existe) → Elimina política problemática
2. CREATE POLICY para INSERT → Permite creación de negocios
3. CREATE POLICY para SELECT → Permite lectura
4. CREATE POLICY para UPDATE → Permite actualización
5. CREATE POLICY para DELETE → Permite eliminación
```

---

## Testing Después de Aplicar el Fix

### 1. Verificar que el Usuario Esté Autenticado

```sql
-- En Supabase SQL Editor
SELECT 
  auth.uid() as user_id,
  auth.jwt() ->> 'email' as user_email;
```

**Resultado esperado:**
```
user_id  | user_email
---------|-------------------
<uuid>   | juan@example.com
```

Si retorna `NULL`, el usuario **NO está autenticado** y debes hacer login primero.

### 2. Verificar las Políticas Activas

```sql
SELECT 
  policyname,
  cmd as operation,
  qual as using_check,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'businesses'
ORDER BY policyname;
```

**Resultado esperado:**
```
policyname                                        | operation | using_check                                  | with_check
--------------------------------------------------|-----------|----------------------------------------------|------------------
Anyone can view active businesses                 | SELECT    | (is_active = true)                           | NULL
Authenticated users can create business...        | INSERT    | NULL                                         | (email = ...)
Business owners can delete their own business     | DELETE    | (email = ...)                                | NULL
Business owners can update their own business     | UPDATE    | (email = ...)                                | (email = ...)
Business owners can view their own business       | SELECT    | (email = ...)                                | NULL
```

### 3. Probar INSERT Manualmente

```sql
-- En Supabase SQL Editor (como usuario autenticado)
INSERT INTO businesses (
  business_name,
  email,
  operating_regions,
  delivery_methods,
  payment_methods_supported,
  catalog_source_type,
  price_currency
) VALUES (
  'Test Business',
  auth.jwt() ->> 'email',  -- IMPORTANTE: Usa el email del JWT
  ARRAY['Buenos Aires'],
  '{"delivery": true, "pickup": false}'::jsonb,
  '{"cash": true, "card": false, "wallet": {"mercadoPago": false}}'::jsonb,
  'manual',
  'ARS'
) RETURNING *;
```

**Si funciona:** Verás la fila insertada ✅  
**Si falla:** Verás el error de RLS nuevamente ❌

### 4. Probar desde el Frontend

Después de aplicar el script SQL, intenta registrar un negocio desde la aplicación:

1. Asegúrate de estar **autenticado**
2. Completa el formulario de registro
3. Verifica que el email del negocio coincida con tu email de sesión
4. Presiona "Registrar"
5. Revisa la consola del navegador

**Logs esperados:**
```javascript
Creating business with data: {
  "business_name": "Pizzería Corleone",
  "email": "juan@example.com",  // ← Debe coincidir con tu email de sesión
  ...
}
```

---

## Troubleshooting

### Problema: Sigue Fallando Después del Fix

**Causas posibles:**

1. **Usuario no está autenticado**
   ```javascript
   // Verificar en el frontend
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Authenticated user:', user);
   ```

2. **Email no coincide**
   ```javascript
   // El email del formulario debe ser el mismo del usuario autenticado
   const userEmail = user?.email;
   const businessEmail = formData.email;
   if (userEmail !== businessEmail) {
     console.error('Emails do not match!', { userEmail, businessEmail });
   }
   ```

3. **Políticas no se aplicaron correctamente**
   ```sql
   -- Verificar en Supabase SQL Editor
   SELECT COUNT(*) as policy_count
   FROM pg_policies
   WHERE tablename = 'businesses';
   -- Debe retornar al menos 5 políticas
   ```

4. **RLS no está habilitado**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'businesses';
   -- rowsecurity debe ser 'true'
   ```

### Problema: "Error: email is not provided in JWT"

Esto significa que el JWT no contiene el email. Soluciones:

1. **Re-autenticar al usuario:**
   ```javascript
   await supabase.auth.signOut();
   await supabase.auth.signInWithPassword({
     email: 'juan@example.com',
     password: 'password'
   });
   ```

2. **Verificar configuración de Supabase:**
   - Dashboard → Authentication → Settings
   - Verificar que "Email confirmation" esté configurado correctamente

---

## Impacto en Otras Tablas

Este fix **NO afecta** otras tablas como:
- `users`
- `user_profiles`
- `products`
- `orders`

Cada tabla tiene sus propias políticas RLS independientes.

---

## Checklist Post-Implementación

- [ ] Ejecutar `FIX_RLS_BUSINESSES.sql` en Supabase SQL Editor
- [ ] Verificar que las 5 nuevas políticas estén activas
- [ ] Verificar que la política antigua fue eliminada
- [ ] Probar INSERT manual desde SQL Editor
- [ ] Probar registro de negocio desde el frontend
- [ ] Verificar logs en la consola del navegador
- [ ] Confirmar que el negocio se creó en la tabla `businesses`
- [ ] Verificar que `business_config` y `agent_card` se guardaron correctamente

---

## Archivos Relacionados

- Script SQL de fix: `sql_scripts/FIX_RLS_BUSINESSES.sql`
- Schema actual: `sql_scripts/SUPABASE_SCHEMA.sql` (línea 506-508)
- Servicio afectado: `chat-client/services/business.service.ts` (línea 94)
- Componente afectado: `chat-client/components/Business/BusinessRegister.tsx` (línea 68)

---

## Referencias

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) (42501 = insufficient_privilege)
