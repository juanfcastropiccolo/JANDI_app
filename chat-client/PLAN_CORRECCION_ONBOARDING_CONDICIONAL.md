# Plan de Corrección: Renderizado Condicional del Onboarding

## Fecha
25 de Enero, 2026

## Problema Identificado

### Descripción del Bug
El flujo de onboarding actual renderiza **todos los 5 pasos simultáneamente en el DOM**, usando `transform: translateX()` para mostrar solo uno visualmente. Esto causa que:

1. **Al presionar Tab repetidamente**, el navegador recorre TODOS los campos de los 5 pasos, no solo los del paso actual
2. **El botón "Siguiente" puede no funcionar correctamente** porque hay múltiples instancias de campos en el DOM
3. **Mala experiencia de accesibilidad**: lectores de pantalla detectan campos que no deberían estar accesibles
4. **Performance innecesaria**: se renderizan y validan campos que el usuario no está viendo

### Ubicación del Problema
**Archivo:** `/chat-client/components/Onboarding/OnboardingContainer.tsx`

**Líneas problemáticas:** 92-155

```typescript
{/* Steps Container with Slide Animation */}
<div className="bg-white rounded-2xl shadow-lg p-8 overflow-hidden">
  <div
    className="flex transition-transform duration-500 ease-in-out"
    style={{
      transform: `translateX(-${(currentStep - 1) * 100}%)`,
      width: '500%', // 5 pantallas × 100% ← PROBLEMA: todos los steps están aquí
    }}
  >
    {/* Step 1 */}
    <div className="w-full flex-shrink-0">
      <Step1Identity ... />
    </div>
    {/* Step 2 */}
    <div className="w-full flex-shrink-0">
      <Step2Shopping ... />
    </div>
    {/* Step 3 */}
    <div className="w-full flex-shrink-0">
      <Step3Preferences ... />
    </div>
    {/* Step 4 */}
    <div className="w-full flex-shrink-0">
      <Step4Autonomy ... />
    </div>
    {/* Step 5 */}
    <div className="w-full flex-shrink-0">
      <Step5Payment ... />
    </div>
  </div>
  
  <NavigationButtons ... />
</div>
```

---

## Solución Propuesta: Renderizado Condicional

### Estrategia
En lugar de renderizar todos los steps y usar `translateX` para mostrar uno, **renderizar condicionalmente solo el step actual** usando un `switch` o renderizado condicional basado en `currentStep`.

### Beneficios
1. ✅ Solo los campos del paso actual estarán en el DOM
2. ✅ Tab solo recorrerá los campos visibles
3. ✅ Mejor accesibilidad
4. ✅ Mejor performance (menos componentes renderizados)
5. ✅ Validación más clara (solo un step activo a la vez)

---

## Cambios Detallados

### 1. Modificar `OnboardingContainer.tsx`

#### 1.1. Crear función helper para renderizar el step actual
**Ubicación:** Antes del return, después de `handleStepDataChange`

```typescript
const renderCurrentStep = () => {
  switch (currentStep) {
    case 1:
      return (
        <Step1Identity
          data={onboardingData.data.identity}
          onChange={handleStepDataChange}
          onValidationChange={setCanProceed}
        />
      );
    case 2:
      return (
        <Step2Shopping
          data={onboardingData.data.shopping}
          onChange={handleStepDataChange}
          onValidationChange={setCanProceed}
        />
      );
    case 3:
      return (
        <Step3Preferences
          data={onboardingData.data.preferences}
          onChange={handleStepDataChange}
          onValidationChange={setCanProceed}
        />
      );
    case 4:
      return (
        <Step4Autonomy
          data={onboardingData.data.autonomy}
          onChange={handleStepDataChange}
          onValidationChange={setCanProceed}
        />
      );
    case 5:
      return (
        <Step5Payment
          data={onboardingData.data.payment}
          onChange={handleStepDataChange}
          onValidationChange={setCanProceed}
        />
      );
    default:
      return null;
  }
};
```

#### 1.2. Reemplazar el contenedor flex por renderizado condicional
**Ubicación:** Líneas 92-155

**REEMPLAZAR ESTO:**
```typescript
<div className="bg-white rounded-2xl shadow-lg p-8 overflow-hidden">
  <div
    className="flex transition-transform duration-500 ease-in-out"
    style={{
      transform: `translateX(-${(currentStep - 1) * 100}%)`,
      width: '500%',
    }}
  >
    {/* Todos los 5 steps renderizados aquí */}
  </div>
  
  <NavigationButtons ... />
</div>
```

**POR ESTO:**
```typescript
<div className="bg-white rounded-2xl shadow-lg p-8">
  {/* Contenedor del step actual con animación de fade */}
  <div 
    key={currentStep}
    className="animate-fadeIn"
  >
    {renderCurrentStep()}
  </div>
  
  {/* Navigation Buttons */}
  <NavigationButtons
    currentStep={currentStep}
    totalSteps={5}
    onPrevious={handlePrevious}
    onNext={handleNext}
    canProceed={canProceed}
    loading={loading}
  />
</div>
```

