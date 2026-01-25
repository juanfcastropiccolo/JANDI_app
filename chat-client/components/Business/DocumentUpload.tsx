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
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

interface DocumentUploadProps {
  label: string;
  documentType: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  required?: boolean;
}

export function DocumentUpload({
  label,
  documentType,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 8,
  onFileSelect,
  required = false,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`El archivo no debe superar ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--jandi-dark-blue)' }}>
        {label} {required && '*'}
      </label>

      {!file ? (
        <label
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-[var(--jandi-light-blue)] hover:bg-[var(--jandi-background)]"
          style={{ borderColor: 'var(--jandi-gray-light)' }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <CloudArrowUpIcon className="w-10 h-10 mb-2" style={{ color: 'var(--jandi-gray)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
              Click para subir archivo
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--jandi-gray)' }}>
              {accept.replace(/\./g, '').toUpperCase()} (máx. {maxSizeMB}MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div
          className="flex items-center justify-between p-4 rounded-lg border-2"
          style={{ borderColor: 'var(--jandi-light-blue)', backgroundColor: 'var(--jandi-background)' }}
        >
          <div className="flex items-center gap-3">
            <DocumentIcon className="w-8 h-8" style={{ color: 'var(--jandi-light-blue)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--jandi-dark-blue)' }}>
                {file.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--jandi-gray)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 rounded-full hover:bg-red-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" style={{ color: '#EF4444' }} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm mt-2" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
