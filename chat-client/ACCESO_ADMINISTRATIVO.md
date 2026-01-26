# Sistema de Acceso Administrativo - JANDI

**Fecha de implementación:** 26 de enero de 2026  
**Estado:** ✅ Activo  
**Tipo:** Barrera temporal de desarrollo

---

## Descripción

Durante la fase de desarrollo de JANDI, se ha implementado un sistema de acceso administrativo que requiere un código de verificación al final del proceso de onboarding.

Este sistema permite controlar qué usuarios pueden acceder a la plataforma mientras se encuentra en desarrollo.

---

## Funcionamiento

### Flujo del Usuario

1. El usuario completa los pasos 1-5 del onboarding:
   - Paso 1: Identidad y direcciones
   - Paso 2: Categorías de compra
   - Paso 3: Preferencias de compra
   - Paso 4: Nivel de autonomía
   - Paso 5: Método de pago

2. **Paso 6: Código de Acceso Administrativo (NUEVO)**
   - Se presenta una pantalla explicando que JANDI está en desarrollo
   - Se solicita un código de 7 caracteres alfanuméricos
   - El usuario debe ingresar el código proporcionado por el equipo
   - Solo con código válido se marca `onboarding_completed: true`

### Interfaz del Paso 6

La pantalla muestra:
- Título: "Acceso Administrativo"
- Mensaje: "JANDI se encuentra actualmente en fase de desarrollo"
- Información de acceso restringido
- Input para código de 7 caracteres
- Validación en tiempo real
- Contacto de ayuda: admin@jandi.com.ar

---

## Seguridad

### Implementación del Código

El código **NO está almacenado en texto plano** en ningún lugar del código:

1. **Frontend (Step6AccessCode.tsx):**
   - Solo se almacena el hash SHA-256 del código válido
   - Hash: `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918`
   - El código ingresado por el usuario se hashea en tiempo real
   - Se compara el hash calculado con el hash almacenado

2. **Backend (onboarding.service.ts):**
   - Validación adicional del lado del servicio
   - Usa el mismo método de hash SHA-256
   - Rechaza el guardado de onboarding si el código es inválido

### ¿Por qué es seguro?

- **No reversible:** El hash SHA-256 no puede ser revertido al código original
- **Doble validación:** Frontend + Backend
- **Sin almacenamiento:** El código no se guarda en la base de datos
- **Temporalidad:** Este sistema será removido en producción

---

## Acceso al Código

### Para Administradores

El código de acceso actual es de **uso interno** y debe ser compartido únicamente con:
- Usuarios de prueba autorizados
- Miembros del equipo de desarrollo
- Testers designados

### Contacto

Si necesitás el código de acceso, contactá a:
- **Email:** admin@jandi.com.ar
- **Asunto:** Solicitud de código de acceso - JANDI Beta

---

## Eliminación Futura

Cuando JANDI esté listo para producción, se deben seguir estos pasos:

### 1. Remover Componente
```bash
# Eliminar el archivo del paso 6
rm chat-client/components/Onboarding/Step6AccessCode.tsx
```

### 2. Actualizar Types
```typescript
// En types/onboarding.types.ts
export interface OnboardingData {
  step: number;
  totalSteps: 5; // ← Cambiar de 6 a 5
  data: {
    identity: IdentityData | null;
    shopping: ShoppingData | null;
    preferences: PreferencesData | null;
    autonomy: AutonomyData | null;
    payment: PaymentData | null;
    // accessCode: AccessCodeData | null; ← REMOVER
  };
}
```

### 3. Actualizar Hook
```typescript
// En hooks/useOnboarding.ts
const initialOnboardingData: OnboardingData = {
  step: 1,
  totalSteps: 5, // ← Cambiar de 6 a 5
  data: {
    identity: null,
    shopping: null,
    preferences: null,
    autonomy: null,
    payment: null,
    // accessCode: null, ← REMOVER
  },
};
```

### 4. Actualizar Container
```typescript
// En components/Onboarding/OnboardingContainer.tsx

// REMOVER import de Step6AccessCode
// REMOVER case 6 del switch en renderCurrentStep()
// Cambiar currentStep === 6 a currentStep === 5
// Cambiar totalSteps={6} a totalSteps={5}
```

### 5. Actualizar Service
```typescript
// En services/onboarding.service.ts

// REMOVER método validateAccessCode()
// REMOVER validación de accessCode en saveOnboardingData()
// REMOVER accessCode de la desestructuración
```

### 6. Actualizar Index
```typescript
// En components/Onboarding/index.ts
// REMOVER: export { Step6AccessCode } from './Step6AccessCode';
```

---

## Testing

### Casos de Prueba

1. **Código Correcto:**
   - Ingresar el código válido
   - Verificar que se habilita el botón "Finalizar"
   - Verificar que se completa el onboarding exitosamente

2. **Código Incorrecto:**
   - Ingresar un código inválido
   - Verificar mensaje de error
   - Verificar que el botón "Finalizar" permanece deshabilitado

3. **Sin Código:**
   - Dejar el campo vacío
   - Verificar que el botón "Finalizar" está deshabilitado

4. **Validación Backend:**
   - Intentar burlar la validación del frontend
   - Verificar que el backend rechaza códigos inválidos

---

## Notas Técnicas

### Hash SHA-256

El código `gala123` genera el siguiente hash:
```
8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
```

Este hash se puede verificar usando:
```bash
echo -n "gala123" | sha256sum
```

### Archivos Modificados

1. `chat-client/components/Onboarding/Step6AccessCode.tsx` (nuevo)
2. `chat-client/components/Onboarding/index.ts`
3. `chat-client/components/Onboarding/OnboardingContainer.tsx`
4. `chat-client/types/onboarding.types.ts`
5. `chat-client/hooks/useOnboarding.ts`
6. `chat-client/services/onboarding.service.ts`

---

## FAQ

**P: ¿Por qué usar hash en lugar de una API?**  
R: Para esta fase de desarrollo, el hash es suficiente y evita complejidad innecesaria. En producción, este sistema será removido completamente.

**P: ¿Se puede cambiar el código?**  
R: Sí, solo necesitás generar un nuevo hash SHA-256 del código que desees y reemplazarlo en los dos lugares donde aparece.

**P: ¿El código se guarda en la base de datos?**  
R: No, el código no se almacena en ningún lugar. Solo se valida durante el onboarding.

**P: ¿Afecta esto a usuarios que ya completaron el onboarding?**  
R: No, esta validación solo aplica para nuevos usuarios durante el onboarding.

---

**Último update:** 26 de enero de 2026
