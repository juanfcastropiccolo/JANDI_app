# Solución al Error 400 en el Registro de Negocio

## Fecha
2026-01-27

## Problema Identificado

Al intentar registrar un negocio, se produce un error 400 (Bad Request) al crear el registro en Supabase. El error ocurre en la línea 69 de `BusinessRegister.tsx` cuando se llama a `businessService.createBusiness()`.

### Captura del Error
```
Error al registrar el negocio. Por favor intenta nuevamente.
Error creating business: Object
Failed to load resource: the server responded with a status of 400 ()
```

## Análisis de la Causa Raíz

### 1. **Desajuste en los Nombres de Campos (Camel Case vs Snake Case)**

El problema principal está en `business.service.ts` línea 94-104:

**Código actual:**
```typescript
async createBusiness(businessData: Partial<Business>): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      ...businessData,
      is_active: false,
      is_verified: false,
      onboarding_completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  // ...
}
```

**El problema:** Se está haciendo un spread directo de `businessData`, pero los campos que vienen del formulario tienen nombres en **camelCase** (ej: `businessName`, `businessType`), mientras que la base de datos espera nombres en **snake_case** (ej: `business_name`, `business_type`).

#### Ejemplo del Desajuste:

| Campo del Formulario (camelCase) | Campo de la BD (snake_case) | ¿Coinciden? |
|----------------------------------|----------------------------|-------------|
| `businessName` | `business_name` | ❌ NO |
| `businessType` | `business_type` | ❌ NO |
| `legalName` | `legal_name` | ❌ NO |
| `email` | `email` | ✅ SÍ |
| `phone` | `phone` | ✅ SÍ |
| `address` | `address` | ✅ SÍ |

### 2. **Datos Combinados Incorrectamente**

En `BusinessRegister.tsx` línea 69-73:

```typescript
const business = await businessService.createBusiness({
  ...businessData.basicInfo,
  ...businessData.legalInfo,
  ...businessData.delivery,
});
```

Se están combinando tres objetos (`basicInfo`, `legalInfo`, `delivery`) que tienen estructuras diferentes y nombres de campos que no mapean directamente a la base de datos.

### 3. **Campos Requeridos con DEFAULT NOT NULL**

La migración `2026_01_27_business_agent_config.sql` agregó nuevos campos con `NOT NULL DEFAULT`:

```sql
add column if not exists operating_regions text[] not null default '{}'::text[],
add column if not exists delivery_methods jsonb not null default '{"delivery": true, "pickup": false}'::jsonb,
add column if not exists delivery_zones text[] not null default '{}'::text[],
add column if not exists payment_methods_supported jsonb not null default '{}'::jsonb,
add column if not exists catalog_source_type text not null default 'manual',
add column if not exists price_currency text not null default 'ARS',
add column if not exists agent_card jsonb not null default '{}'::jsonb,
add column if not exists business_config jsonb not null default '{}'::jsonb,
```

Aunque tienen defaults, si se envían valores `undefined` o `null` explícitamente, pueden causar el error 400.

## Solución Propuesta

### Archivo: `chat-client/services/business.service.ts`

**Cambiar la función `createBusiness` (líneas 94-113):**

```typescript
/**
 * Crear un nuevo negocio
 */
async createBusiness(businessData: Partial<Business>): Promise<Business> {
  // Mapear los datos del formulario a los campos de la base de datos
  const dbData = {
    // Campos básicos (mapeo camelCase -> snake_case)
    business_name: businessData.businessName,
    legal_name: businessData.legalName,
    description: businessData.description,
    email: businessData.email,
    phone: businessData.phone,
    website_url: businessData.website_url,
    address: businessData.address,
    
    // Campos legales
    tax_id: businessData.taxId,
    business_type: businessData.businessType,
    legal_entity_type: businessData.legalEntityType,
    
    // Campos de delivery (desde DeliveryStep)
    delivery_radius_km: businessData.delivery_radius_km,
    delivery_fee: businessData.delivery_fee,
    min_order_amount: businessData.min_order_amount,
    
    // Campos nuevos con valores por defecto seguros
    operating_regions: businessData.operating_regions || [],
    delivery_methods: businessData.delivery_methods || { delivery: true, pickup: false },
    delivery_zones: businessData.delivery_zones || [],
    estimated_delivery_time_min: businessData.estimated_delivery_time_min,
    estimated_delivery_time_max: businessData.estimated_delivery_time_max,
    pickup_preparation_time_minutes: businessData.pickup_preparation_time_minutes,
    payment_methods_supported: businessData.payment_methods_supported || { 
      cash: true, 
      card: false, 
      wallet: { mercadoPago: false } 
    },
    payment_timing: businessData.payment_timing || 'both',
    return_policy: businessData.return_policy,
    refund_policy: businessData.refund_policy,
    cancellation_window_minutes: businessData.cancellation_window_minutes || 15,
    business_contact_email: businessData.business_contact_email,
    business_contact_phone: businessData.business_contact_phone,
    responsible_person_name: businessData.responsible_person_name,
    catalog_source_type: businessData.catalog_source_type || 'manual',
    price_currency: businessData.price_currency || 'ARS',
    
    // JSON fields con defaults seguros
    agent_card: businessData.agent_card || {},
    business_config: businessData.business_config || {},
    
    // Estados iniciales
    is_active: false,
    is_verified: false,
    onboarding_completed: false,
  };

  // Remover valores undefined para que la BD use sus defaults
  const cleanedData = Object.fromEntries(
    Object.entries(dbData).filter(([_, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from('businesses')
    .insert(cleanedData)
    .select()
    .single();

  if (error) {
    console.error('Supabase error details:', error);
    throw error;
  }

  // Generar y guardar UCP profile
  const ucpProfile = this.generateUCPProfile(data.id);
  await this.updateUCPProfile(data.id, ucpProfile);

  return data as Business;
}
```

