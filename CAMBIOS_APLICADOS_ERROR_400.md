# Cambios Aplicados para Corregir Error 400

## Fecha de Aplicación
2026-01-27

## Estado
✅ COMPLETADO - Todos los cambios fueron aplicados exitosamente

---

## Archivos Modificados

### 1. `/chat-client/services/business.service.ts`

**Cambio:** Se reescribió completamente la función `createBusiness()` (líneas 91-113)

**Antes:**
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

**Después:**
- ✅ Mapeo explícito de campos camelCase → snake_case
- ✅ Valores por defecto seguros para campos NOT NULL
- ✅ Filtrado de valores `undefined` para que la BD use sus defaults
- ✅ Logging detallado para debugging
- ✅ Manejo de errores mejorado con información detallada

**Puntos clave del cambio:**
```typescript
const dbData = {
  // Mapeo explícito camelCase → snake_case
  business_name: businessData.businessName,
  business_type: businessData.businessType,
  tax_id: businessData.taxId,
  legal_entity_type: businessData.legalEntityType,
  // ...
  
  // Defaults seguros para campos NOT NULL
  operating_regions: businessData.operating_regions || [],
  delivery_methods: businessData.delivery_methods || { delivery: true, pickup: false },
  payment_methods_supported: businessData.payment_methods_supported || { 
    cash: true, 
    card: false, 
    wallet: { mercadoPago: false } 
  },
  // ...
};

// Remover undefined para usar defaults de BD
const cleanedData = Object.fromEntries(
  Object.entries(dbData).filter(([_, v]) => v !== undefined)
);
```

---

### 2. `/chat-client/components/Business/BusinessRegister.tsx`

**Cambio:** Se actualizó la llamada a `createBusiness()` con estructura de datos correcta (líneas 68-105)

**Antes:**
```typescript
const business = await businessService.createBusiness({
  ...businessData.basicInfo,
  ...businessData.legalInfo,
  ...businessData.delivery,
});
```

**Después:**
```typescript
const business = await businessService.createBusiness({
  // Campos básicos con mapeo explícito
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
  
  // Campos de configuración UCP con defaults
  operating_regions: businessData.ucpConfig?.identity?.operatingRegions || [],
  delivery_methods: businessData.ucpConfig?.operations?.deliveryMethods || { delivery: true, pickup: false },
  // ... todos los campos del formulario mapeados correctamente
});
```

**También se mejoró el manejo de errores:**
```typescript
catch (err: any) {
  console.error('Error creating business:', err);
  const errorMessage = err?.message || 'Error al registrar el negocio. Por favor intenta nuevamente.';
  setError(errorMessage);
}
```

---

### 3. `/chat-client/types/business.types.ts`

**Cambio:** Se extendió la interfaz `Business` para soportar campos en camelCase (líneas 19-72)

**Agregado:**
```typescript
export interface Business {
  // ... campos existentes en snake_case ...
  
  // Campos en camelCase (para compatibilidad con formularios)
  // Estos se usan temporalmente antes del mapeo a snake_case
  businessName?: string;
  legalName?: string;
  businessType?: 'restaurant' | 'store' | 'pharmacy' | 'supermarket';
  taxId?: string;
  legalEntityType?: 'individual' | 'company';
}
```

**Propósito:** Permitir que TypeScript acepte los campos en camelCase que vienen del formulario antes de ser mapeados a snake_case para la BD.

---

## Verificación de Cambios

### ✅ Linter
- No se encontraron errores de TypeScript/ESLint
- Todos los tipos son correctos

### ✅ Validaciones Implementadas
- Mapeo correcto de todos los campos del formulario
- Valores por defecto seguros para campos NOT NULL
- Filtrado de valores undefined
- Logging detallado para debugging
- Manejo de errores mejorado

---

## Qué Resuelven Estos Cambios

### Problema Principal Resuelto: Error 400 al Crear Negocio

**Causa Raíz:**
- El frontend enviaba campos en `camelCase` (ej: `businessName`)
- La BD esperaba campos en `snake_case` (ej: `business_name`)
- Se hacía un spread directo sin transformación

**Solución Aplicada:**
1. ✅ Mapeo explícito en `business.service.ts` de camelCase → snake_case
2. ✅ Estructura de datos correcta en `BusinessRegister.tsx`
3. ✅ Tipos extendidos en `business.types.ts` para compatibilidad
4. ✅ Valores por defecto para campos NOT NULL nuevos
5. ✅ Logging y manejo de errores mejorado

---

## Próximos Pasos para Probar

### 1. Verificar en la Consola del Navegador
Cuando se registre un negocio, deberías ver:
```
Creating business with data: {
  "business_name": "...",
  "business_type": "...",
  "email": "...",
  "operating_regions": [...],
  ...
}
```

### 2. Si Hay Error
Deberías ver información detallada:
```
Supabase error details: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

### 3. Verificar en Supabase
Ejecutar query para ver el registro creado:
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

---

## Testing Recomendado

1. **Test básico:** Registrar un negocio con información mínima
2. **Test completo:** Registrar un negocio con todos los campos opcionales
3. **Test con UCP:** Registrar un negocio y verificar que `businessConfigService.saveConfiguration()` funcione
4. **Verificar en BD:** Confirmar que todos los campos se guardaron correctamente

---

## Notas Importantes

- ⚠️ Los logs de `console.log()` en `business.service.ts` son para debugging. Podrían removerse en producción.
- ✅ Los valores por defecto aseguran compatibilidad con campos NOT NULL
- ✅ El filtrado de `undefined` permite que la BD use sus propios defaults
- ✅ El sistema ahora es más robusto ante datos faltantes

---

## Archivos de Referencia

- Plan original: `SOLUCION_ERROR_400_REGISTRO_NEGOCIO.md`
- Schema de BD: `sql_scripts/SUPABASE_SCHEMA.sql`
- Migration con campos nuevos: `sql_scripts/2026_01_27_business_agent_config.sql`
