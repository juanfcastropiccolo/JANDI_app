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
import { useState } from 'react';
import type { ColorTheme } from '../VoiceAnimation/types';

interface ColorCustomizerProps {
  currentColors: ColorTheme;
  onColorsChange: (colors: ColorTheme | null) => void;
  className?: string;
}

export default function ColorCustomizer({
  currentColors,
  onColorsChange,
  className = '',
}: ColorCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#64b4ff');

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    
    // Generar paleta complementaria
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const newColors: ColorTheme = {
      primary: `rgb(${r}, ${g}, ${b})`,
      secondary: `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 40)})`,
      background: currentColors.background,
    };

    onColorsChange(newColors);
  };

  const handleReset = () => {
    onColorsChange(null);
    setPrimaryColor('#64b4ff');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex items-center gap-2"
      >
        <span
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: primaryColor }}
        />
        <span>Color</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Color primario
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Restablecer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
