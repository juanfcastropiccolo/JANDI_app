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

import { useState, useCallback, useEffect } from 'react';
import { onboardingService } from '../services/onboarding.service';
import type { OnboardingData } from '../types/onboarding.types';

const STORAGE_KEY = 'jandi_onboarding_data';

const initialOnboardingData: OnboardingData = {
  step: 1,
  totalSteps: 6,
  data: {
    identity: null,
    shopping: null,
    preferences: null,
    autonomy: null,
    payment: null,
    accessCode: null,
  },
};

export function useOnboarding(userId: string | null) {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Intentar cargar desde localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialOnboardingData;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData));
  }, [onboardingData]);

  const goToNextStep = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      step: Math.min(prev.step + 1, prev.totalSteps),
    }));
  }, []);

  const goToPreviousStep = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      step: Math.max(prev.step - 1, 1),
    }));
  }, []);

  const updateStepData = useCallback((step: number, data: Partial<OnboardingData['data']>) => {
    setOnboardingData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        ...data,
      },
    }));
  }, []);

  const submitOnboarding = useCallback(async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      await onboardingService.saveOnboardingData(userId, onboardingData);
      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar datos del onboarding';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, onboardingData]);

  return {
    onboardingData,
    currentStep: onboardingData.step,
    goToNextStep,
    goToPreviousStep,
    updateStepData,
    submitOnboarding,
    loading,
    error,
  };
}
