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
import { useState } from 'react';
import type { NavItem } from './NavItems';

interface PillNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  className?: string;
}

export default function PillNav({ items, activeId, onItemClick, className = '' }: PillNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <nav
      className={`flex items-center gap-2 p-2 bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg rounded-full border border-gray-200/20 dark:border-gray-700/20 shadow-lg ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const isHovered = item.id === hoveredId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`
              relative px-6 py-2.5 rounded-full text-sm font-medium
              transition-all duration-300 ease-out
              ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-105'
              }
            `}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}

            {/* Indicador de hover */}
            {isHovered && !isActive && (
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-full -z-10 transition-opacity duration-200" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
