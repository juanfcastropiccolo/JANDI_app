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
import type { CartItem as CartItemType } from '../../types';
import CartItem from './CartItem';

interface CartItemListProps {
  items: CartItemType[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemList({ items, onUpdateQuantity, onRemove }: CartItemListProps) {
  if (items.length === 0) {
    return (
      <div
        className="cart-empty"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--jandi-gray)',
          textAlign: 'center',
          padding: '32px',
        }}
      >
        <ShoppingBag size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>
          Tu carrito está vacío
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
          Agrega productos desde el chat
        </p>
      </div>
    );
  }

  return (
    <div
      className="cart-item-list"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}
    >
      {items.map((item) => (
        <CartItem
          key={item.product.productID}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default CartItemList;
