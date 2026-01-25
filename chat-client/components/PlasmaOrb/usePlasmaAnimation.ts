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
import { useState, useEffect } from 'react';
import type { AgentState } from '../VoiceAnimation/types';

interface AnimationParams {
  noiseScale: number;
  animationSpeed: number;
  glowIntensity: number;
}

export function usePlasmaAnimation(agentState: AgentState) {
  const [animationParams, setAnimationParams] = useState<AnimationParams>({
    noiseScale: 2.0,
    animationSpeed: 0.5,
    glowIntensity: 0.8,
  });

  useEffect(() => {
    switch (agentState) {
      case 'idle':
        setAnimationParams({
          noiseScale: 2.0,
          animationSpeed: 0.5,
          glowIntensity: 0.8,
        });
        break;
      case 'listening':
        setAnimationParams({
          noiseScale: 3.0,
          animationSpeed: 1.5,
          glowIntensity: 1.5,
        });
        break;
      case 'thinking':
        setAnimationParams({
          noiseScale: 2.5,
          animationSpeed: 2.0,
          glowIntensity: 1.2,
        });
        break;
      case 'speaking':
        setAnimationParams({
          noiseScale: 3.5,
          animationSpeed: 1.8,
          glowIntensity: 2.0,
        });
        break;
      case 'error':
        setAnimationParams({
          noiseScale: 1.5,
          animationSpeed: 0.3,
          glowIntensity: 0.5,
        });
        break;
    }
  }, [agentState]);

  return animationParams;
}
