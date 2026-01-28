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

import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';

export function BusinessNavigation() {
  const { businessId } = useParams();
  const location = useLocation();

  const navItems = [
    { 
      path: `/business/dashboard/${businessId}`, 
      label: 'Dashboard', 
      icon: '📊' 
    },
    { 
      path: `/business/products/${businessId}`, 
      label: 'Productos', 
      icon: '📦' 
    },
    { 
      path: `/business/orders/${businessId}`, 
      label: 'Órdenes', 
      icon: '📋' 
    },
    { 
      path: `/business/config/${businessId}`, 
      label: 'Configuración', 
      icon: '⚙️' 
    },
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-3 border-b-2 transition-all duration-200 ${
                  isActive
                    ? 'border-[var(--jandi-light-blue)] text-[var(--jandi-light-blue)] font-medium'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
