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
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

function SearchBar({ searchQuery, onSearchChange, placeholder = 'Buscar chats...' }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce: actualizar el query padre después de 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, onSearchChange]);

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };

  return (
    <div className="p-3">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(8, 131, 149, 0.3)',
        }}
      >
        <Search size={18} style={{ color: 'var(--jandi-gray-light)' }} />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm"
          style={{
            color: 'var(--jandi-white)',
          }}
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded hover:bg-opacity-50 transition-all"
            style={{
              backgroundColor: 'rgba(8, 131, 149, 0.3)',
            }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} style={{ color: 'var(--jandi-gray-light)' }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
