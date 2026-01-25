# Plan de Mejora UI - Interfaz de Voz Animada

## Objetivo
Mejorar la UI actual del `a2a/chat-client` (React + Vite, A2A + UCP) incorporando un **modo de conversación por voz** con una animación de nube de partículas 3D como **home**, que responda al audio en tiempo real y soporte **modo claro/oscuro** y **personalización de color**.

Restricción clave: **no interferir con el flujo determinístico de compra (UCP)** que hoy se renderiza dentro del chat (checkout/resumen, selección de método de pago y confirmación). El usuario debe poder **switchear** entre voz y no-voz; cuando el flujo de compra requiera validación/confirmación, la animación debe **ocultarse automáticamente** para mostrar claramente los componentes determinísticos en el chat.

---

## Fase 1: Análisis y Preparación

### 1.1 Auditoría del Código Base Actual
- **Objetivo**: Entender la arquitectura existente del chat-client
- **Tareas**:
  - Revisar la estructura de componentes de React existente
  - Identificar cómo se manejan los mensajes A2A hoy (JSON-RPC `message/send` vía `fetch('/api')`, parsing de `result.parts` / `status.message.parts`, manejo de `contextId`/`taskId`)
  - Mapear el flujo de datos actual (mensajes, estado, contexto)
  - Identificar puntos de integración para audio (input/output)
  - Documentar dependencias actuales en `package.json`
  - Identificar explícitamente los puntos del flujo UCP donde la UI se vuelve **determinística** en el cliente (render de `Checkout`, `PaymentMethodSelector`, `PaymentConfirmation`)

### 1.2 Análisis de la Animación Base
- **Objetivo**: Extraer y adaptar la animación de `prueba.html` para React
- **Tareas**:
  - Identificar componentes reutilizables del código JavaScript de la animación
  - Separar lógica de visualización (canvas) de lógica de audio (WebAudio API)
  - Documentar parámetros personalizables: colores, sensibilidad, tamaño de nube
  - Planificar optimizaciones para reducir pixelación (DPR, smoothing)

---

## Principios de compatibilidad (A2A/UCP) y no interferencia con UI determinística

### Qué NO se debe romper
- **A2A client contract**: el cliente hoy consume respuestas A2A vía JSON (no streaming) y arma UI a partir de `parts` (texto + `a2a.product_results` + `a2a.ucp.checkout`).
- **UCP checkout determinístico**: los componentes `Checkout`, `PaymentMethodSelector` y `PaymentConfirmation` deben permanecer **visibles, clickeables y sin overlay** cuando corresponda.

### Regla de oro de UI
- **La animación es “home” solo para conversación**. En cuanto el chat entre en una etapa de compra/pago (checkout/payment), el canvas **se oculta** y la UI vuelve a ser el chat “clásico” para mostrar el resumen y botones de confirmación/continuación.

### Detección de “modo determinístico”
Definir un selector derivado del estado actual de `messages`:

- `isDeterministicFlowActive = true` si existe al menos uno de:
  - un mensaje con `checkout`
  - un mensaje con `paymentMethods`
  - un mensaje con `paymentInstrument`

Nota: esto coincide con cómo hoy se renderiza el flujo (los componentes aparecen en `ChatMessageComponent` cuando esas props existen).

### Comportamiento requerido
- Si `isDeterministicFlowActive === true`:
  - **Forzar vista Chat** (aunque el usuario esté en “modo voz”).
  - **Pausar** animación (cancelar RAF) o reducir a modo “idle” fuera de pantalla.
  - **Detener** captura de micrófono/escucha continua para evitar confusión durante confirmaciones.
  - Mantener selector de voz/controles **fuera del área de checkout** (o ocultos).
- Si `isDeterministicFlowActive === false`:
  - Permitir “home voz” con animación y controles mínimos.
  - Permitir switch manual a “modo texto/chat”.

---

## Fase 2: Arquitectura de Componentes

