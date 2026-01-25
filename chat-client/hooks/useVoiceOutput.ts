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
import { useEffect, useState, useCallback, useRef } from 'react';
import type { VoiceGender, VoiceConfig } from '../components/VoiceAnimation/types';

export function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    // Cargar configuración guardada
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('voice-config');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Ignorar error
        }
      }
    }
    return {
      gender: 'female' as VoiceGender,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    };
  });

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
    
    // Crear elemento de audio para conectar al analyser
    if (typeof window !== 'undefined') {
      audioElementRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('voice-config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    // PRIORIDAD 1: Voces en español (España, México, Argentina, etc.)
    const spanishVoices = voices.filter(v => 
      v.lang.startsWith('es-') || v.lang === 'es'
    );
    
    if (spanishVoices.length === 0) {
      console.warn('No se encontraron voces en español, usando fallback');
      return voices[0] || null;
    }
    
    // Ordenar por calidad: local > remoto
    spanishVoices.sort((a, b) => {
      if (a.localService && !b.localService) return -1;
      if (!a.localService && b.localService) return 1;
      return 0;
    });
    
    if (voiceConfig.gender === 'female') {
      // Voces femeninas en español (nombres comunes en diferentes regiones)
      const femaleVoice = spanishVoices.find(v => {
        const name = v.name.toLowerCase();
        return (
          name.includes('female') ||
          name.includes('mónica') ||
          name.includes('paulina') ||
          name.includes('lucia') ||
          name.includes('lucía') ||
          name.includes('elena') ||
          name.includes('paloma') ||
          name.includes('isabela') ||
          name.includes('carmen')
        );
      });
      if (femaleVoice) return femaleVoice;
    } else {
      // Voces masculinas en español
      const maleVoice = spanishVoices.find(v => {
        const name = v.name.toLowerCase();
        return (
          name.includes('male') ||
          name.includes('diego') ||
          name.includes('jorge') ||
          name.includes('carlos') ||
          name.includes('juan') ||
          name.includes('andrés') ||
          name.includes('andres') ||
          name.includes('miguel')
        );
      });
      if (maleVoice) return maleVoice;
    }
    
    // Fallback: primera voz en español disponible
    return spanishVoices[0];
  }, [voiceConfig.gender]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported || !text.trim()) {
        reject(new Error('TTS no soportado o texto vacío'));
        return;
      }

      // Cancelar cualquier síntesis en curso
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getVoice();
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang; // Usar el idioma de la voz seleccionada
      } else {
        utterance.lang = 'es-ES'; // Español de España por defecto
      }
      
      // Ajustar parámetros para español (más natural)
      utterance.rate = voiceConfig.rate || 0.95; // Ligeramente más lento para claridad
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

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const updateVoiceConfig = useCallback((config: Partial<VoiceConfig>) => {
    setVoiceConfig(prev => ({ ...prev, ...config }));
  }, []);

  const getAudioNode = useCallback((): MediaElementAudioSourceNode | null => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!sourceNodeRef.current && audioElementRef.current) {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(
        audioElementRef.current
      );
    }

    return sourceNodeRef.current;
  }, []);

  return {
    isSpeaking,
    isSupported,
    voiceConfig,
    speak,
    stop,
    updateVoiceConfig,
    getAudioNode,
  };
}