**NOTA IMPORTANTE:** Se removió `overflow-hidden` para asegurar que todos los campos queden visibles dentro del contenedor.

#### 1.3. Añadir animación de fade-in (opcional pero recomendado)
**Ubicación:** `/chat-client/index.css`

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
```

---

### 2. Validación de Límites del Contenedor

#### 2.1. Contenedor Actual
**Clases:** `bg-white rounded-2xl shadow-lg p-8`

**Dimensiones:**
- Max width: `max-w-2xl` (establecido en el contenedor padre, línea 71)
- Padding interno: `p-8` (32px en todos los lados)
- Background: blanco con sombra y bordes redondeados

#### 2.2. Verificar que todos los campos queden dentro
Cada componente de step debe verificarse individualmente:

##### **Step 1: Identity** ✅
**Campos:**
- Nickname (1 input)
- Phone (1 input)
- Primary Address (4 inputs: calle, ciudad, provincia, código postal)

**Total: 6 campos**

**Verificación:** Todos los inputs usan `w-full` y están en layout vertical con `space-y-6`, lo que garantiza que queden dentro del contenedor de `max-w-2xl`.

##### **Step 2: Shopping** ✅
**Campos:**
- 7 categorías en grid `grid-cols-2 gap-3`
- 1 input custom + botón agregar

**Verificación:** El grid de 2 columnas asegura que las categorías queden dentro del ancho disponible. El input custom usa `flex-1` en un contenedor flex, garantizando que se adapte al ancho.

##### **Step 3: Preferences** ✅
**Campos:**
- 4 opciones de prioridad (vertical)
- 2 opciones de out-of-stock (vertical)

**Total: 6 botones verticales**

**Verificación:** Todos los botones usan `w-full` en layout vertical, garantizando que queden dentro del contenedor.

##### **Step 4: Autonomy** ✅
**Campos:**
- 2 rangos con inputs numéricos (max amount per purchase, max amount per month)
- 3 opciones de notificación (vertical)
- 3 opciones de resumen en grid `grid-cols-3 gap-2`
- Warning condicional

**Verificación:** 
- Los rangos usan `flex-1` con inputs de `w-32`, que caben en el contenedor de `max-w-2xl`
- El grid de 3 columnas para resúmenes puede ser ajustado (ver recomendación más abajo)

##### **Step 5: Payment** ✅
**Campos:**
- 2 opciones de método en grid `grid-cols-2 gap-4`
- Formulario de tarjeta (4 campos) o email de Mercado Pago (1 campo)
- Nota de seguridad

**Verificación:** El grid de 2 columnas y los inputs de tarjeta están bien contenidos dentro de `max-w-2xl`.

#### 2.3. Recomendación: Ajustar grid de resúmenes en Step 4 (OPCIONAL)
Para dispositivos móviles pequeños, el grid de 3 columnas en Step 4 (línea 157 de `Step4Autonomy.tsx`) podría ser ajustado:

```typescript
// ANTES:
<div className="grid grid-cols-3 gap-2">

