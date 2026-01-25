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
import { CheckIcon } from '@heroicons/react/24/solid';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepProgress({ currentStep, totalSteps, stepLabels }: StepProgressProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div key={index} className="flex flex-col items-center" style={{ width: `${100 / totalSteps}%` }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 mb-2"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? 'var(--jandi-light-blue)' : 'var(--jandi-gray-light)',
                    color: isCompleted || isCurrent ? 'white' : 'var(--jandi-gray)',
                    transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {isCompleted ? <CheckIcon className="w-5 h-5" /> : stepNumber}
                </div>
                <span
                  className="text-xs text-center font-medium hidden md:block"
                  style={{
                    color: isCompleted || isCurrent ? 'var(--jandi-dark-blue)' : 'var(--jandi-gray)',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Connection Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 -z-10" style={{ backgroundColor: 'var(--jandi-gray-light)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              backgroundColor: 'var(--jandi-light-blue)',
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Step Label (Mobile) */}
      <div className="md:hidden text-center mt-4">
        <span className="text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
          Paso {currentStep} de {totalSteps}: {stepLabels[currentStep - 1]}
        </span>
      </div>
    </div>
  );
}