### 2.1 Estructura de Componentes Nuevos
```
components/
├── VoiceAnimation/
│   ├── VoiceAnimation.tsx          # Componente principal de animación
│   ├── AudioVisualizer.ts          # Lógica de análisis de audio
│   ├── ParticleCloud.ts            # Sistema de partículas 3D
│   ├── useAudioAnalyzer.ts         # Hook personalizado para WebAudio API
│   └── types.ts                    # Tipos TypeScript
├── VoiceControls/
│   ├── VoiceSelector.tsx           # Selector de voz (hombre/mujer)
│   ├── VoiceIndicator.tsx          # Indicador de estado (hablando/escuchando)
│   └── ColorCustomizer.tsx         # Personalizador de colores
└── VoiceHome/
    └── VoiceHome.tsx               # Pantalla home con animación
```

### 2.2 Hooks Personalizados
- **useAudioAnalyzer**: Gestiona WebAudio API, analyser node, y captura de frecuencias
- **useVoiceInput**: Maneja reconocimiento de voz (Web Speech API o alternativa)
- **useVoiceOutput**: Gestiona síntesis de voz (TTS) y reproducción (sin asumir streaming en el cliente actual)
- **useTheme**: Controla dark mode y colores de la animación
- **useStreamingAudio (opcional/futuro)**: Conecta audio en chunks al visualizador **si** el backend/servicio lo expone (SSE/WS/chunked)

---

## Fase 3: Implementación del Sistema de Animación

### 3.1 Componente VoiceAnimation
- **Responsabilidades**:
  - Renderizar canvas con animación de nube de partículas
  - Responder en tiempo real a datos de audio (frecuencia, amplitud)
  - Soportar personalización de colores vía props
  - Adaptar colores según tema (light/dark mode)
  - Optimización de DPR para evitar pixelación
  
- **Props del componente**:
  ```typescript
  interface VoiceAnimationProps {
    audioSource: AudioNode | null;
    colors: {
      primary: string;      // Color principal de partículas
      secondary: string;    // Color secundario/halo
      background: string;   // Color de fondo
    };
    size?: 'small' | 'medium' | 'large';
    sensitivity?: number;   // 0.6 - 3.0
    isActive: boolean;      // Si está hablando/escuchando
  }
  ```

### 3.2 Sistema de Partículas
- **Características**:
  - 1200 partículas con distribución gaussiana
  - Rotación 3D suave (matrices de transformación)
  - Proyección con perspectiva
  - Física de partículas: velocidad, aceleración, amortiguación
  - Respuesta dinámica a bandas de audio (bass, mid, treble)
  - Z-sorting para renderizado correcto

- **Optimizaciones**:
  - Limit DPR a 2 para balancear calidad/rendimiento
  - Usar `OffscreenCanvas` si está disponible (web workers futuro)
  - Implementar throttling en resize events
  - Gradient caching donde sea posible
  - RequestAnimationFrame optimizado

### 3.3 Integración WebAudio API
- **Flujo de audio**:
  1. Crear `AudioContext` global
  2. Setup `AnalyserNode` con FFT size 1024
  3. Conectar fuentes de audio:
     - Micrófono del usuario (para input de voz)
     - Audio de salida del agente (TTS) reproducido en un `<audio>` o `AudioNode`
  4. Extraer datos en tiempo real:
     - Frecuencias (`getByteFrequencyData`)
     - Waveform (`getByteTimeDomainData`)
  5. Calcular métricas: RMS, bass, mid, treble, energy

- **Gestión de múltiples fuentes**:
  - Usar `createMediaStreamSource` para micrófono
  - Usar `createMediaElementSource` o un `AudioNode` equivalente para el audio de salida (TTS)
  - Implementar mixing cuando ambos estén activos
  - Evitar feedback loops (no conectar mic a destination durante grabación)

---

## Fase 4: Integración con Google ADK y Streaming

