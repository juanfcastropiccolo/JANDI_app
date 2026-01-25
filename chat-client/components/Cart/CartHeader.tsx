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
import { X } from 'lucide-react';

interface CartHeaderProps {
  onClose: () => void;
}

function CartHeader({ onClose }: CartHeaderProps) {
  return (
    <div
      className="cart-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px',
        backgroundColor: 'var(--jandi-dark-blue)',
        color: 'var(--jandi-white)',
        borderBottom: '1px solid var(--jandi-light-blue)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        Mi Carrito
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar carrito"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--jandi-white)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 200ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 183, 195, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={24} />
      </button>
    </div>
  );
}

export default CartHeader;
