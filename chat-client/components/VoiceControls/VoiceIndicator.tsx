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
import type { AgentState } from '../VoiceAnimation/types';

interface VoiceIndicatorProps {
  state: AgentState;
  interimTranscript?: string;
  className?: string;
}

const stateConfig = {
  idle: {
    label: 'Toca para hablar',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: '🎤',
  },
  listening: {
    label: 'Escuchando...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: '🎙️',
  },
  thinking: {
    label: 'Pensando...',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    icon: '💭',
  },
  speaking: {
    label: 'Hablando...',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: '🔊',
  },
  error: {
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: '⚠️',
  },
};

export default function VoiceIndicator({
  state,
  interimTranscript,
  className = '',
}: VoiceIndicatorProps) {
  const config = stateConfig[state];

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`px-4 py-2 rounded-full ${config.bgColor} ${config.color} font-medium text-sm flex items-center gap-2`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {state === 'listening' && (
          <span className="flex gap-1">
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
          </span>
        )}
      </div>
      {interimTranscript && (
        <div className="text-sm text-gray-600 dark:text-gray-400 italic max-w-md text-center">
          "{interimTranscript}"
        </div>
      )}
    </div>
  );
}