### 4.1 Voz del agente (TTS) compatible con A2A/UCP
- **Objetivo**: Hacer que el agente “hable” sin modificar el contrato A2A/UCP del chat-client.
- **Validación del estado actual**:
  - El cliente hoy hace `await response.json()`; por defecto **no consume streaming** desde `/api`.
  - Por lo tanto, en una primera iteración, el TTS se dispara **al recibir el texto completo** (o el texto consolidado) del agente.
- **Tareas**:
  - Definir una capa `VoiceOutput` que tome `ChatMessage` (texto) y produzca audio reproducible (por ahora, no-streaming).
  - Conectar la reproducción de TTS al `AnalyserNode` para que la animación reaccione al audio real.
  - Mantener la lógica A2A/UCP existente sin cambios (no modificar parsing de `parts` ni el render de checkout).

### 4.2 Streaming (opcional, condicionado al backend)
```typescript
interface StreamingAudioHandler {
  startStream(): void;
  feedChunk(audioChunk: ArrayBuffer): void;
  stopStream(): void;
  connectToAnalyzer(analyser: AnalyserNode): void;
}
```

- **Condición**: implementar esta fase solo si el backend/servicio de voz entrega audio en chunks (SSE/WS/chunked transfer) o si se decide extender el proxy `/api` para soportarlo.
- **Implementación (si aplica)**:
  - Queue de buffers para reproducción continua
  - Crossfade entre chunks para suavidad
  - Detección de fin de stream

### 4.3 Manejo de Estados del Agente
- **Estados posibles**:
  - `idle`: En reposo, animación sutil
  - `listening`: Escuchando al usuario, animación reactiva
  - `thinking`: Procesando (Google ADK), animación de "espera"
  - `speaking`: Hablando, animación reactiva al audio de salida
  - `error`: Estado de error, animación diferente

- **Transiciones**:
  - Animaciones suaves entre estados (ease-in-out)
  - Colores específicos por estado (opcional)
  - Feedback visual claro

---

## Fase 5: Sistema de Voz Bidireccional

### 5.1 Input de Voz del Usuario
- **Tecnologías**:
  - Web Speech API (`SpeechRecognition`) como opción principal
  - Fallback: MediaRecorder + API externa si necesario
  
- **Flujo**:
  1. Usuario presiona botón para hablar o detección automática (VAD)
  2. Capturar audio del micrófono
  3. Conectar a analyser para visualización
  4. Transcribir a texto (Web Speech API)
  5. Enviar mensaje al agente vía `handleSendMessage`

- **Características**:
  - Indicador visual de grabación
  - Cancelación de grabación
  - Feedback de volumen
  - Manejo de permisos de micrófono

### 5.2 Output de Voz del Agente
- **Selector de voz**:
  - Dropdown o toggle para seleccionar:
    - Voz masculina (parámetros específicos de Google ADK)
    - Voz femenina (parámetros específicos de Google ADK)
  - Persistir selección en localStorage
  - Aplicar configuración a todas las respuestas

- **Integración**:
  - Interceptar respuestas de texto del agente
  - Enviar a TTS con parámetros de voz seleccionada (hombre/mujer)
  - Reproducir y visualizar simultáneamente
  - **Regla UCP**: si `isDeterministicFlowActive === true`, pausar/evitar auto-reproducción de TTS y priorizar la UI de confirmación

---

## Fase 6: Personalización y Theming

### 6.1 Sistema de Colores
- **Presets de colores**:
  ```typescript
  interface ColorTheme {
    name: string;
    particles: {
      primary: string;     // RGB o RGBA
      secondary: string;
      glow: string;
    };
    background: string;
    ui: {
      text: string;
      border: string;
      accent: string;
    };
  }
  ```

- **Temas por defecto**:
  - **Light Mode**: 
    - Background: `rgb(255, 255, 255)`
    - Particles: azul vibrante `rgb(100, 180, 255)`
    - Glow: celeste `rgba(140, 220, 255, 0.3)`
  - **Dark Mode**: 
    - Background: `rgb(5, 7, 10)`
    - Particles: blanco azulado `rgb(220, 245, 255)`
    - Glow: azul `rgba(120, 210, 255, 0.25)`

