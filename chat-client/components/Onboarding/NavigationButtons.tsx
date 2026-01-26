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

import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canProceed: boolean;
  loading?: boolean;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canProceed,
  loading = false,
}: NavigationButtonsProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between gap-4 mt-8">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={isFirstStep || loading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-0 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: 'var(--jandi-white)',
          color: 'var(--jandi-dark-blue)',
          border: '2px solid var(--jandi-light-blue)',
        }}
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Anterior
      </button>

      {/* Next/Finish Button */}
      <button
        onClick={() => {
          console.log('[NavigationButtons] Button clicked, canProceed:', canProceed, 'loading:', loading);
          onNext();
        }}
        disabled={!canProceed || loading}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: 'var(--jandi-light-blue)',
        }}
      >
        {loading ? (
          <LoadingSpinner size="sm" color="white" />
        ) : (
          <>
            {isLastStep ? 'Finalizar' : 'Siguiente'}
            {!isLastStep && <ArrowRightIcon className="w-5 h-5" />}
          </>
        )}
      </button>
    </div>
  );
}
