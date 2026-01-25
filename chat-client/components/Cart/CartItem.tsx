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
import { memo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '../../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem = memo(({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const { product, quantity } = item;
  const price = parseFloat(product.offers.price);
  const itemTotal = price * quantity;

  return (
    <div
      className="cart-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        marginBottom: '12px',
        backgroundColor: 'var(--jandi-background)',
        borderRadius: '12px',
        border: '1px solid rgba(55, 183, 195, 0.2)',
        transition: 'all 200ms',
      }}
    >
      {/* Imagen del producto */}
      <img
        src={product.image[0] || '/placeholder-product.png'}
        alt={product.name}
        style={{
          width: '60px',
          height: '60px',
          objectFit: 'cover',
          borderRadius: '8px',
          border: '1px solid rgba(55, 183, 195, 0.3)',
        }}
      />

      {/* Info del producto */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <h4
          style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--jandi-dark-blue)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {product.name}
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--jandi-medium-blue)',
            fontWeight: 600,
          }}
        >
          ${itemTotal.toLocaleString('es-CL')}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--jandi-white)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid rgba(55, 183, 195, 0.3)',
        }}
      >
        <button
          type="button"
          onClick={() => onUpdateQuantity(product.productID, quantity - 1)}
          aria-label="Disminuir cantidad"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--jandi-medium-blue)',
            borderRadius: '4px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--jandi-light-blue)';
            e.currentTarget.style.color = 'var(--jandi-white)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--jandi-medium-blue)';
          }}
        >
          <Minus size={16} />
        </button>
        <span
          style={{
            minWidth: '24px',
            textAlign: 'center',
            fontWeight: 600,
            color: 'var(--jandi-dark-blue)',
            fontSize: '14px',
          }}
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(product.productID, quantity + 1)}
          aria-label="Aumentar cantidad"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--jandi-medium-blue)',
            borderRadius: '4px',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--jandi-light-blue)';
            e.currentTarget.style.color = 'var(--jandi-white)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--jandi-medium-blue)';
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={() => onRemove(product.productID)}
        aria-label="Eliminar producto"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--jandi-gray)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          transition: 'all 150ms',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--jandi-gray)';
        }}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
