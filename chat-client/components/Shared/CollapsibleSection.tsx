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
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isCompleted?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  isCompleted = false,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-lg border-2 overflow-hidden transition-all duration-200"
      style={{
        borderColor: isExpanded ? 'var(--jandi-light-blue)' : 'var(--jandi-gray-light)',
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-bold text-lg" style={{ color: 'var(--jandi-dark-blue)' }}>
            {title}
          </h3>
          {isCompleted && (
            <CheckCircleIcon className="w-5 h-5" style={{ color: 'var(--jandi-light-blue)' }} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-xs font-medium" style={{ color: 'var(--jandi-light-blue)' }}>
              Completado
            </span>
          )}
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          ) : (
            <ChevronRightIcon className="w-5 h-5" style={{ color: 'var(--jandi-gray)' }} />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 py-4 border-t-2" style={{ borderColor: 'var(--jandi-gray-light)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
