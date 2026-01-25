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
import { ShoppingBag } from 'lucide-react';

interface CartButtonProps {
  itemCount: number;
  onClick: () => void;
  isOpen: boolean;
}

function CartButton({ itemCount, onClick, isOpen }: CartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cart-button"
      aria-label={`Carrito de compras. ${itemCount} productos`}
      aria-expanded={isOpen}
      aria-controls="cart-drawer"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--jandi-white)',
        border: '2px solid var(--jandi-light-blue)',
        boxShadow: '0 4px 12px rgba(7, 25, 82, 0.15)',
        zIndex: 40,
        cursor: 'pointer',
        transition: 'all 200ms',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(7, 25, 82, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(7, 25, 82, 0.15)';
      }}
    >
      <ShoppingBag size={24} color="var(--jandi-dark-blue)" />
      {itemCount > 0 && (
        <span
          className="cart-badge"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--jandi-light-blue)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default CartButton;
