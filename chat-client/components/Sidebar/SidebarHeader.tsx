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
import { Plus, ChevronLeft } from 'lucide-react';

interface SidebarHeaderProps {
  onNewChat: () => void;
  onClose: () => void;
  logoUrl: string;
}

function SidebarHeader({ onNewChat, onClose, logoUrl }: SidebarHeaderProps) {
  return (
    <div className="flex flex-col">
      {/* Sección blanca con logos y botón cerrar */}
      <div
        className="flex items-center justify-between h-20 px-4"
        style={{
          backgroundColor: 'var(--jandi-white)',
        }}
      >
        {/* Logos de JANDI */}
        <img
          src="/images/JANDI_LOGO_COMPLETO.png"
          alt="JANDI"
          className="ml-8 h-14 max-h-full w-auto object-contain"
          style={{ maxWidth: 190 }}
        />

        {/* Botón de cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-20"
          style={{
            backgroundColor: 'rgba(8, 131, 149, 0.1)',
          }}
          aria-label="Cerrar sidebar"
        >
          <ChevronLeft size={20} style={{ color: 'var(--jandi-dark-blue)' }} />
        </button>
      </div>

      {/* Línea divisoria */}
      <div
        className="w-full h-px"
        style={{
          backgroundColor: 'rgba(8, 131, 149, 0.3)',
        }}
      />

      {/* Botón Nuevo Chat centrado */}
      <div className="flex items-center justify-center pt-5 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 hover:scale-105"
          style={{
            backgroundColor: 'var(--jandi-light-blue)',
            color: 'var(--jandi-white)',
          }}
        >
          <Plus size={18} />
          <span>Nuevo Chat</span>
        </button>
      </div>
    </div>
  );
}

export default SidebarHeader;
