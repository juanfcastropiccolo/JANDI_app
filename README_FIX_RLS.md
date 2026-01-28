# 🔧 Fix de Error RLS en Registro de Negocios

## 📋 Resumen Rápido

**Error:** `new row violates row-level security policy for table "businesses"`  
**Causa:** Política RLS mal configurada (usa `USING` en vez de `WITH CHECK` para INSERT)  
**Solución:** Script SQL que corrige las políticas RLS

---

## 📁 Archivos Creados

### 1. 📄 `SOLUCION_ERROR_RLS_BUSINESSES.md`
**Descripción completa del problema y la solución**

- Análisis detallado de la causa raíz
- Explicación de cómo funcionan las políticas RLS
- Diagramas de flujo
- Guía de troubleshooting
- Testing post-implementación

**📍 Ubicación:** `/SOLUCION_ERROR_RLS_BUSINESSES.md`

### 2. 🗄️ `sql_scripts/FIX_RLS_BUSINESSES.sql`
**Script SQL para corregir las políticas**

- Elimina la política problemática
- Crea 5 políticas nuevas correctas (INSERT, SELECT x2, UPDATE, DELETE)
- Incluye verificaciones y tests
- Es idempotente (se puede ejecutar múltiples veces)

**📍 Ubicación:** `/sql_scripts/FIX_RLS_BUSINESSES.sql`

---

## 🚀 Cómo Ejecutar la Solución

### Paso 1: Leer la Documentación (Opcional pero Recomendado)
```bash
# Abrir el archivo de solución para entender el problema
open SOLUCION_ERROR_RLS_BUSINESSES.md
```

### Paso 2: Ejecutar el Script SQL

1. **Ir a Supabase Dashboard**
   - Abre tu proyecto en https://supabase.com
   - Ve a: **SQL Editor**

2. **Copiar y Pegar el Script**
   - Abre: `sql_scripts/FIX_RLS_BUSINESSES.sql`
   - Copia TODO el contenido
   - Pega en el SQL Editor de Supabase

3. **Ejecutar**
   - Presiona **Run** o `Ctrl/Cmd + Enter`
   - Deberías ver mensajes de éxito con ✓

4. **Verificar Resultado**
   ```sql
   -- Copiar y ejecutar este query para verificar
   SELECT 
     policyname,
     cmd as operation
   FROM pg_policies
   WHERE tablename = 'businesses'
   ORDER BY policyname;
   ```

   **Resultado esperado (5 políticas):**
   ```
   policyname                                        | operation
   --------------------------------------------------|----------
   Anyone can view active businesses                 | SELECT
   Authenticated users can create business...        | INSERT
   Business owners can delete their own business     | DELETE
   Business owners can update their own business     | UPDATE
   Business owners can view their own business       | SELECT
   ```

### Paso 3: Probar el Registro de Negocio

1. **En tu aplicación web:**
   - Asegúrate de estar autenticado
   - Intenta registrar un negocio nuevamente
   - El error debería desaparecer ✅

2. **Verificar en consola del navegador:**
   ```
   Creating business with data: { ... }
   ✓ Negocio creado exitosamente
   ```

---

## ✅ Checklist de Verificación

- [ ] Script SQL ejecutado sin errores
- [ ] Se muestran 5 políticas activas en la tabla `businesses`
- [ ] Puedo registrar un negocio desde la aplicación
- [ ] El negocio aparece en la tabla `businesses` de Supabase
- [ ] No hay errores 42501 en la consola

---

## 🔍 ¿Qué Hace el Script?

### Antes (❌ Problema)
```sql
-- UNA política genérica que no funciona para INSERT
CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL
  USING (email = auth.jwt() ->> 'email');  ← USING no funciona para INSERT
```

