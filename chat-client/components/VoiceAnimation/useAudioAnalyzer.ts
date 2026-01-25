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
import { useEffect, useRef, useState } from 'react';
import type { AudioFeatures } from './types';

const FFT_SIZE = 1024;
const SMOOTHING = 0.85;

export function useAudioAnalyzer(audioSource: AudioNode | null) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    rms: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    energy: 0,
  });

  useEffect(() => {
    // Crear AudioContext y Analyser si no existen
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = SMOOTHING;
    }

    const audioContext = audioContextRef.current;
    const analyser = analyserRef.current;

    // Conectar fuente de audio si existe
    if (audioSource && audioContext.state !== 'closed') {
      try {
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
      } catch (error) {
        console.warn('Error connecting audio source:', error);
      }
    }

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    let animationFrameId: number;

    const analyze = () => {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      // Calcular RMS (volumen)
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / timeData.length);

      // Calcular bandas de frecuencia
      const getBand = (from: number, to: number) => {
        let s = 0;
        let c = 0;
        for (let i = from; i < to && i < freqData.length; i++) {
          s += freqData[i];
          c++;
        }
        return c ? s / c / 255 : 0;
      };

      const bass = getBand(0, 18);
      const mid = getBand(18, 90);
      const treble = getBand(90, 220);

      const energy = Math.min(1, (rms * 1.8 + bass * 0.9 + mid * 0.5) / 2.2);

      setAudioFeatures({ rms, bass, mid, treble, energy });

      animationFrameId = requestAnimationFrame(analyze);
    };

    if (audioContext.state === 'running') {
      analyze();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioSource && analyser) {
        try {
          audioSource.disconnect(analyser);
        } catch (error) {
          // Ya desconectado
        }
      }
    };
  }, [audioSource]);

  const resumeAudioContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  const closeAudioContext = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };

  return {
    audioFeatures,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    resumeAudioContext,
    closeAudioContext,
  };
}
