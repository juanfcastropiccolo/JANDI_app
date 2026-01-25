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
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Crown, Palette, Settings, HelpCircle, LogOut } from 'lucide-react';

interface UserProfileProps {
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

function UserProfile({ userEmail, userName, onLogout, onSettings }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = () => {
    if (userName) {
      return userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return userEmail.substring(0, 2).toUpperCase();
  };

  const displayName = userName || userEmail.split('@')[0];

  return (
    <div
      ref={dropdownRef}
      className="relative border-t"
      style={{
        borderColor: 'rgba(8, 131, 149, 0.3)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center gap-3 hover:bg-opacity-50 transition-all duration-200"
        style={{
          backgroundColor: isOpen ? 'rgba(8, 131, 149, 0.3)' : 'transparent',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
          style={{
            backgroundColor: 'var(--jandi-light-blue)',
            color: 'var(--jandi-white)',
          }}
        >
          {getInitials()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div
            className="text-sm font-medium truncate"
            style={{
              color: 'var(--jandi-white)',
            }}
          >
            {displayName}
          </div>
          <div
            className="text-xs truncate"
            style={{
              color: 'var(--jandi-gray-light)',
              opacity: 0.7,
            }}
          >
            Plus
          </div>
        </div>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--jandi-white)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-lg shadow-xl py-2"
          style={{
            backgroundColor: 'var(--jandi-medium-blue)',
          }}
        >
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-opacity-80 transition-all"
            style={{
              color: 'var(--jandi-white)',
            }}
            onClick={() => {
              setIsOpen(false);
              // TODO: Implementar upgrade plan
            }}
          >
            <Crown size={18} />
            <span>Upgrade plan</span>
          </button>
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-opacity-80 transition-all"
            style={{
              color: 'var(--jandi-white)',
            }}
            onClick={() => {
              setIsOpen(false);
              // TODO: Implementar personalization
            }}
          >
            <Palette size={18} />
            <span>Personalization</span>
          </button>
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-opacity-80 transition-all"
            style={{
              color: 'var(--jandi-white)',
            }}
            onClick={() => {
              setIsOpen(false);
              if (onSettings) onSettings();
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-opacity-80 transition-all"
            style={{
              color: 'var(--jandi-white)',
            }}
            onClick={() => {
              setIsOpen(false);
              // TODO: Implementar help
            }}
          >
            <HelpCircle size={18} />
            <span>Help</span>
          </button>
          <div
            className="my-1 mx-2"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          />
          <button
            type="button"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-opacity-80 transition-all"
            style={{
              color: 'var(--jandi-white)',
            }}
            onClick={() => {
              setIsOpen(false);
              if (onLogout) onLogout();
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
