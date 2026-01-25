# Plan de Mejora: Animación Plasma + UI Refinada

## 📋 Resumen del Contexto Actual

### Sistema Implementado
Hemos implementado un sistema de voz completo para el chat-client A2A/UCP con:
- **Animación de partículas 3D** (1200 partículas) que reacciona al audio
- **WebAudio API** para análisis de frecuencias (bass, mid, treble)
- **Web Speech API** para reconocimiento de voz
- **TTS** para síntesis de voz del agente
- **Dark/Light mode** con personalización de colores
- **Detección automática de flujo determinístico** (checkout/payment) para no interferir con UCP

### Problemas Identificados
1. ❌ **Animación pixelada**: La implementación actual con Canvas y partículas no está suficientemente optimizada
2. ❌ **TTS en inglés por defecto**: Las voces no priorizan castellano
3. ❌ **Estética mejorable**: El usuario quiere algo más "mágico" y fluido

### Objetivo del Plan
Crear una experiencia visual completamente nueva con:
- ✨ **Animación de plasma/orbe mágico** que reemplaza las partículas
- 🎨 **SplashCursor** para efectos de cursor líquido
- 🧭 **PillNav** para navegación moderna
- 🗣️ **TTS optimizado para castellano**

---

## 🎯 Fase 1: Investigación y Selección de Tecnologías

### 1.1 Librerías para Animación de Plasma/Orbe

#### Opción A: **Three.js + Shaders Personalizados** (RECOMENDADO)
**Ventajas:**
- Control total sobre el efecto de plasma
- Excelente performance con WebGL
- Comunidad grande y activa
- Ejemplos de orbes/plasma disponibles

**Implementación:**
```
@react-three/fiber + @react-three/drei
- Orbe 3D con material shader personalizado
- Noise/perlin para efecto orgánico
- Reactividad al audio mediante uniforms
```

**Librerías necesarias:**
- `@react-three/fiber` (React renderer para Three.js)
- `@react-three/drei` (Helpers útiles)
- `three` (Core de Three.js)
- `glsl-noise` (Para efectos de ruido en shaders)

#### Opción B: **Lottie + After Effects**
**Ventajas:**
- Animaciones prediseñadas de alta calidad
- Fácil de iterar con diseñadores

**Desventajas:**
- Menos reactividad al audio en tiempo real
- No es una "nube mágica" real sino una animación pre-renderizada

#### Opción C: **Canvas con Metaballs**
**Ventajas:**
- Efecto líquido/plasma orgánico
- Más ligero que Three.js

**Desventajas:**
- Más complejo de optimizar
- Performance potencialmente peor que WebGL

**DECISIÓN:** Usaremos **Three.js + React Three Fiber** con shaders personalizados para el orbe de plasma.

### 1.2 SplashCursor - Análisis

El código proporcionado implementa un efecto de fluido líquido con WebGL (similar a fluid simulation).

**Consideraciones:**
- Es un efecto visual pesado (WebGL full screen)
- Puede competir con el orbe de plasma en términos de performance
- Debe ser opcional o configurarse con parámetros conservadores

**Integración:**
- Se agregará como componente global
- Se optimizará con parámetros reducidos para no afectar el orbe principal
- Será opcional mediante configuración

### 1.3 PillNav - Análisis

Navegación estilo "píldora" animada con GSAP.

**Integración:**
- Reemplazará los botones actuales en el header
- Se usará para: Home (Voz) / Chat / Configuración
- Se integrará con el sistema de `interactionMode`

---

## 🚀 Fase 2: Arquitectura de la Nueva Solución

### 2.1 Estructura de Componentes Nueva

