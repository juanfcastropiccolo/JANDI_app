# Instrucciones para Aplicar la Migración

## Archivo de Migración
`2026_01_27_business_agent_config.sql`

## Opciones para Aplicar

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto JANDI
3. Ir a **SQL Editor**
4. Crear una nueva query
5. Copiar y pegar el contenido completo de `2026_01_27_business_agent_config.sql`
6. Ejecutar (Run)
7. Verificar que no hay errores

### Opción 2: Supabase CLI

```bash
# Desde la raíz del proyecto
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app

# Aplicar la migración
supabase db push --file sql_scripts/2026_01_27_business_agent_config.sql
```

### Opción 3: psql (Directo a Postgres)

```bash
# Obtener connection string desde Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f sql_scripts/2026_01_27_business_agent_config.sql
```

## Verificación Post-Migración

Ejecutar este SQL para verificar que las columnas se crearon:

```sql
-- Verificar nuevas columnas en businesses
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'businesses'
  and column_name in (
    'operating_regions',
    'delivery_methods',
    'delivery_zones',
    'estimated_delivery_time_min',
    'estimated_delivery_time_max',
    'pickup_preparation_time_minutes',
    'payment_methods_supported',
    'payment_timing',
    'return_policy',
    'refund_policy',
    'cancellation_window_minutes',
    'business_contact_email',
    'business_contact_phone',
    'responsible_person_name',
    'catalog_source_type',
    'price_currency',
    'agent_card',
    'business_config'
  )
order by column_name;

-- Verificar que la tabla business_catalog_imports existe
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name = 'business_catalog_imports';

-- Verificar constraints
select constraint_name, constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'businesses'
  and constraint_name like 'businesses_%_check';

-- Verificar índices
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'businesses'
  and indexname like 'businesses_%_gin';

-- Verificar RLS policies
select policyname, tablename
from pg_policies
where schemaname = 'public'
  and tablename = 'business_catalog_imports';
```

## Rollback (si es necesario)

Si necesitas revertir la migración:

```sql
begin;

-- Eliminar tabla
drop table if exists public.business_catalog_imports cascade;

-- Eliminar columnas de businesses
alter table public.businesses
  drop column if exists operating_regions,
  drop column if exists delivery_methods,
  drop column if exists delivery_zones,
  drop column if exists estimated_delivery_time_min,
  drop column if exists estimated_delivery_time_max,
  drop column if exists pickup_preparation_time_minutes,
  drop column if exists payment_methods_supported,
  drop column if exists payment_timing,
  drop column if exists return_policy,
  drop column if exists refund_policy,
  drop column if exists cancellation_window_minutes,
  drop column if exists business_contact_email,
  drop column if exists business_contact_phone,
  drop column if exists responsible_person_name,
  drop column if exists catalog_source_type,
  drop column if exists price_currency,
  drop column if exists agent_card,
  drop column if exists business_config;

commit;
```

## Notas Importantes

- ✅ La migración es **aditiva**: no elimina ni modifica columnas existentes
- ✅ Usa `if not exists` para ser **idempotente** (se puede ejecutar múltiples veces)
- ✅ Mantiene **compatibilidad** con el código actual
- ✅ Las RLS policies siguen el mismo patrón de ownership por email
- ⚠️ Después de aplicar, regenerar los tipos TypeScript de Supabase si usas generación automática
