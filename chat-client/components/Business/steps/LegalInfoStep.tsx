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

import React, { useEffect, useState } from 'react';
import { DocumentUpload } from '../DocumentUpload';

interface LegalInfoData {
  legalEntityType: 'individual' | 'company';
  taxId: string;
  documents: {
    dni?: File;
    cuit?: File;
    contract?: File;
  };
}

interface LegalInfoStepProps {
  data: LegalInfoData | null;
  onChange: (data: LegalInfoData) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function LegalInfoStep({ data, onChange, onValidationChange }: LegalInfoStepProps) {
  const [formData, setFormData] = useState<LegalInfoData>(
    data || {
      legalEntityType: 'individual',
      taxId: '',
      documents: {},
    }
  );

  useEffect(() => {
    const isValid =
      !!formData.taxId &&
      (formData.legalEntityType === 'individual' ? !!formData.documents.dni : !!formData.documents.cuit);

    onValidationChange(isValid);
    onChange(formData);
  }, [formData, onValidationChange, onChange]);

  const handleChange = (field: keyof LegalInfoData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDocumentSelect = (docType: string, file: File) => {
    setFormData({
      ...formData,
      documents: { ...formData.documents, [docType]: file },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          Información legal
        </h2>
        <p className="text-sm" style={{ color: 'var(--jandi-gray)' }}>
          Necesitamos validar la identidad de tu negocio
        </p>
      </div>

      {/* Legal Entity Type */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--jandi-dark-blue)' }}>
          Tipo de entidad *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleChange('legalEntityType', 'individual')}
            className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: formData.legalEntityType === 'individual' ? 'var(--jandi-light-blue)' : 'white',
              borderColor: formData.legalEntityType === 'individual' ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
              color: formData.legalEntityType === 'individual' ? 'white' : 'var(--jandi-dark-blue)',
            }}
          >
            <div className="font-medium">Persona Física</div>
            <div className="text-sm opacity-80 mt-1">DNI</div>
          </button>
          <button
            onClick={() => handleChange('legalEntityType', 'company')}
            className="p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: formData.legalEntityType === 'company' ? 'var(--jandi-light-blue)' : 'white',
              borderColor: formData.legalEntityType === 'company' ? 'var(--jandi-medium-blue)' : 'var(--jandi-gray-light)',
              color: formData.legalEntityType === 'company' ? 'white' : 'var(--jandi-dark-blue)',
            }}
          >
            <div className="font-medium">Persona Jurídica</div>
            <div className="text-sm opacity-80 mt-1">CUIT</div>
          </button>
        </div>
      </div>

      {/* Tax ID */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
          {formData.legalEntityType === 'individual' ? 'DNI' : 'CUIT'} *
        </label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(e) => handleChange('taxId', e.target.value)}
          placeholder={formData.legalEntityType === 'individual' ? '12345678' : '20-12345678-9'}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:border-[var(--jandi-light-blue)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        />
      </div>

      {/* Document Uploads */}
      {formData.legalEntityType === 'individual' ? (
        <DocumentUpload
          label="DNI (ambas caras)"
          documentType="dni"
          onFileSelect={(file) => handleDocumentSelect('dni', file)}
          required
        />
      ) : (
        <>
          <DocumentUpload
            label="Constancia de CUIT"
            documentType="cuit"
            onFileSelect={(file) => handleDocumentSelect('cuit', file)}
            required
          />
          <DocumentUpload
            label="Contrato social o estatuto"
            documentType="contract"
            onFileSelect={(file) => handleDocumentSelect('contract', file)}
          />
        </>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--jandi-background)' }}>
        <div className="text-2xl">📄</div>
        <div className="text-sm" style={{ color: 'var(--jandi-dark-blue)' }}>
          <p className="font-medium mb-1">Documentos requeridos</p>
          <p className="opacity-70">
            Los documentos deben ser legibles y no superar 8MB. Formatos aceptados: JPG, PNG, PDF.
          </p>
        </div>
      </div>
    </div>
  );
}