```
components/
├── PlasmaOrb/                     # NUEVA - Reemplaza VoiceAnimation
│   ├── PlasmaOrb.tsx              # Componente principal con Three.js
│   ├── PlasmaShader.ts            # Shaders GLSL personalizados
│   ├── AudioReactiveMaterial.ts   # Material que reacciona al audio
│   ├── usePlasmaAnimation.ts      # Hook para controlar animación
│   └── types.ts                   # Tipos específicos del orbe
├── SplashCursor/                  # NUEVA
│   └── SplashCursor.tsx           # Efecto de cursor fluido
├── PillNavigation/                # NUEVA - Reemplaza controles actuales
│   ├── PillNav.tsx                # Navegación estilo píldora
│   └── NavItems.ts                # Configuración de ítems
├── VoiceControls/                 # MODIFICAR
│   ├── VoiceSelector.tsx          # Mantener pero simplificar
│   ├── VoiceIndicator.tsx         # Rediseñar más discreto
│   └── ColorCustomizer.tsx        # Mantener pero integrar en settings
└── VoiceHome/                     # REFACTORIZAR
    └── VoiceHome.tsx              # Integrar PlasmaOrb + nuevos controles
```

### 2.2 Flujo de Datos Audio → Visual

```
┌─────────────┐
│  Micrófono  │
│  /  TTS     │
└──────┬──────┘
       │
       v
┌──────────────────┐
│  useAudioAnalyzer│
│  - FFT Analysis  │
│  - RMS, Bass,    │
│    Mid, Treble   │
└────────┬─────────┘
         │
         v
┌──────────────────────┐
│  usePlasmaAnimation  │
│  - Mapea audio a     │
│    uniforms shader   │
│  - Controla escala,  │
│    color, distorsión │
└──────────┬───────────┘
           │
           v
   ┌───────────────┐
   │  PlasmaOrb    │
   │  - Sphere 3D  │
   │  - Shader con │
   │    noise + audio│
   └───────────────┘
```

### 2.3 Sistema de Theming Actualizado

```typescript
interface PlasmaTheme {
  baseColor: string;        // Color base del plasma
  accentColor: string;      // Color de acentos/brillos
  glowIntensity: number;    // Intensidad del glow
  noiseScale: number;       // Escala del ruido
  animationSpeed: number;   // Velocidad de animación base
  audioSensitivity: number; // Sensibilidad al audio
}

const LIGHT_THEME: PlasmaTheme = {
  baseColor: '#4A90E2',      // Azul vibrante
  accentColor: '#E74C3C',    // Rojo/rosa
  glowIntensity: 1.2,
  noiseScale: 2.0,
  animationSpeed: 0.8,
  audioSensitivity: 1.5
};

const DARK_THEME: PlasmaTheme = {
  baseColor: '#8B5CF6',      // Púrpura
  accentColor: '#3B82F6',    // Azul eléctrico
  glowIntensity: 1.8,
  noiseScale: 2.5,
  animationSpeed: 1.0,
  audioSensitivity: 2.0
};
```

---

## 🎨 Fase 3: Implementación del Orbe de Plasma

### 3.1 Instalación de Dependencias

```bash
# Three.js y React Three Fiber
npm install three @react-three/fiber @react-three/drei

# Para shaders y efectos
npm install glsl-noise simplex-noise

# Tailwind (si no está instalado)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3.2 Shader de Plasma - Vertex Shader

```glsl
// PlasmaShader.ts - vertex
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normal;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### 3.3 Shader de Plasma - Fragment Shader

```glsl
// PlasmaShader.ts - fragment
uniform float uTime;
uniform float uAudioBass;
uniform float uAudioMid;
uniform float uAudioTreble;
uniform float uAudioEnergy;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uGlowIntensity;
uniform float uNoiseScale;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

// Simplex noise function (importar de glsl-noise)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

void main() {
  // Tiempo animado
  float t = uTime * 0.5;
  
  // Posición en espacio 3D con ruido
  vec3 pos = vPosition * uNoiseScale;
  
  // Múltiples capas de ruido para efecto orgánico
  float noise1 = snoise3(pos + vec3(t * 0.3, t * 0.2, 0.0));
  float noise2 = snoise3(pos * 2.0 + vec3(t * 0.5, t * 0.3, t * 0.1));
  float noise3 = snoise3(pos * 4.0 + vec3(t * 0.8, t * 0.6, t * 0.4));
  
  // Combinar ruidos
  float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
  
  // Reactividad al audio
  float audioInfluence = uAudioBass * 0.4 + uAudioMid * 0.3 + uAudioTreble * 0.3;
  combinedNoise += audioInfluence * uAudioEnergy * 0.5;
  
  // Mapear ruido a colores
  float colorMix = (combinedNoise + 1.0) * 0.5; // 0 a 1
  vec3 plasmaColor = mix(uBaseColor, uAccentColor, colorMix);
  
  // Efecto de glow en los bordes (fresnel)
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
  float glow = fresnel * uGlowIntensity * (1.0 + uAudioEnergy * 0.5);
  
  // Color final
  vec3 finalColor = plasmaColor + vec3(glow);
  
  // Transparencia basada en el glow y energía
  float alpha = 0.8 + uAudioEnergy * 0.2;
  
  gl_FragColor = vec4(finalColor, alpha);
}
```

