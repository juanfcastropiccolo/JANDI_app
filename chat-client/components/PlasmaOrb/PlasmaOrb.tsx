/*
 * Copyright 2026 UCP Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlasmaShader } from './PlasmaShader';
import type { AudioFeatures } from '../VoiceAnimation/types';
import type { PlasmaTheme } from './types';

interface PlasmaOrb3DProps {
  audioFeatures: AudioFeatures;
  theme: PlasmaTheme;
  isActive: boolean;
  animationSpeed: number;
  noiseScale: number;
  glowIntensity: number;
}

function PlasmaOrb3D({
  audioFeatures,
  theme,
  isActive,
  animationSpeed,
  noiseScale,
  glowIntensity,
}: PlasmaOrb3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudioBass: { value: 0 },
      uAudioMid: { value: 0 },
      uAudioTreble: { value: 0 },
      uAudioEnergy: { value: 0 },
      uBaseColor: { value: new THREE.Color(theme.baseColor) },
      uAccentColor: { value: new THREE.Color(theme.accentColor) },
      uGlowIntensity: { value: glowIntensity },
      uNoiseScale: { value: noiseScale },
      uAnimationSpeed: { value: animationSpeed },
    }),
    [theme.baseColor, theme.accentColor, glowIntensity, noiseScale, animationSpeed]
  );

  // Animación por frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Actualizar tiempo
    uniforms.uTime.value += delta;

    // Actualizar audio features con interpolación suave
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
        0.15
      );
    } else {
      // Fade out suave cuando no está activo
      uniforms.uAudioBass.value *= 0.95;
      uniforms.uAudioMid.value *= 0.95;
      uniforms.uAudioTreble.value *= 0.95;
      uniforms.uAudioEnergy.value *= 0.95;
    }

    // Rotación sutil
    meshRef.current.rotation.y += delta * 0.1;
    meshRef.current.rotation.x += delta * 0.05;

    // Escala reactiva al audio
    const targetScale = 1 + audioFeatures.energy * 0.2 * theme.audioSensitivity;
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    meshRef.current.scale.set(newScale, newScale, newScale);
  });

  // Detectar si es móvil para reducir detalle
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const sphereDetail: [number, number] = isMobile ? [64, 64] : [128, 128];

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, ...sphereDetail]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={PlasmaShader.vertex}
        fragmentShader={PlasmaShader.fragment}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface PlasmaOrbProps {
  audioFeatures: AudioFeatures;
  theme: PlasmaTheme;
  isActive: boolean;
  animationSpeed: number;
  noiseScale: number;
  glowIntensity: number;
}

export default function PlasmaOrb(props: PlasmaOrbProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <PlasmaOrb3D {...props} />
      </Canvas>
    </div>
  );
}
