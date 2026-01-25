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
import {appConfig} from '@/config';

interface HeaderProps {
  sidebarOpen?: boolean;
}

function Header({ sidebarOpen }: HeaderProps) {
  return (
    <header 
      className="shadow-sm p-4 border-b flex-shrink-0 transition-all duration-300"
      style={{
        backgroundColor: 'var(--jandi-white)',
        borderColor: 'rgba(8, 131, 149, 0.2)',
        marginLeft: sidebarOpen ? '280px' : '0',
      }}
    >
      <div className="flex items-center justify-center md:justify-start">
        <h1 className="text-xl font-bold flex items-center" style={{ color: 'var(--jandi-dark-blue)' }}>
          <img
            src={appConfig.logoUrl}
            alt={appConfig.name}
            className="h-8 mr-3"
          />
          <span>JANDI</span>
        </h1>
      </div>
    </header>
  );
}

export default Header;