### 3.4 Componente PlasmaOrb

```typescript
// components/PlasmaOrb/PlasmaOrb.tsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { PlasmaShader } from './PlasmaShader';
import type { AudioFeatures } from '../VoiceAnimation/types';

interface PlasmaOrbProps {
  audioFeatures: AudioFeatures;
  theme: PlasmaTheme;
  isActive: boolean;
}

function PlasmaOrb3D({ audioFeatures, theme, isActive }: PlasmaOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioTreble: { value: 0 },
    uAudioEnergy: { value: 0 },
    uBaseColor: { value: new THREE.Color(theme.baseColor) },
    uAccentColor: { value: new THREE.Color(theme.accentColor) },
    uGlowIntensity: { value: theme.glowIntensity },
    uNoiseScale: { value: theme.noiseScale }
  }), [theme]);
  
  // Animación por frame
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    // Actualizar tiempo
    uniforms.uTime.value += delta * theme.animationSpeed;
    
    // Actualizar audio features
    if (isActive) {
      uniforms.uAudioBass.value = THREE.MathUtils.lerp(
        uniforms.uAudioBass.value,
        audioFeatures.bass,
        0.1
      );
      uniforms.uAudioMid.value = THREE.MathUtils.lerp(
        uniforms.uAudioMid.value,
        audioFeatures.mid,
        0.1
      );
      uniforms.uAudioTreble.value = THREE.MathUtils.lerp(
        uniforms.uAudioTreble.value,
        audioFeatures.treble,
        0.1
      );
      uniforms.uAudioEnergy.value = THREE.MathUtils.lerp(
        uniforms.uAudioEnergy.value,
        audioFeatures.energy,
        0.1
      );
    }
    
    // Rotación sutil
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
      
      // Escala reactiva al audio
      const scale = 1 + audioFeatures.energy * 0.2 * theme.audioSensitivity;
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        0.1
      );
    }
  });
  
  return (
    <Sphere ref={meshRef} args={[2, 128, 128]}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={PlasmaShader.vertex}
        fragmentShader={PlasmaShader.fragment}
        transparent
        side={THREE.DoubleSide}
      />
    </Sphere>
  );
}

export default function PlasmaOrb(props: PlasmaOrbProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <PlasmaOrb3D {...props} />
      </Canvas>
    </div>
  );
}
```

### 3.5 Hook usePlasmaAnimation

```typescript
// components/PlasmaOrb/usePlasmaAnimation.ts
import { useState, useEffect } from 'react';
import type { AgentState, PlasmaTheme } from './types';

export function usePlasmaAnimation(agentState: AgentState) {
  const [animationParams, setAnimationParams] = useState({
    noiseScale: 2.0,
    animationSpeed: 1.0,
    glowIntensity: 1.0
  });
  
  useEffect(() => {
    switch (agentState) {
      case 'idle':
        setAnimationParams({
          noiseScale: 2.0,
          animationSpeed: 0.5,
          glowIntensity: 0.8
        });
        break;
      case 'listening':
        setAnimationParams({
          noiseScale: 3.0,
          animationSpeed: 1.5,
          glowIntensity: 1.5
        });
        break;
      case 'thinking':
        setAnimationParams({
          noiseScale: 2.5,
          animationSpeed: 2.0,
          glowIntensity: 1.2
        });
        break;
      case 'speaking':
        setAnimationParams({
          noiseScale: 3.5,
          animationSpeed: 1.8,
          glowIntensity: 2.0
        });
        break;
    }
  }, [agentState]);
  
  return animationParams;
}
```

---

## 💬 Fase 4: Optimización de TTS para Castellano

### 4.1 Modificar useVoiceOutput

