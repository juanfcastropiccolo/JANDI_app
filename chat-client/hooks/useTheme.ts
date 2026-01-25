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
import { useEffect, useState } from 'react';
import type { ColorTheme } from '../components/VoiceAnimation/types';

type ThemeMode = 'light' | 'dark';

const LIGHT_THEME: ColorTheme = {
  primary: 'rgb(100, 180, 255)',
  secondary: 'rgb(140, 220, 255)',
  background: 'rgb(255, 255, 255)',
};

const DARK_THEME: ColorTheme = {
  primary: 'rgb(220, 245, 255)',
  secondary: 'rgb(120, 210, 255)',
  background: 'rgb(5, 7, 10)',
};

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Detectar preferencia del sistema
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme-mode');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [customColors, setCustomColors] = useState<ColorTheme | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom-colors');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    if (customColors) {
      localStorage.setItem('custom-colors', JSON.stringify(customColors));
    } else {
      localStorage.removeItem('custom-colors');
    }
  }, [customColors]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = customColors || (mode === 'dark' ? DARK_THEME : LIGHT_THEME);

  return {
    mode,
    colors,
    toggleMode,
    setCustomColors,
    isDark: mode === 'dark',
  };
}
