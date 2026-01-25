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
import type { VoiceGender } from '../VoiceAnimation/types';

interface VoiceSelectorProps {
  selectedGender: VoiceGender;
  onGenderChange: (gender: VoiceGender) => void;
  className?: string;
}

export default function VoiceSelector({
  selectedGender,
  onGenderChange,
  className = '',
}: VoiceSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Voz:
      </label>
      <select
        value={selectedGender}
        onChange={(e) => onGenderChange(e.target.value as VoiceGender)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        <option value="female">Mujer</option>
        <option value="male">Hombre</option>
      </select>
    </div>
  );
}