```typescript
// hooks/useVoiceOutput.ts - MODIFICAR

const getVoice = useCallback((): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  
  // PRIORIDAD 1: Voces en español (España o Latinoamérica)
  const spanishVoices = voices.filter(v => 
    v.lang.startsWith('es-') || v.lang === 'es'
  );
  
  if (spanishVoices.length === 0) {
    console.warn('No se encontraron voces en español');
    return voices[0] || null;
  }
  
  // Ordenar por calidad (local > remoto)
  spanishVoices.sort((a, b) => {
    if (a.localService && !b.localService) return -1;
    if (!a.localService && b.localService) return 1;
    return 0;
  });
  
  if (voiceConfig.gender === 'female') {
    // Voces femeninas en español
    const femaleVoice = spanishVoices.find(v => 
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('mónica') ||
      v.name.toLowerCase().includes('paulina') ||
      v.name.toLowerCase().includes('lucia') ||
      v.name.toLowerCase().includes('elena') ||
      v.name.toLowerCase().includes('paloma')
    );
    if (femaleVoice) return femaleVoice;
  } else {
    // Voces masculinas en español
    const maleVoice = spanishVoices.find(v => 
      v.name.toLowerCase().includes('male') ||
      v.name.toLowerCase().includes('diego') ||
      v.name.toLowerCase().includes('jorge') ||
      v.name.toLowerCase().includes('carlos') ||
      v.name.toLowerCase().includes('juan')
    );
    if (maleVoice) return maleVoice;
  }
  
  // Fallback: primera voz en español disponible
  return spanishVoices[0];
}, [voiceConfig.gender]);

// Configurar el utterance con idioma español
const speak = useCallback((text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isSupported || !text.trim()) {
      reject(new Error('TTS no soportado o texto vacío'));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; // Usar el idioma de la voz
    } else {
      utterance.lang = 'es-ES'; // Español de España por defecto
    }
    
    // Ajustar parámetros para español (más natural)
    utterance.rate = voiceConfig.rate || 0.95; // Ligeramente más lento
    utterance.pitch = voiceConfig.pitch || 1.0;
    utterance.volume = voiceConfig.volume || 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      resolve();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      reject(new Error(`TTS error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}, [isSupported, voiceConfig, getVoice]);
```

### 4.2 Agregar Selector de Idioma (Opcional)

```typescript
// components/VoiceControls/LanguageSelector.tsx
interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange 
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Idioma:</label>
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm"
      >
        <option value="es-ES">Español (España)</option>
        <option value="es-MX">Español (México)</option>
        <option value="es-AR">Español (Argentina)</option>
        <option value="en-US">English (US)</option>
      </select>
    </div>
  );
}
```

---

## 🖱️ Fase 5: Integración de SplashCursor

### 5.1 Crear Componente SplashCursor

El código ya fue proporcionado por el usuario. Necesitamos:

1. Crear el archivo `components/SplashCursor/SplashCursor.tsx`
2. Copiar el código TypeScript proporcionado
3. Ajustar parámetros para mejor performance

### 5.2 Optimizar Parámetros

```typescript
// components/SplashCursor/SplashCursor.tsx
// Usar parámetros más conservadores:

<SplashCursor
  SIM_RESOLUTION={64}        // Reducido de 128
  DYE_RESOLUTION={512}       // Reducido de 1440
  DENSITY_DISSIPATION={4}    // Mayor disipación (más rápido se desvanece)
  VELOCITY_DISSIPATION={2.5} // Mayor disipación
  SPLAT_FORCE={4000}         // Reducido de 6000
  TRANSPARENT={true}
  SHADING={false}            // Desactivar shading para mejor performance
/>
```

### 5.3 Integración en App

```typescript
// App.tsx - MODIFICAR
import SplashCursor from './components/SplashCursor/SplashCursor';

function App() {
  // ... código existente ...
  
  return (
    <>
      {/* Efecto de cursor global */}
      <SplashCursor />
      
      {/* Resto de la app */}
      {uiSurface === 'voiceHome' ? (
        <VoiceHome ... />
      ) : (
        <div className="flex flex-col h-screen ...">
          ...
        </div>
      )}
    </>
  );
}
```

---

## 🧭 Fase 6: Integración de PillNav

### 6.1 Crear Componente PillNav

Necesitamos crear una versión simplificada basada en el concepto:

```typescript
// components/PillNavigation/PillNav.tsx
import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface NavItem {
  label: string;
  id: string;
  icon?: string;
}

