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
import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  // Estado
  items: CartItem[];
  isOpen: boolean;
  isConfirmed: boolean;
  total: number;
  
  // Acciones
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleConfirmation: () => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Inicializar desde localStorage si existe
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('jandi-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convertir strings de fecha de vuelta a objetos Date
        return parsed.map((item: CartItem) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Persistir en localStorage cuando cambian los items
  useEffect(() => {
    try {
      localStorage.setItem('jandi-cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  // Calcular total
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.product.offers.price);
      return sum + (price * item.quantity);
    }, 0);
  }, [items]);

  // Agregar item al carrito
  const addItem = useCallback((product: Product, quantity: number = 1) => {
    try {
      if (!product || !product.productID) {
        console.error('Producto inválido');
        return;
      }
      if (quantity <= 0) {
        console.error('Cantidad debe ser mayor a 0');
        return;
      }

      setItems(prev => {
        const existing = prev.find(i => i.product.productID === product.productID);
        if (existing) {
          // Actualizar cantidad si ya existe
          return prev.map(i =>
            i.product.productID === product.productID
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        // Agregar nuevo item
        return [...prev, { product, quantity, addedAt: new Date() }];
      });
    } catch (error) {
      console.error('Error al agregar item:', error);
    }
  }, []);

  // Eliminar item del carrito
  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.productID !== productId));
    // Resetear confirmación si se elimina un item
    setIsConfirmed(false);
  }, []);

  // Actualizar cantidad de un item
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev =>
      prev.map(i =>
        i.product.productID === productId
          ? { ...i, quantity }
          : i
      )
    );
    // Resetear confirmación si se cambia la cantidad
    setIsConfirmed(false);
  }, [removeItem]);

  // Toggle carrito abierto/cerrado
  const toggleCart = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Abrir carrito
  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Cerrar carrito
  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Toggle confirmación
  const toggleConfirmation = useCallback(() => {
    setIsConfirmed(prev => !prev);
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setItems([]);
    setIsConfirmed(false);
  }, []);

  // Obtener cantidad total de items
  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isOpen,
      isConfirmed,
      total,
      addItem,
      removeItem,
      updateQuantity,
      toggleCart,
      openCart,
      closeCart,
      toggleConfirmation,
      clearCart,
      getItemCount,
    }),
    [
      items,
      isOpen,
      isConfirmed,
      total,
      addItem,
      removeItem,
      updateQuantity,
      toggleCart,
      openCart,
      closeCart,
      toggleConfirmation,
      clearCart,
      getItemCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
