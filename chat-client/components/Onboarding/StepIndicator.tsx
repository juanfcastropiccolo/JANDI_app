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

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <React.Fragment key={stepNumber}>
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all duration-300"
              style={{
                backgroundColor: isCompleted || isCurrent ? 'var(--jandi-light-blue)' : 'var(--jandi-gray-light)',
                color: isCompleted || isCurrent ? 'white' : 'var(--jandi-gray)',
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {isCompleted ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                stepNumber
              )}
            </div>
            {stepNumber < totalSteps && (
              <div
                className="h-0.5 w-8 transition-all duration-300"
                style={{
                  backgroundColor: isCompleted ? 'var(--jandi-light-blue)' : 'var(--jandi-gray-light)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