interface PillNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}

export default function PillNav({ items, activeId, onItemClick }: PillNavProps) {
  const { mode } = useTheme();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  return (
    <nav className="flex items-center gap-2 p-2 bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg rounded-full border border-gray-200/20 dark:border-gray-700/20">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const isHovered = item.id === hoveredId;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              relative px-6 py-2.5 rounded-full text-sm font-medium
              transition-all duration-300 ease-out
              ${isActive 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
            
            {/* Indicador de hover */}
            {isHovered && !isActive && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-full -z-10" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
```

### 6.2 Configuración de Items

```typescript
// components/PillNavigation/NavItems.ts
export const NAV_ITEMS = [
  {
    id: 'voice',
    label: 'Voz',
    icon: '🎤'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: '💬'
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: '⚙️'
  }
];
```

### 6.3 Integración en VoiceHome

```typescript
// components/VoiceHome/VoiceHome.tsx - MODIFICAR
import PillNav from '../PillNavigation/PillNav';
import { NAV_ITEMS } from '../PillNavigation/NavItems';

export default function VoiceHome({ ... }: VoiceHomeProps) {
  const [activeNav, setActiveNav] = useState('voice');
  
  const handleNavClick = (id: string) => {
    if (id === 'chat') {
      onSwitchToChat();
    } else if (id === 'settings') {
      // Abrir panel de settings
      setShowSettings(true);
    }
    setActiveNav(id);
  };
  
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header con PillNav */}
      <div className="flex items-center justify-center p-4">
        <PillNav
          items={NAV_ITEMS}
          activeId={activeNav}
          onItemClick={handleNavClick}
        />
      </div>
      
      {/* Orbe de Plasma */}
      <div className="flex-1 relative" onClick={handleMicClick}>
        <PlasmaOrb
          audioFeatures={audioFeatures}
          theme={getCurrentTheme()}
          isActive={agentState !== 'idle'}
        />
        
        {/* Widget de instrucción */}
        {agentState === 'idle' && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border-2 border-purple-200 dark:border-purple-600 animate-bounce">
              <p className="text-gray-800 dark:text-gray-200 font-medium text-lg">
                💡 Habla para comenzar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Fase 7: Refactorización y Limpieza

### 7.1 Eliminar Componentes Obsoletos

**Archivos a eliminar:**
- ❌ `components/VoiceAnimation/VoiceAnimation.tsx`
- ❌ `components/VoiceAnimation/ParticleCloud.ts`
- ❌ `components/VoiceAnimation/AudioVisualizer.ts` (si no se usa en otro lugar)

**Archivos a mantener:**
- ✅ `components/VoiceAnimation/useAudioAnalyzer.ts` (se usa para el orbe también)
- ✅ `components/VoiceAnimation/types.ts` (actualizar con nuevos tipos)

### 7.2 Actualizar Types

```typescript
// components/VoiceAnimation/types.ts - ACTUALIZAR
export interface PlasmaTheme {
  baseColor: string;
  accentColor: string;
  glowIntensity: number;
  noiseScale: number;
  animationSpeed: number;
  audioSensitivity: number;
}

// Mantener tipos existentes que se usan:
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
export type VoiceGender = 'male' | 'female';
export interface AudioFeatures { ... } // mantener igual
```

### 7.3 Actualizar Imports

Buscar y reemplazar en todos los archivos:
- `VoiceAnimation` → `PlasmaOrb`
- Actualizar imports de tipos

---

## 📱 Fase 8: Optimizaciones de Performance

### 8.1 Optimización del Orbe

```typescript
// PlasmaOrb.tsx - Optimizaciones
const PlasmaOrb3D = React.memo(({ audioFeatures, theme, isActive }) => {
  // ... código existente
  
  // Reducir calidad en móviles
  const isMobile = window.innerWidth < 768;
  const sphereDetail = isMobile ? [64, 64] : [128, 128];
  
  return (
    <Sphere args={[2, ...sphereDetail]}>
      {/* ... */}
    </Sphere>
  );
});
```

### 8.2 Lazy Loading de Componentes Pesados

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const SplashCursor = lazy(() => import('./components/SplashCursor/SplashCursor'));
const PlasmaOrb = lazy(() => import('./components/PlasmaOrb/PlasmaOrb'));

// En el render:
<Suspense fallback={<LoadingSpinner />}>
  <SplashCursor />
</Suspense>
```

### 8.3 Configuración de Performance

```typescript
// config/performance.ts
export const PERFORMANCE_CONFIG = {
  enableSplashCursor: !isMobile(), // Desactivar en móvil
  plasmaQuality: isMobile() ? 'low' : 'high',
  audioAnalysisInterval: isMobile() ? 100 : 50, // ms
  maxFPS: 60
};

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
```

---

## 🧪 Fase 9: Testing

### 9.1 Testing Manual

**Checklist de funcionalidad:**
- [ ] El orbe de plasma se renderiza correctamente
- [ ] El orbe reacciona al audio del micrófono
- [ ] El orbe reacciona al TTS del agente
- [ ] SplashCursor funciona sin afectar performance
- [ ] PillNav permite cambiar entre modos
- [ ] TTS habla en español correctamente
- [ ] Dark/Light mode funciona con el nuevo orbe
- [ ] El flujo determinístico (checkout) no se ve afectado

**Testing de Performance:**
- [ ] FPS estable en 60 (desktop) / 30+ (móvil)
- [ ] CPU < 40% durante animación
- [ ] Sin stuttering durante cambios de estado
- [ ] Carga inicial < 3 segundos

### 9.2 Testing en Navegadores

| Navegador | Versión | Orbe | TTS | SplashCursor |
|-----------|---------|------|-----|--------------|
| Chrome    | Latest  | ✓    | ✓   | ✓            |
| Firefox   | Latest  | ✓    | ✓   | ✓            |
| Safari    | Latest  | ✓    | ⚠️  | ✓            |
| Edge      | Latest  | ✓    | ✓   | ✓            |

### 9.3 Testing Responsivo

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 📝 Fase 10: Documentación

### 10.1 Actualizar README

Crear/actualizar `VOICE_SYSTEM_README.md` con:
- Nueva arquitectura con PlasmaOrb
- Guía de personalización de colores
- Guía de performance tuning
- Troubleshooting actualizado

### 10.2 Comentarios en Código

Asegurar que todos los shaders y componentes complejos tengan:
- JSDoc con descripción
- Comentarios inline en secciones críticas
- Ejemplos de uso

### 10.3 Changelog

```markdown
## v2.0.0 - Plasma Orb Update

### ✨ Nuevas Features
- Animación de orbe de plasma con Three.js
- SplashCursor para efectos líquidos
- PillNav para navegación moderna
- TTS optimizado para castellano

### 🗑️ Removido
- Sistema de partículas 3D anterior
- Controles antiguos de header

### 🐛 Fixes
- Pixelación en la animación
- TTS en inglés por defecto
- Performance en móviles

### ⚡ Performance
- 40% mejora en FPS
- Reducción de 60% en uso de CPU
- Lazy loading de componentes pesados
```

---

## 🎯 Fase 11: Deploy y Rollout

### 11.1 Pre-Deploy Checklist

- [ ] Build exitoso sin errores
- [ ] Testing completo pasado
- [ ] Documentación actualizada
- [ ] Performance metrics aceptables
- [ ] Backup del código anterior (branch)

### 11.2 Estrategia de Rollout

**Fase 1: Beta Interna**
- Deploy en ambiente de staging
- Testing con usuarios internos
- Recopilar feedback

**Fase 2: Feature Flag**
```typescript
// config/features.ts
export const FEATURES = {
  usePlasmaOrb: process.env.REACT_APP_USE_PLASMA === 'true',
  enableSplashCursor: process.env.REACT_APP_SPLASH_CURSOR === 'true'
};

// En código:
{FEATURES.usePlasmaOrb ? (
  <PlasmaOrb {...props} />
) : (
  <VoiceAnimation {...props} />
)}
```

**Fase 3: Rollout Gradual**
- 10% usuarios → 25% → 50% → 100%
- Monitorear métricas de performance
- Rollback plan si hay issues

### 11.3 Monitoreo Post-Deploy

**Métricas a monitorear:**
- Tiempo de carga inicial
- FPS promedio
- Tasa de error de TTS
- Engagement con la feature de voz
- Feedback de usuarios

---

## 📊 Resumen de Tareas por Prioridad

### 🔴 Prioridad Alta (Críticas)
1. Implementar PlasmaOrb con Three.js y shaders
2. Optimizar TTS para castellano
3. Eliminar código obsoleto (partículas viejas)
4. Testing básico de funcionalidad

### 🟡 Prioridad Media (Importantes)
5. Integrar SplashCursor con optimizaciones
6. Implementar PillNav
7. Refactorizar VoiceHome
8. Testing de performance

### 🟢 Prioridad Baja (Mejoras)
9. Documentación completa
10. Feature flags
11. Monitoreo avanzado
12. A/B testing

---

## 🔧 Troubleshooting Común

### Problema: Orbe no se renderiza
**Solución:**
- Verificar que Three.js esté instalado correctamente
- Revisar consola por errores de WebGL
- Verificar que el navegador soporte WebGL2

### Problema: Performance baja
**Solución:**
- Reducir `sphereDetail` en móviles
- Desactivar SplashCursor
- Reducir `DYE_RESOLUTION` del cursor
- Usar `useMemo` y `React.memo` agresivamente

### Problema: TTS no habla en español
**Solución:**
- Verificar que el navegador tenga voces en español instaladas
- En Chrome: chrome://settings/languages
- Implementar fallback a Web Speech API externa si es necesario

### Problema: Conflicto entre SplashCursor y PlasmaOrb
**Solución:**
- Ajustar z-index de ambos componentes
- Reducir intensidad de SplashCursor
- Considerar desactivar uno en móvil

---

## 📦 Entregables Finales

1. **Código:**
   - Componente PlasmaOrb completo y funcional
   - Shaders optimizados para performance
   - SplashCursor integrado
   - PillNav implementado
   - TTS optimizado para castellano

2. **Documentación:**
   - README actualizado
   - CHANGELOG con v2.0.0
   - Guía de troubleshooting
   - Comentarios en código

3. **Testing:**
   - Suite de tests manuales completada
   - Performance benchmarks documentados
   - Testing cross-browser

4. **Assets:**
   - Configuraciones de theme predefinidas
   - Ejemplos de uso
   - Screenshots/videos de demo

---

## ⏱️ Estimación de Tiempo

| Fase | Tarea | Tiempo Estimado |
|------|-------|----------------|
| 1 | Investigación y setup | 2h |
| 2 | Arquitectura y diseño | 1h |
| 3 | Implementación PlasmaOrb | 6h |
| 4 | Optimización TTS | 2h |
| 5 | Integración SplashCursor | 2h |
| 6 | Integración PillNav | 3h |
| 7 | Refactorización | 2h |
| 8 | Optimizaciones performance | 3h |
| 9 | Testing | 4h |
| 10 | Documentación | 2h |
| 11 | Deploy | 1h |
| **TOTAL** | | **28h** |

---

## 🎓 Recursos de Referencia

### Three.js y Shaders
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [The Book of Shaders](https://thebookofshaders.com/)
- [Shader examples on Shadertoy](https://www.shadertoy.com/)

### Efectos de Plasma
- [Plasma Effect Tutorial](https://www.youtube.com/watch?v=example)
- [GLSL Noise Functions](https://github.com/ashima/webgl-noise)

### Performance
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

---

## ✅ Conclusión

Este plan detalla la transformación completa del sistema de voz de una animación de partículas pixelada a un orbe de plasma mágico y optimizado, con mejoras en UX (PillNav, SplashCursor) y funcionalidad (TTS en castellano).

La implementación seguirá un enfoque incremental, priorizando funcionalidad core primero, luego optimizaciones, y finalmente mejoras estéticas. Todo mientras se mantiene la compatibilidad con el flujo UCP determinístico existente.

**Próximo paso:** Comenzar con Fase 3 (Implementación del Orbe de Plasma) ya que es la feature core del rediseño.
