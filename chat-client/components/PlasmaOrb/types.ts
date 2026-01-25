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

export interface PlasmaTheme {
  baseColor: string;
  accentColor: string;
  glowIntensity: number;
  noiseScale: number;
  animationSpeed: number;
  audioSensitivity: number;
}

export const LIGHT_PLASMA_THEME: PlasmaTheme = {
  baseColor: '#4A90E2',
  accentColor: '#E74C3C',
  glowIntensity: 1.2,
  noiseScale: 2.0,
  animationSpeed: 0.8,
  audioSensitivity: 1.5,
};

export const DARK_PLASMA_THEME: PlasmaTheme = {
  baseColor: '#8B5CF6',
  accentColor: '#3B82F6',
  glowIntensity: 1.8,
  noiseScale: 2.5,
  animationSpeed: 1.0,
  audioSensitivity: 2.0,
};