- **Customización por usuario**:
  - Color picker para elegir color primario
  - Generar paleta complementaria automáticamente
  - Vista previa en tiempo real
  - Guardar en localStorage o perfil de usuario

### 6.2 Dark Mode
- **Implementación**:
  - Detectar preferencia del sistema (`prefers-color-scheme`)
  - Toggle manual en UI
  - Transición suave entre modos (CSS transitions)
  - Actualizar colores de animación dinámicamente
  - Persistir preferencia

- **Consideraciones**:
  - Asegurar contraste suficiente en ambos modos
  - Animación debe ser visible y atractiva en ambos
  - UI controls deben adaptarse al tema

---

## Fase 7: Optimización y Performance

### 7.1 Optimización de Renderizado
- **Canvas**:
  - Limitar DPR a 2 máximo (balance calidad/performance)
  - Implementar culling de partículas fuera de viewport
  - Reducir operaciones costosas (gradientes, arcos)
  - Usar `fillRect` en lugar de `clearRect` donde sea posible
  - Optimizar sorting (considerar spatial hashing si es necesario)

- **React**:
  - Memoizar componentes pesados (`React.memo`)
  - Usar `useMemo` y `useCallback` apropiadamente
  - Evitar re-renders innecesarios
  - Code splitting para cargar animación bajo demanda

### 7.2 Gestión de Memoria
- **WebAudio**:
  - Cerrar `AudioContext` cuando no se usa
  - Liberar buffers de audio viejos
  - Desconectar nodos correctamente
  - Detener tracks de MediaStream

- **Canvas**:
  - Limpiar event listeners en unmount
  - Cancelar `requestAnimationFrame` pendientes
  - Liberar referencias a recursos grandes

### 7.3 Adaptación Móvil (Preparación)
- **Consideraciones actuales para webapp**:
  - Touch events para interacción
  - Reducir partículas en móviles (600-800 vs 1200)
  - Ajustar sensibilidad táctil
  - Optimizar para pantallas pequeñas
  - Considerar orientación (portrait/landscape)

- **Preparación para app nativa**:
  - Estructura modular para portabilidad
  - Abstraer APIs web (WebAudio, Web Speech)
  - Documentar interfaces necesarias para nativo
  - Mantener lógica de negocio separada de presentación

---

## Fase 8: Componente VoiceHome (Pantalla Principal)

### 8.1 Layout de VoiceHome
```
┌─────────────────────────────────────┐
│                                     │
│         [Logo/Title - opcional]     │
│                                     │
│     ╔═══════════════════════════╗   │
│     ║                           ║   │
│     ║   ANIMACIÓN DE VOZ        ║   │
│     ║   (Canvas fullscreen)     ║   │
│     ║                           ║   │
│     ╚═══════════════════════════╝   │
│                                     │
│  [●] Escuchar    [Voz: Mujer ▼]    │
│                                     │
│  [Estado: "Escuchando..."]          │
│                                     │
└─────────────────────────────────────┘
```

- **Características**:
  - Animación ocupa mayoría del espacio vertical
  - Controls mínimos, no intrusivos
  - Centrado y responsive
  - Switch “Voz / Texto” (modo conversación)
  - **Auto-switch** a chat cuando `isDeterministicFlowActive === true` (checkout/pago)

### 8.2 Estados de la Pantalla
1. **Estado Inicial** (`idle`):
   - Animación sutil, respiración lenta
   - Botón "Toca para hablar" o similar
   - Selector de voz visible

2. **Escuchando** (`listening`):
   - Animación reactiva al input del usuario
   - Indicador de grabación
   - Botón para detener/cancelar

3. **Procesando** (`thinking`):
   - Animación de "carga" (pulsación rítmica)
   - Texto "Pensando..." o similar
   - Sin input del usuario

