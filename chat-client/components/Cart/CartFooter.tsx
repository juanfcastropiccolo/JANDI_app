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
import { CreditCard } from 'lucide-react';

interface CartFooterProps {
  total: number;
  isConfirmed: boolean;
  onToggleConfirmation: () => void;
  onPay: () => void;
  itemCount: number;
}

function CartFooter({ total, isConfirmed, onToggleConfirmation, onPay, itemCount }: CartFooterProps) {
  const isDisabled = !isConfirmed || itemCount === 0;

  return (
    <div
      className="cart-footer"
      style={{
        padding: '24px',
        borderTop: '2px solid rgba(55, 183, 195, 0.3)',
        backgroundColor: 'var(--jandi-white)',
      }}
    >
      {/* Total */}
      <div
        className="cart-total"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(55, 183, 195, 0.2)',
        }}
      >
        <span
          style={{
            fontSize: '16px',
            color: 'var(--jandi-dark-blue)',
            fontWeight: 500,
          }}
        >
          Total:
        </span>
        <span
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--jandi-dark-blue)',
          }}
        >
          ${total.toLocaleString('es-CL')}
        </span>
      </div>

      {/* Confirmación */}
      <label
        className="cart-confirmation"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginBottom: '16px',
          cursor: itemCount > 0 ? 'pointer' : 'not-allowed',
          userSelect: 'none',
          opacity: itemCount > 0 ? 1 : 0.5,
        }}
      >
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={onToggleConfirmation}
          disabled={itemCount === 0}
          style={{
            width: '20px',
            height: '20px',
            marginTop: '2px',
            cursor: itemCount > 0 ? 'pointer' : 'not-allowed',
            accentColor: 'var(--jandi-light-blue)',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            color: 'var(--jandi-dark-blue)',
            lineHeight: 1.4,
          }}
        >
          Confirmo que los productos son los que he elegido
        </span>
      </label>

      {/* Botón de pago */}
      <button
        type="button"
        className="cart-pay-button"
        onClick={onPay}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: isDisabled ? 'var(--jandi-gray)' : 'var(--jandi-light-blue)',
          color: 'var(--jandi-white)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 200ms',
          boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(55, 183, 195, 0.3)',
          opacity: isDisabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = 'var(--jandi-medium-blue)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(55, 183, 195, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.backgroundColor = 'var(--jandi-light-blue)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 183, 195, 0.3)';
          }
        }}
      >
        <CreditCard size={20} />
        PAGAR
      </button>
    </div>
  );
}

export default CartFooter;