### Archivo: `chat-client/components/Business/BusinessRegister.tsx`

**Cambiar la llamada a `createBusiness` (líneas 68-73):**

```typescript
// Crear el negocio primero - mapear correctamente los campos
const business = await businessService.createBusiness({
  // Campos básicos
  businessName: businessData.basicInfo?.businessName,
  legalName: businessData.basicInfo?.legalName,
  businessType: businessData.basicInfo?.businessType,
  email: businessData.basicInfo?.email,
  phone: businessData.basicInfo?.phone,
  address: businessData.basicInfo?.address,
  description: businessData.basicInfo?.description,
  
  // Campos legales
  taxId: businessData.legalInfo?.taxId,
  legalEntityType: businessData.legalInfo?.legalEntityType,
  
  // Campos de delivery
  delivery_radius_km: businessData.delivery?.deliveryRadiusKm,
  delivery_fee: businessData.delivery?.deliveryFee,
  min_order_amount: businessData.delivery?.minOrderAmount,
  
  // Campos de configuración UCP (si existen)
  operating_regions: businessData.ucpConfig?.identity?.operatingRegions || [],
  delivery_methods: businessData.ucpConfig?.operations?.deliveryMethods || { delivery: true, pickup: false },
  delivery_zones: businessData.ucpConfig?.operations?.deliveryZones || [],
  estimated_delivery_time_min: businessData.ucpConfig?.operations?.estimatedDeliveryTime?.min,
  estimated_delivery_time_max: businessData.ucpConfig?.operations?.estimatedDeliveryTime?.max,
  pickup_preparation_time_minutes: businessData.ucpConfig?.operations?.pickupPreparationTime,
  payment_methods_supported: businessData.ucpConfig?.payment?.methods || { 
    cash: true, 
    card: false, 
    wallet: { mercadoPago: false } 
  },
  payment_timing: businessData.ucpConfig?.payment?.timing || 'both',
  return_policy: businessData.ucpConfig?.policies?.returnPolicy,
  refund_policy: businessData.ucpConfig?.policies?.refundPolicy,
  cancellation_window_minutes: businessData.ucpConfig?.policies?.cancellationWindow || 15,
  business_contact_email: businessData.ucpConfig?.contact?.email,
  business_contact_phone: businessData.ucpConfig?.contact?.phone,
  responsible_person_name: businessData.ucpConfig?.contact?.responsiblePerson,
  catalog_source_type: businessData.ucpConfig?.catalog?.sourceType || 'manual',
  price_currency: businessData.ucpConfig?.catalog?.currency || 'ARS',
});
```

## Validación Adicional Recomendada

### 1. **Agregar Logging Detallado**

En `business.service.ts`, antes de hacer el insert:

```typescript
console.log('Creating business with data:', JSON.stringify(cleanedData, null, 2));
```

### 2. **Manejo de Errores Mejorado**

```typescript
if (error) {
  console.error('Supabase error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  throw new Error(`Error al crear negocio: ${error.message}`);
}
```

### 3. **Verificar Políticas RLS**

Asegurarse de que las políticas RLS en Supabase permitan el INSERT. Ejecutar en Supabase SQL Editor:

```sql
-- Verificar políticas para businesses
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'businesses';
```

## Checklist de Implementación

- [ ] Actualizar `business.service.ts` con el mapeo correcto de campos
- [ ] Actualizar `BusinessRegister.tsx` con el objeto de datos correctamente estructurado
- [ ] Agregar logging detallado para debugging
- [ ] Verificar políticas RLS en Supabase
- [ ] Probar el flujo completo de registro
- [ ] Verificar que los datos se guarden correctamente en la BD
- [ ] Verificar que `businessConfigService.saveConfiguration()` funcione correctamente después

## Campos a Verificar en la BD Después del Fix

```sql
SELECT 
  business_name,
  business_type,
  email,
  operating_regions,
  delivery_methods,
  payment_methods_supported,
  catalog_source_type,
  price_currency,
  is_active,
  onboarding_completed
FROM businesses
ORDER BY created_at DESC
LIMIT 1;
```

## Notas Importantes

1. **No confundir** los tipos de `Business` de TypeScript con los campos reales de la BD
2. **Siempre mapear** camelCase a snake_case al interactuar con Supabase
3. **Validar** que todos los campos NOT NULL tengan valores o defaults
4. **Considerar** crear un helper function para el mapeo bidireccional (TS ↔ DB)

## Referencias

- Archivo: `chat-client/services/business.service.ts` (línea 94)
- Archivo: `chat-client/components/Business/BusinessRegister.tsx` (línea 69)
- Archivo: `chat-client/types/business.types.ts` (línea 19)
- Archivo: `sql_scripts/2026_01_27_business_agent_config.sql`
- Archivo: `sql_scripts/SUPABASE_SCHEMA.sql` (línea 202)
