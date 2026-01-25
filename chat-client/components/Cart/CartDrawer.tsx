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
import { useEffect } from 'react';
import type { CartItem } from '../../types';
import CartHeader from './CartHeader';
import CartItemList from './CartItemList';
import CartFooter from './CartFooter';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  isConfirmed: boolean;
  onToggleConfirmation: () => void;
  onPay: () => void;
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  isConfirmed,
  onToggleConfirmation,
  onPay,
  onRemoveItem,
  onUpdateQuantity,
}: CartDrawerProps) {
  // Manejar tecla ESC para cerrar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(7, 25, 82, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
            animation: 'fadeIn 200ms ease-out',
          }}
        />
      )}

      {/* Drawer */}
      <aside
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          backgroundColor: 'var(--jandi-white)',
          boxShadow: '-4px 0 24px rgba(7, 25, 82, 0.2)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CartHeader onClose={onClose} />
        <CartItemList
          items={items}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemoveItem}
        />
        <CartFooter
          total={total}
          isConfirmed={isConfirmed}
          onToggleConfirmation={onToggleConfirmation}
          onPay={onPay}
          itemCount={itemCount}
        />
      </aside>
    </>
  );
}

export default CartDrawer;
