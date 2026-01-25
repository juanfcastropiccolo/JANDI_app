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
import { Menu, X } from 'lucide-react';

interface ToggleSidebarButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

function ToggleSidebarButton({ isOpen, onClick }: ToggleSidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--jandi-light-blue)',
        border: '1px solid rgba(7, 25, 82, 0.2)',
      }}
      aria-label={isOpen ? 'Cerrar sidebar' : 'Abrir sidebar'}
    >
      {isOpen ? (
        <X size={24} style={{ color: 'var(--jandi-white)' }} />
      ) : (
        <Menu size={24} style={{ color: 'var(--jandi-white)' }} />
      )}
    </button>
  );
}

export default ToggleSidebarButton;
