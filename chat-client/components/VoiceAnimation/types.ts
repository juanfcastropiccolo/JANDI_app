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

export interface ColorTheme {
  primary: string;
  secondary: string;
  background: string;
}

export interface AudioFeatures {
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  energy: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  seed: number;
}

export interface VoiceAnimationProps {
  audioSource: AudioNode | null;
  colors: ColorTheme;
  size?: 'small' | 'medium' | 'large';
  sensitivity?: number;
  isActive: boolean;
  isPaused?: boolean;
}

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type VoiceGender = 'male' | 'female';

export interface VoiceConfig {
  gender: VoiceGender;
  rate?: number;
  pitch?: number;
  volume?: number;
}
