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
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StepProgress } from './StepProgress';
import { NavigationButtons } from '../Onboarding/NavigationButtons';
import { BusinessInfoStep } from './steps/BusinessInfoStep';
import { LegalInfoStep } from './steps/LegalInfoStep';
import { CatalogStep } from './steps/CatalogStep';
import { DeliveryStep } from './steps/DeliveryStep';
import { UCPConfigStep } from './steps/UCPConfigStep';
import { ReviewStep } from './steps/ReviewStep';
import { businessService } from '../../services/business.service';
import { ErrorMessage } from '../Shared/ErrorMessage';
import { SuccessMessage } from '../Shared/SuccessMessage';

interface BusinessRegisterProps {
  onNavigateBack: () => void;
}

const STEP_LABELS = [
  'Info Básica',
  'Documentación',
  'Catálogo',
  'Entrega',
  'UCP',
  'Revisión',
];

export function BusinessRegister({ onNavigateBack }: BusinessRegisterProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [canProceed, setCanProceed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [businessData, setBusinessData] = useState<any>({
    basicInfo: null,
    legalInfo: null,
    catalog: null,
    delivery: null,
    ucpConfig: null,
  });

  const handleNext = async () => {
    if (currentStep === 6) {
      // Submit final
      try {
        setLoading(true);
        setError(null);
        await businessService.createBusiness({
          ...businessData.basicInfo,
          ...businessData.legalInfo,
          ...businessData.delivery,
        });
        setSuccess(true);
      } catch (err) {
        console.error('Error creating business:', err);
        setError('Error al registrar el negocio. Por favor intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
      setCanProceed(false);
      
      // Scroll al inicio del contenedor
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    
    // Scroll al inicio del contenedor
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepDataChange = (stepName: string, data: any) => {
    setBusinessData((prev: any) => ({
      ...prev,
      [stepName]: data,
    }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            data={businessData.basicInfo}
            onChange={(data) => handleStepDataChange('basicInfo', data)}
            onValidationChange={setCanProceed}
          />
        );
      case 2:
        return (
          <LegalInfoStep
            data={businessData.legalInfo}
            onChange={(data) => handleStepDataChange('legalInfo', data)}
            onValidationChange={setCanProceed}
          />
        );
      case 3:
        return (
          <CatalogStep
            data={businessData.catalog}
            onChange={(data) => handleStepDataChange('catalog', data)}
            onValidationChange={setCanProceed}
          />
        );
      case 4:
        return (
          <DeliveryStep
            data={businessData.delivery}
            onChange={(data) => handleStepDataChange('delivery', data)}
            onValidationChange={setCanProceed}
          />
        );
      case 5:
        return (
          <UCPConfigStep
            businessData={businessData}
            onValidationChange={setCanProceed}
          />
        );
      case 6:
        return (
          <ReviewStep
            businessData={businessData}
            onValidationChange={setCanProceed}
          />
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--jandi-light-blue)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--jandi-dark-blue)' }}>
            ¡Solicitud enviada!
          </h2>
          <p className="mb-6" style={{ color: 'var(--jandi-gray)' }}>
            Tu solicitud está en revisión. Te contactaremos pronto por email con los próximos pasos.
          </p>
          <button
            onClick={onNavigateBack}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--jandi-light-blue)' }}
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--jandi-background)' }}>
      {/* Header */}
      <header className="py-4 px-6 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: 'var(--jandi-dark-blue)' }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver
          </button>
          <img src="/images/JANDI_LOGO_COMPLETO.png" alt="JANDI" className="h-8" />
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepProgress currentStep={currentStep} totalSteps={6} stepLabels={STEP_LABELS} />

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Steps Container */}
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
            totalSteps={6}
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