### Después (✅ Solución)
```sql
-- CINCO políticas específicas, cada una para una operación

1. INSERT   → WITH CHECK (valida DESPUÉS de insertar)
2. SELECT   → USING (para negocios activos públicos)
3. SELECT   → USING (para el dueño ver su negocio)
4. UPDATE   → USING + WITH CHECK (solo el dueño)
5. DELETE   → USING (solo el dueño)
```

---

## 🛠️ Troubleshooting

### Sigue Fallando Después del Fix

#### 1. Verificar Autenticación
```javascript
// En la consola del navegador
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuario autenticado:', user?.email);
```

Si `user` es `null`, necesitas autenticarte primero.

#### 2. Verificar Email Coincidente
```javascript
// El email del negocio DEBE ser el mismo del usuario
console.log('Email usuario:', user?.email);
console.log('Email negocio:', formData.email);
// ← Estos DEBEN coincidir
```

#### 3. Verificar Políticas en Supabase
```sql
-- En Supabase SQL Editor
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'businesses';
-- Debe retornar: 5 (o más)
```

#### 4. Verificar RLS Habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'businesses';
-- rowsecurity debe ser: true
```

---

## 📊 Políticas Detalladas

### Política 1: INSERT - Crear Negocio
```sql
CREATE POLICY "Authenticated users can create business with their email"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email')::text);
```
**Permite:** Crear negocio si el email coincide con tu email de sesión  
**Bloquea:** Crear negocio con email de otra persona

### Política 2: SELECT - Ver Negocios Activos
```sql
CREATE POLICY "Anyone can view active businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (is_active = true);
```
**Permite:** Ver todos los negocios con `is_active = true`  
**Bloquea:** Ver negocios inactivos (a menos que seas el dueño)

### Política 3: SELECT - Ver Mi Negocio
```sql
CREATE POLICY "Business owners can view their own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);
```
**Permite:** Ver tu propio negocio (incluso si está inactivo)  
**Bloquea:** Ver negocios de otras personas si no están activos

### Política 4: UPDATE - Actualizar Mi Negocio
```sql
CREATE POLICY "Business owners can update their own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text)
  WITH CHECK (email = (auth.jwt() ->> 'email')::text);
```
**Permite:** Actualizar solo tu negocio  
**Bloquea:** Actualizar negocios de otras personas

### Política 5: DELETE - Eliminar Mi Negocio
```sql
CREATE POLICY "Business owners can delete their own business"
  ON businesses FOR DELETE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);
```
**Permite:** Eliminar solo tu negocio  
**Bloquea:** Eliminar negocios de otras personas

---

## 🎯 Orden de Ejecución Completo

```
1. Error 400 (mapeo de campos) ← YA CORREGIDO ✅
   └── Fix: CAMBIOS_APLICADOS_ERROR_400.md

2. Error RLS 42501 (políticas) ← CORREGIR AHORA 🔴
   └── Fix: sql_scripts/FIX_RLS_BUSINESSES.sql

3. Probar registro de negocio ← DESPUÉS DEL FIX ✅
```

---

## 📞 Soporte

Si después de ejecutar el script sigues teniendo problemas:

1. Lee `SOLUCION_ERROR_RLS_BUSINESSES.md` (sección Troubleshooting)
2. Ejecuta los queries de verificación del script
3. Revisa los logs de la consola del navegador
4. Verifica que estés autenticado correctamente

---

## 📚 Documentación Relacionada

- `SOLUCION_ERROR_400_REGISTRO_NEGOCIO.md` - Fix anterior (mapeo de campos)
- `CAMBIOS_APLICADOS_ERROR_400.md` - Cambios aplicados del fix anterior
- `sql_scripts/SUPABASE_SCHEMA.sql` - Schema completo de la BD
- `sql_scripts/SUPABASE_RLS_POLICIES.sql` - Políticas RLS originales

---

**Creado:** 2026-01-27  
**Problema:** Error 42501 - Row Level Security  
**Solución:** Fix de políticas RLS para tabla `businesses`
