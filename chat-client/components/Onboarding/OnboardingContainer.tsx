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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { StepIndicator } from './StepIndicator';
import { NavigationButtons } from './NavigationButtons';
import { Step1Identity } from './Step1Identity';
import { Step2Shopping } from './Step2Shopping';
import { Step3Preferences } from './Step3Preferences';
import { Step4Autonomy } from './Step4Autonomy';
import { Step5Payment } from './Step5Payment';
import { ErrorMessage } from '../Shared/ErrorMessage';

export function OnboardingContainer() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const {
    onboardingData,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    updateStepData,
    submitOnboarding,
    loading,
    error,
  } = useOnboarding(user?.id || null);

  const [canProceed, setCanProceed] = useState(false);

  const handleNext = async () => {
    if (currentStep === 5) {
      // Último paso: enviar datos
      try {
        await submitOnboarding();
        navigate('/chat');
      } catch (err) {
        console.error('Error submitting onboarding:', err);
      }
    } else {
      goToNextStep();
      setCanProceed(false); // Reset para el próximo paso
    }
  };

  const handlePrevious = () => {
    goToPreviousStep();
  };

  const handleStepDataChange = (data: any) => {
    updateStepData(currentStep, data);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Identity
            data={onboardingData.data.identity}
            onChange={handleStepDataChange}
            onValidationChange={setCanProceed}
          />
        );
      case 2:
        return (
          <Step2Shopping
            data={onboardingData.data.shopping}
            onChange={handleStepDataChange}
            onValidationChange={setCanProceed}
          />
        );
      case 3:
        return (
          <Step3Preferences
            data={onboardingData.data.preferences}
            onChange={handleStepDataChange}
            onValidationChange={setCanProceed}
          />
        );
      case 4:
        return (
          <Step4Autonomy
            data={onboardingData.data.autonomy}
            onChange={handleStepDataChange}
            onValidationChange={setCanProceed}
          />
        );
      case 5:
        return (
          <Step5Payment
            data={onboardingData.data.payment}
            onChange={handleStepDataChange}
            onValidationChange={setCanProceed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--jandi-background)' }}>
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/JANDI_LOGO_COMPLETO.png"
            alt="JANDI"
            className="h-16 mx-auto"
          />
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={5} />

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Steps Container with Conditional Rendering */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Contenedor del step actual con animación de fade */}
          <div 
            key={currentStep}
            className="animate-fadeIn"
          >
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <NavigationButtons
            currentStep={currentStep}
            totalSteps={5}
            onPrevious={handlePrevious}
            onNext={handleNext}
            canProceed={canProceed}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