// DESPUÉS (responsive):
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
```

Esto asegura que en pantallas pequeñas se muestren 2 columnas y en pantallas medianas/grandes se muestren 3.

---

### 3. Verificación del Flujo Completo

#### 3.1. Navegación entre Steps ✅
**Implementación actual (correcta):**
- `goToNextStep()` incrementa `currentStep` (en `useOnboarding` hook)
- `goToPreviousStep()` decrementa `currentStep`
- `NavigationButtons` ya muestra "Finalizar" en el último step (línea 71)

**NO requiere cambios.**

#### 3.2. Habilitación del botón Siguiente ✅
**Implementación actual (correcta):**
- Cada step llama a `onValidationChange(isValid)` cuando los datos cambian
- `OnboardingContainer` usa `canProceed` para habilitar/deshabilitar el botón
- `NavigationButtons` recibe `canProceed` y deshabilita el botón si es `false`

**NO requiere cambios.**

#### 3.3. Botón "Finalizar" y redirección ✅
**Implementación actual (correcta):**
```typescript
const handleNext = async () => {
  if (currentStep === 5) {
    // Último paso: enviar datos
    try {
      await submitOnboarding();
      navigate('/chat'); // ← Redirige al HOME
    } catch (err) {
      console.error('Error submitting onboarding:', err);
    }
  } else {
    goToNextStep();
    setCanProceed(false); // Reset para el próximo paso
  }
};
```

**NO requiere cambios.**

---

## Resumen de Cambios

| Archivo | Acción | Líneas Afectadas | Complejidad |
|---------|--------|------------------|-------------|
| `OnboardingContainer.tsx` | Agregar función `renderCurrentStep()` | Nueva función (~60 líneas) | Media |
| `OnboardingContainer.tsx` | Reemplazar contenedor flex por renderizado condicional | 92-155 | Alta |
| `index.css` | Agregar animación fadeIn (opcional) | Nueva sección | Baja |
| `Step4Autonomy.tsx` | Ajustar grid responsive (opcional) | 157 | Baja |

---

## Testing Requerido

### Test 1: Navegación con Tab
**Pasos:**
1. Iniciar onboarding en Step 1
2. Presionar Tab repetidamente
3. **Resultado esperado:** Solo recorre los campos del Step 1
4. Avanzar al Step 2
5. Presionar Tab repetidamente
6. **Resultado esperado:** Solo recorre los campos del Step 2
7. Repetir para todos los steps

### Test 2: Habilitación del botón Siguiente
**Pasos:**
1. En cada step, verificar que el botón "Siguiente" esté deshabilitado inicialmente
2. Completar los campos requeridos
3. **Resultado esperado:** El botón se habilita automáticamente
4. Hacer clic en "Siguiente"
5. **Resultado esperado:** Avanza al siguiente step

### Test 3: Navegación Atrás
**Pasos:**
1. Avanzar al Step 3
2. Hacer clic en "Anterior"
3. **Resultado esperado:** Vuelve al Step 2 con los datos previamente ingresados
4. Hacer clic en "Anterior" nuevamente
5. **Resultado esperado:** Vuelve al Step 1 con los datos previamente ingresados

### Test 4: Último Step
**Pasos:**
1. Completar todos los steps hasta el Step 5
2. **Resultado esperado:** El botón dice "Finalizar" en lugar de "Siguiente"
3. Completar los campos de pago
4. Hacer clic en "Finalizar"
5. **Resultado esperado:** Se envían los datos y redirige a `/chat`

### Test 5: Límites del Contenedor
**Pasos:**
1. Abrir el onboarding en diferentes tamaños de pantalla:
   - Desktop (>1024px)
   - Tablet (768px-1024px)
   - Mobile (320px-768px)
2. **Resultado esperado:** Todos los campos quedan dentro del contenedor blanco con bordes redondeados
3. **Resultado esperado:** No hay overflow horizontal ni vertical no deseado
4. **Resultado esperado:** En Step 4, el grid de resúmenes se adapta correctamente (si se implementa el cambio responsive)

### Test 6: Accesibilidad
**Pasos:**
1. Usar lector de pantalla (VoiceOver en Mac, NVDA en Windows)
2. **Resultado esperado:** Solo anuncia los campos del step actual
3. **Resultado esperado:** Anuncia correctamente el número de step actual (1 de 5, 2 de 5, etc.)

---

## Consideraciones Adicionales

### 1. Animaciones
La animación de `fadeIn` propuesta es sutil y rápida (0.3s). Si se desea mantener la animación de slide original, se puede implementar con bibliotecas como:
- `framer-motion` (ya está instalado, se usa en Step2Shopping)
- `react-transition-group`

Sin embargo, para este fix, el renderizado condicional simple con fade-in es suficiente y más performante.

### 2. Persistencia de Datos
El hook `useOnboarding` ya maneja la persistencia de datos entre steps correctamente. Al cambiar de step con renderizado condicional, los datos se mantienen en el estado del contexto.

### 3. Validación
Cada step ya implementa validación correcta con `useEffect` que escucha cambios en `formData` y llama a `onValidationChange`. Esto seguirá funcionando sin cambios.

### 4. Performance
El renderizado condicional mejorará la performance porque:
- Solo 1 step se renderiza en lugar de 5
- Solo 1 step valida sus campos en lugar de 5
- Menos nodos en el DOM

---

## Orden de Implementación Recomendado

1. **Primero:** Implementar cambios en `OnboardingContainer.tsx`
   - Agregar función `renderCurrentStep()`
   - Reemplazar contenedor flex por renderizado condicional

2. **Segundo:** Agregar animación fadeIn en `index.css` (opcional pero recomendado)

3. **Tercero:** Ajustar grid responsive en `Step4Autonomy.tsx` (opcional)

4. **Cuarto:** Testing exhaustivo (ver sección de Testing)

5. **Quinto:** Verificar con `flutter analyze` (aunque este es un proyecto React, no Flutter)

---

## Conclusión

El problema identificado es real y afecta significativamente la usabilidad y accesibilidad del onboarding. La solución propuesta es directa, no rompe funcionalidad existente, y mejora la experiencia del usuario.

**Tiempo estimado de implementación:** 30-45 minutos

**Riesgo:** Bajo (los cambios son aislados y no afectan la lógica de negocio)

**Impacto:** Alto (mejora significativa en UX, accesibilidad y performance)