4. **Hablando** (`speaking`):
   - Animación reactiva al output del agente
   - Opción de interrumpir/saltar
   - Transcripción en tiempo real (opcional)

---

## Fase 9: Integración con Chat Existente

### 9.1 Refactorización de App.tsx
- **Cambios necesarios**:
  - Implementar un **UI state** simple (sin router obligatorio) para alternar:
    - `interactionMode: 'voice' | 'text'`
    - `uiSurface: 'voiceHome' | 'chat'` (derivado + forzado por checkout)
  - Compartir estado entre ambas superficies (mensajes, `contextId`, `taskId`, loading)
  - Sincronizar conversaciones de voz con historial de chat
  - Opción de cambiar entre modo voz y modo texto

#### Reglas de transición (críticas para no interferir con checkout)
- `uiSurface = 'chat'` si `isDeterministicFlowActive === true` (forzado).
- `uiSurface = interactionMode === 'voice' ? 'voiceHome' : 'chat'` cuando `isDeterministicFlowActive === false`.
- La animación **nunca** debe overlayear el área donde se renderiza el chat (ni capturar eventos) cuando `uiSurface === 'chat'`.

#### Pseudológica (orientativa)
```ts
const isDeterministicFlowActive = messages.some(m =>
  !!m.checkout || !!m.paymentMethods || !!m.paymentInstrument
);

const uiSurface =
  isDeterministicFlowActive ? 'chat' : (interactionMode === 'voice' ? 'voiceHome' : 'chat');
```

### 9.2 Persistencia de Conversación
- **Objetivo**: Mantener coherencia entre voz y texto
- **Implementación**:
  - Todas las interacciones de voz se convierten a mensajes de texto
  - Se agregan al historial de `messages` existente
  - Marcador visual (mínimo) para distinguir mensajes originados por voz vs texto (sin afectar UCP)
  - **No almacenar audio** en esta etapa (evitar complejidad y no interferir con checkout)

### 9.3 Transiciones
- **Navegación**:
  - Botón sutil para cambiar entre VoiceHome y Chat tradicional
  - Animación de transición suave (slide/fade)
  - Mantener contexto de conversación activo
  - Estado de la animación debe pausarse/reanudarse correctamente

---

## Fase 10: Testing y Refinamiento

### 10.1 Testing Funcional
- **Audio**:
  - Test en diferentes navegadores (Chrome, Firefox, Safari)
  - Verificar permisos de micrófono
  - Test de TTS (y de streaming solo si aplica)
  - Latencia de audio
  - Calidad de transcripción

- **Visualización**:
  - Verificar animación en diferentes resoluciones
  - Test en modo light y dark
  - Verificar no hay pixelación
  - Suavidad de animación (60 FPS objetivo)

### 10.2 Testing de Performance
- **Métricas**:
  - FPS en animación (objetivo: 60 FPS constante)
  - Uso de CPU (< 30% en idle, < 60% durante voz)
  - Uso de memoria (no debe crecer indefinidamente)
  - Tiempo de carga inicial

- **Dispositivos**:
  - Desktop (varios navegadores)
  - Tablets
  - Móviles de gama media/alta

### 10.3 Refinamiento UX
- **Feedback de usuarios**:
  - Claridad de estados
  - Facilidad de uso
  - Intuitividad de controles
  - Atractivo visual

- **Ajustes**:
  - Tuning de parámetros de animación (sensibilidad, tamaño)
  - Ajuste de colores para mejor visibilidad
  - Mejora de transiciones
  - Optimización de feedback visual/auditivo

---

## Fase 11: Documentación

### 11.1 Documentación de Código
- **Archivos a crear/actualizar**:
  - README específico para el sistema de voz
  - JSDoc en componentes y funciones clave
  - Comentarios en secciones complejas (física de partículas, WebAudio)
  - Diagrama de arquitectura de componentes

