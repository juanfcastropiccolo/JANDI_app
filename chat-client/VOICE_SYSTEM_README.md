# Sistema de Voz - Chat Client

## Descripción General

Este sistema agrega capacidades de voz al chat-client A2A/UCP, permitiendo conversaciones naturales con el agente mediante voz, con una animación de nube de partículas 3D que responde al audio en tiempo real.

## Características Principales

### 🎤 Entrada de Voz
- Reconocimiento de voz mediante Web Speech API
- Transcripción en tiempo real (español)
- Indicador visual de estado (escuchando/procesando)
- Manejo de permisos de micrófono

### 🔊 Salida de Voz (TTS)
- Síntesis de voz con Web Speech Synthesis API
- Selector de género de voz (masculino/femenino)
- Reproducción automática de respuestas del agente
- Control de velocidad, tono y volumen

### 🌈 Animación Visual
- Sistema de partículas 3D (1200 partículas en desktop, 700 en móvil)
- Respuesta en tiempo real a audio (frecuencias bass/mid/treble)
- Rotación 3D suave con proyección en perspectiva
- Optimizada para evitar pixelación (DPR limitado a 2)

### 🎨 Personalización
- Modo claro/oscuro con detección automática
- Selector de color personalizado
- Temas predefinidos optimizados
- Persistencia de preferencias en localStorage

## Arquitectura

### Componentes Principales

```
components/
├── VoiceAnimation/
│   ├── VoiceAnimation.tsx      # Componente principal de animación
│   ├── ParticleCloud.ts        # Sistema de partículas 3D
│   ├── useAudioAnalyzer.ts    # Hook para WebAudio API
│   └── types.ts                # Tipos TypeScript
├── VoiceControls/
│   ├── VoiceSelector.tsx       # Selector de voz (hombre/mujer)
│   ├── VoiceIndicator.tsx      # Indicador de estado
│   └── ColorCustomizer.tsx     # Personalizador de colores
└── VoiceHome/
    └── VoiceHome.tsx           # Pantalla home con animación

hooks/
├── useTheme.ts                 # Dark/light mode y colores
├── useVoiceInput.ts            # Reconocimiento de voz
└── useVoiceOutput.ts           # Síntesis de voz (TTS)
```

### Estados del Agente

- **idle**: En reposo, esperando interacción
- **listening**: Escuchando al usuario
- **thinking**: Procesando (esperando respuesta del agente)
- **speaking**: Reproduciendo respuesta del agente
- **error**: Estado de error

## Integración con A2A/UCP

### Detección de Flujo Determinístico

El sistema detecta automáticamente cuando el flujo de compra/pago está activo y **fuerza la vista de chat** para mostrar los componentes determinísticos:

```typescript
const isDeterministicFlowActive = messages.some(
  (m) => !!m.checkout || !!m.paymentMethods || !!m.paymentInstrument
);
```

### Reglas de Transición

- Si `isDeterministicFlowActive === true`:
  - **Forzar vista Chat** (aunque el usuario esté en modo voz)
  - **Pausar animación** para no interferir
  - **Detener captura de micrófono** durante confirmaciones
  
- Si `isDeterministicFlowActive === false`:
  - Permitir modo voz con animación
  - Permitir switch manual entre voz y texto

### Compatibilidad

- ✅ No modifica el contrato A2A/UCP existente
- ✅ Mantiene flujo de checkout/payment intacto
- ✅ Componentes determinísticos siempre visibles y clickeables
- ✅ Sin overlays durante flujo de compra

## Uso

### Modo Voz (Home)

1. Al abrir la app, se muestra la pantalla de voz por defecto
2. Presionar el botón de micrófono para hablar
3. El agente responde con voz y la animación reacciona
4. Cambiar a modo texto con el botón "← Chat"

### Modo Chat

1. Desde modo voz, presionar "← Chat"
2. Interfaz tradicional de chat con input de texto
3. Volver a modo voz con el botón "🎤 Modo Voz" (si no hay checkout activo)

### Personalización

- **Cambiar voz**: Usar el selector "Voz: Mujer/Hombre"
- **Cambiar color**: Click en botón "Color" y elegir color primario
- **Dark mode**: Click en botón ☀️/🌙

## Compatibilidad de Navegadores

### Reconocimiento de Voz (Web Speech API)
- ✅ Chrome/Edge (completo)
- ✅ Safari (limitado)
- ❌ Firefox (no soportado nativamente)

### Síntesis de Voz (Web Speech Synthesis)
- ✅ Chrome/Edge
- ✅ Safari
- ✅ Firefox

### Animación (Canvas + WebAudio)
- ✅ Todos los navegadores modernos

## Optimizaciones

### Performance
- DPR limitado a 2 para balance calidad/rendimiento
- Reducción de partículas en móviles (700 vs 1200)
- RequestAnimationFrame optimizado
- Throttling en eventos de resize

### Memoria
- Limpieza de AudioContext al desmontar
- Cancelación de animationFrames pendientes
- Desconexión correcta de nodos de audio

## Desarrollo Futuro

### Posibles Mejoras
- [ ] Streaming de audio desde backend (si se implementa)
- [ ] Soporte para más idiomas
- [ ] Grabación y reproducción de mensajes de voz
- [ ] Detección automática de actividad de voz (VAD)
- [ ] Gestos táctiles para control de animación

### Transición a App Móvil
- Código modular preparado para portabilidad
- APIs web abstraídas (WebAudio, Web Speech)
- Lógica de negocio separada de presentación
- Documentación de interfaces necesarias

## Troubleshooting

### La animación no se mueve
- Verificar que el micrófono tenga permisos
- Verificar que el audio esté reproduciéndose
- Revisar consola por errores de WebAudio

### No se escucha la voz del agente
- Verificar volumen del sistema
- Verificar que el navegador soporte Web Speech Synthesis
- Revisar configuración de voz en el selector

### El reconocimiento de voz no funciona
- Verificar que el navegador soporte Web Speech API
- Verificar permisos de micrófono
- Probar en Chrome/Edge si está en Firefox

## Licencia

Copyright 2026 UCP Authors - Apache License 2.0
