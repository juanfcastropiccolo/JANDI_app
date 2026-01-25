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
import { useState, useCallback, useEffect, useMemo } from 'react';
import PlasmaOrb from '../PlasmaOrb/PlasmaOrb';
import { LIGHT_PLASMA_THEME, DARK_PLASMA_THEME } from '../PlasmaOrb/types';
import { usePlasmaAnimation } from '../PlasmaOrb/usePlasmaAnimation';
import VoiceSelector from '../VoiceControls/VoiceSelector';
import VoiceIndicator from '../VoiceControls/VoiceIndicator';
import ColorCustomizer from '../VoiceControls/ColorCustomizer';
import PillNav from '../PillNavigation/PillNav';
import { NAV_ITEMS } from '../PillNavigation/NavItems';
import { useTheme } from '../../hooks/useTheme';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';
import { useAudioAnalyzer } from '../VoiceAnimation/useAudioAnalyzer';
import type { AgentState } from '../VoiceAnimation/types';

interface VoiceHomeProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  lastBotMessage?: string;
  onSwitchToChat: () => void;
}

export default function VoiceHome({
  onSendMessage,
  isLoading,
  lastBotMessage,
  onSwitchToChat,
}: VoiceHomeProps) {
  const { mode, toggleMode } = useTheme();
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [audioSource, setAudioSource] = useState<AudioNode | null>(null);
  const [activeNav, setActiveNav] = useState('voice');
  const [showSettings, setShowSettings] = useState(false);

  // Obtener tema de plasma según modo
  const plasmaTheme = mode === 'dark' ? DARK_PLASMA_THEME : LIGHT_PLASMA_THEME;

  // Hook de animación que ajusta parámetros según estado
  const animationParams = usePlasmaAnimation(agentState);

  // Hook de análisis de audio
  const { audioFeatures } = useAudioAnalyzer(audioSource);

  const handleTranscript = useCallback(
    (text: string) => {
      if (text.trim()) {
        onSendMessage(text);
        setAgentState('thinking');
      }
    },
    [onSendMessage]
  );

  const {
    isListening,
    isSupported: voiceInputSupported,
    error: voiceInputError,
    interimTranscript,
    startListening,
    stopListening,
  } = useVoiceInput(handleTranscript);

  const {
    isSpeaking,
    isSupported: voiceOutputSupported,
    voiceConfig,
    speak,
    stop: stopSpeaking,
    updateVoiceConfig,
  } = useVoiceOutput();

  // Actualizar estado del agente
  useEffect(() => {
    if (isListening) {
      setAgentState('listening');
    } else if (isLoading) {
      setAgentState('thinking');
    } else if (isSpeaking) {
      setAgentState('speaking');
    } else if (voiceInputError) {
      setAgentState('error');
    } else {
      setAgentState('idle');
    }
  }, [isListening, isLoading, isSpeaking, voiceInputError]);

  // Hablar cuando llegue un nuevo mensaje del bot
  useEffect(() => {
    if (lastBotMessage && voiceOutputSupported && !isLoading) {
      speak(lastBotMessage).catch((err) => {
        console.error('Error speaking:', err);
      });
    }
  }, [lastBotMessage, voiceOutputSupported, isLoading, speak]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  const handleNavClick = (id: string) => {
    if (id === 'chat') {
      onSwitchToChat();
    } else if (id === 'settings') {
      setShowSettings(!showSettings);
    }
    setActiveNav(id);
  };

  const backgroundColor = mode === 'dark' ? 'rgb(5, 7, 10)' : 'rgb(255, 255, 255)';

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor }}>
      {/* Header con PillNav */}
      <div className="flex items-center justify-center p-4">
        <PillNav items={NAV_ITEMS} activeId={activeNav} onItemClick={handleNavClick} />
      </div>

      {/* Panel de settings (overlay) */}
      {showSettings && (
        <div className="absolute top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Configuración</h3>
          <div className="flex flex-col gap-4">
            <VoiceSelector
              selectedGender={voiceConfig.gender}
              onGenderChange={(gender) => updateVoiceConfig({ gender })}
            />
            <button
              type="button"
              onClick={toggleMode}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2 justify-center"
            >
              {mode === 'dark' ? '☀️' : '🌙'}
              <span>{mode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Orbe de Plasma */}
      <div className="flex-1 relative cursor-pointer" onClick={handleMicClick}>
        <PlasmaOrb
          audioFeatures={audioFeatures}
          theme={plasmaTheme}
          isActive={agentState !== 'idle'}
          animationSpeed={animationParams.animationSpeed}
          noiseScale={animationParams.noiseScale}
          glowIntensity={animationParams.glowIntensity}
        />

        {/* Widget de instrucción - solo visible en estado idle */}
        {agentState === 'idle' && voiceInputSupported && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative">
              {/* Nube de idea apuntando a la animación */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border-2 border-purple-200 dark:border-purple-600 relative animate-bounce">
                <p className="text-gray-800 dark:text-gray-200 font-medium text-lg whitespace-nowrap">
                  💡 Habla para comenzar
                </p>
                {/* Puntita de la nube apuntando hacia abajo */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/90 dark:border-t-gray-800/90"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de estado - más discreto */}
        {agentState !== 'idle' && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <VoiceIndicator state={agentState} interimTranscript={interimTranscript} />
          </div>
        )}

        {/* Botón de stop solo cuando está hablando el agente */}
        {isSpeaking && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStopSpeaking();
              }}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl bg-gray-500 hover:bg-gray-600 text-white transition-all"
            >
              🔇
            </button>
          </div>
        )}

        {/* Error message */}
        {voiceInputError && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="text-red-600 dark:text-red-400 text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              Error: {voiceInputError}
            </div>
          </div>
        )}

        {/* Mensaje si no hay soporte */}
        {!voiceInputSupported && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="text-red-600 dark:text-red-400 text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              Reconocimiento de voz no soportado en este navegador
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