### 11.2 Guía de Personalización
- **Para desarrolladores**:
  - Cómo cambiar colores programáticamente
  - Cómo ajustar parámetros de animación
  - Cómo extender con nuevas fuentes de audio
  - Cómo integrar con otros servicios TTS

### 11.3 Guía de Usuario
- **Para usuarios finales**:
  - Cómo usar la interfaz de voz
  - Cómo personalizar colores
  - Cómo cambiar entre voces
  - Solución de problemas comunes

---

## Consideraciones Técnicas Importantes

### WebAudio API
- Crear un único `AudioContext` global para toda la app
- Reusar `AnalyserNode` cuando sea posible
- Desconectar correctamente para evitar memory leaks
- Manejar estados suspended/closed del contexto

### Voz/TTS y streaming (realidad del cliente actual)
- El `chat-client` actual **no consume streaming** desde `/api` (usa `response.json()`), así que el plan debe partir de **TTS no-streaming** con posibilidad de evolucionar.
- Streaming de audio solo se implementa si se extiende el backend/proxy para enviar chunks (SSE/WS) o si se agrega un endpoint específico de voz.
- La animación puede igualmente “streamear” **visualmente** (estados `thinking/speaking`) aunque el audio llegue completo, sin cambiar A2A/UCP.

### Compatibilidad
- Web Speech API no está disponible en todos los navegadores
- Plan de fallback para navegadores sin soporte
- Progressive enhancement approach
- Detección de features y mensajes claros al usuario

### Seguridad y Permisos
- Solicitar permisos de micrófono de forma clara y oportuna
- Explicar por qué se necesitan
- Manejar rechazos gracefully
- HTTPS requerido para APIs de media

---

## Entregables por Fase

### Entregables Inmediatos (Fase 2-3)
1. Componente `VoiceAnimation.tsx` funcional
2. Hook `useAudioAnalyzer` con tests básicos
3. Sistema de partículas optimizado
4. Integración básica con WebAudio API

### Entregables Corto Plazo (Fase 4-6)
1. Integración con Google ADK streaming
2. Sistema de voz bidireccional funcional
3. Selector de voz (hombre/mujer) implementado
4. Sistema de theming completo (light/dark)
5. Personalización de colores

### Entregables Mediano Plazo (Fase 7-9)
1. Optimizaciones de performance aplicadas
2. Componente VoiceHome completo
3. Integración con chat existente
4. Transiciones y navegación

### Entregables Final (Fase 10-11)
1. Testing completo y bugs resueltos
2. Documentación completa
3. App lista para deploy
4. Base preparada para transición a móvil nativo

---

## Métricas de Éxito

1. **Performance**:
   - Animación a 60 FPS constante en desktop
   - Animación a 30+ FPS en móvil
   - Latencia de audio < 200ms

2. **Calidad Visual**:
   - Sin pixelación visible en pantallas Retina
   - Animación visible y atractiva en ambos modos (light/dark)
   - Transiciones suaves y naturales

3. **Funcionalidad**:
   - Reconocimiento de voz funcional (accuracy > 90%)
   - TTS con streaming funcional
   - Selector de voz operativo
   - Personalización de colores funcional

4. **UX**:
   - Interface intuitiva (usuario puede usar sin instrucciones)
   - Feedback claro de estados
   - Sin delays perceptibles
   - Experiencia fluida y moderna

---

## Notas Finales

- **Prioridad**: Focalizarse en la animación y el diseño primero, luego integración de voz
- **No incluir**: Controls de prueba como carga de archivos, solo la animación en producción
- **Modularidad**: Todos los componentes deben ser reutilizables y testeables
- **Preparación móvil**: Aunque es webapp ahora, mantener código preparado para transición
- **Iteración**: Este es un plan vivo, ajustar según descubrimientos durante implementación

---

**Próximos pasos recomendados**: Comenzar con Fase 2 (crear estructura de componentes) y Fase 3.1 (componente VoiceAnimation básico) para tener una base visual funcionando rápidamente, luego iterar agregando funcionalidad de audio progresivamente.
