# 🛒 Plan: Carrito de Compras Desplegable a la Derecha

## 📋 Objetivo

Implementar un carrito de compras desplegable en el lado derecho de la aplicación JANDI que permite a los usuarios:
1. Ver su lista de productos/carrito en cualquier momento
2. Revisar y confirmar los productos seleccionados
3. Realizar el pago directamente desde el carrito
4. Tener una experiencia fluida que no interrumpa el chat

---

## 🎨 Referencia Visual

### Estado Inicial (Botón Colapsado)
```
┌─────────────────────────────────────────────────────────┐
│ [☰]                             [🗒️]                    │
│  Sidebar                        Cart Button             │
│                                                         │
│                                                         │
│           ÁREA DE CHAT PRINCIPAL                        │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Estado Expandido (Carrito Visible)
```
┌─────────────────────────────────────────────────────────┐
│ [☰]                                   ┌─────────────────┤
│  Sidebar      CHAT CON OVERLAY        │  MI CARRITO  [X]│
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │─────────────────│
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ • Leche x2      │
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │   $2,400        │
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │                 │
│               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ • Pan x1        │
│                                        │   $1,200        │
│                                        │                 │
│                                        │─────────────────│
│                                        │ Total: $3,600   │
│                                        │                 │
│                                        │ ☑ Confirmo      │
│                                        │   productos     │
│                                        │                 │
│                                        │ [💳 PAGAR]      │
└────────────────────────────────────────┴─────────────────┘
```

---

## 🏗️ Arquitectura de Implementación

### 1. Estado del Carrito

**Ubicación:** Crear nuevo Context para el carrito en `/contexts/CartContext.tsx`

**Estado a Gestionar:**
```typescript
interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isConfirmed: boolean;
  total: number;
}
```

**Context Provider:**
```typescript
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
```

---

### 2. Componentes a Crear

#### 2.1 `CartProvider` (`/contexts/CartContext.tsx`)
- **Propósito:** Gestionar el estado global del carrito
- **Funcionalidades:**
  - Mantener lista de productos
  - Calcular totales
  - Persistir en localStorage (opcional)
  - Sincronizar con el checkout del agente

#### 2.2 `CartButton` (`/components/Cart/CartButton.tsx`)
- **Propósito:** Botón flotante en la esquina superior derecha
- **Diseño:**
  - Icono de lista en azul marino (`--jandi-dark-blue`)
  - Fondo claro (`--jandi-background`)
  - Badge con cantidad de items
  - Posición fija: `position: fixed; top: 20px; right: 20px;`
  - Z-index: 40 (debajo del sidebar pero encima del chat)

**Estructura Visual:**
```tsx
<button className="cart-button">
  <ShoppingBag size={24} color="var(--jandi-dark-blue)" />
  {itemCount > 0 && (
    <span className="cart-badge">{itemCount}</span>
  )}
</button>
```

**Estilos:**
```css
.cart-button {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--jandi-white);
  border: 2px solid var(--jandi-light-blue);
  box-shadow: 0 4px 12px rgba(7, 25, 82, 0.15);
  z-index: 40;
  cursor: pointer;
  transition: all 200ms;
}

.cart-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(7, 25, 82, 0.25);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--jandi-light-blue);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### 2.3 `CartDrawer` (`/components/Cart/CartDrawer.tsx`)
- **Propósito:** Panel lateral desplegable con el contenido del carrito
- **Características:**
  - Ancho: 380px en desktop, 100% en mobile
  - Overlay oscuro detrás: `rgba(7, 25, 82, 0.4)`
  - Animación de slide-in desde la derecha
  - Z-index: 50 (encima de todo)
  - No mueve el contenido del chat

**Props:**
```typescript
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
```

**Estructura:**
```tsx
<>
  {/* Overlay */}
  {isOpen && (
    <div className="cart-overlay" onClick={onClose} />
  )}
  
  {/* Drawer */}
  <aside className={`cart-drawer ${isOpen ? 'open' : ''}`}>
    <CartHeader onClose={onClose} />
    <CartItemList 
      items={items}
      onRemove={onRemoveItem}
      onUpdateQuantity={onUpdateQuantity}
    />
    <CartFooter
      total={total}
      isConfirmed={isConfirmed}
      onToggleConfirmation={onToggleConfirmation}
      onPay={onPay}
    />
  </aside>
</>
```

#### 2.4 `CartHeader` (`/components/Cart/CartHeader.tsx`)
- **Propósito:** Encabezado del carrito con título y botón de cierre
- **Diseño:**
```tsx
<div className="cart-header">
  <h2>Mi Carrito</h2>
  <button onClick={onClose}>
    <X size={24} />
  </button>
</div>
```

#### 2.5 `CartItemList` (`/components/Cart/CartItemList.tsx`)
- **Propósito:** Lista scrolleable de productos en el carrito
- **Características:**
  - Scroll vertical si hay muchos items
  - Cada item muestra: imagen, nombre, cantidad, precio
  - Botones para aumentar/disminuir cantidad
  - Botón para eliminar item

**Item Structure:**
```tsx
<div className="cart-item">
  <img src={product.imageUrl} alt={product.name} />
  <div className="cart-item-info">
    <h4>{product.name}</h4>
    <p className="cart-item-price">${product.price}</p>
  </div>
  <div className="cart-item-controls">
    <button onClick={() => onUpdateQuantity(product.id, quantity - 1)}>
      <Minus size={16} />
    </button>
    <span>{quantity}</span>
    <button onClick={() => onUpdateQuantity(product.id, quantity + 1)}>
      <Plus size={16} />
    </button>
  </div>
  <button onClick={() => onRemove(product.id)}>
    <Trash2 size={18} />
  </button>
</div>
```

#### 2.6 `CartFooter` (`/components/Cart/CartFooter.tsx`)
- **Propósito:** Pie del carrito con total, confirmación y botón de pago
- **Diseño:**
```tsx
<div className="cart-footer">
  <div className="cart-total">
    <span>Total:</span>
    <span className="cart-total-amount">${total.toLocaleString()}</span>
  </div>
  
  <label className="cart-confirmation">
    <input
      type="checkbox"
      checked={isConfirmed}
      onChange={onToggleConfirmation}
    />
    <span>Confirmo que los productos son los que he elegido</span>
  </label>
  
  <button
    className="cart-pay-button"
    onClick={onPay}
    disabled={!isConfirmed || items.length === 0}
  >
    💳 PAGAR
  </button>
</div>
```

---

### 3. Integración con App.tsx

**Modificaciones en App.tsx:**

```typescript
// 1. Importar CartProvider y componentes
import { CartProvider, useCart } from './contexts/CartContext';
import CartButton from './components/Cart/CartButton';
import CartDrawer from './components/Cart/CartDrawer';

// 2. Dentro de AppContent, usar el hook useCart
function AppContent() {
  // ... código existente ...
  
  const {
    items,
    isOpen,
    isConfirmed,
    total,
    toggleCart,
    closeCart,
    toggleConfirmation,
    clearCart,
    getItemCount,
  } = useCart();
  
  // 3. Modificar handleAddToCheckout para agregar al carrito
  const handleAddToCheckout = (productToAdd: Product) => {
    // Agregar al carrito local
    addItem(productToAdd, 1);
    
    // También enviar al agente (lógica existente)
    const actionPayload = JSON.stringify({
      action: 'add_to_checkout',
      product_id: productToAdd.productID,
      quantity: 1,
    });
    handleSendMessage(actionPayload, {isUserAction: true});
  };
  
  // 4. Nuevo handler para pago desde el carrito
  const handlePayFromCart = async () => {
    if (!isConfirmed || items.length === 0) return;
    
    closeCart(); // Cerrar el drawer
    
    // Enviar acción de inicio de pago al agente
    const actionPayload = JSON.stringify({
      action: 'start_payment',
      cart_items: items.map(item => ({
        product_id: item.product.productID,
        quantity: item.quantity,
      })),
    });
    
    await handleSendMessage(actionPayload, {isUserAction: true});
    
    // Opcional: limpiar carrito después de pago exitoso
    // clearCart();
  };
  
  // 5. Renderizar componentes del carrito
  return (
    <div className="flex h-screen max-h-screen font-sans">
      <Sidebar {...} />
      
      <div className="flex flex-col flex-1">
        {/* Chat content */}
        {/* ... */}
      </div>
      
      {/* Cart Components - Siempre renderizados */}
      <CartButton
        itemCount={getItemCount()}
        onClick={toggleCart}
      />
      
      <CartDrawer
        isOpen={isOpen}
        onClose={closeCart}
        items={items}
        total={total}
        isConfirmed={isConfirmed}
        onToggleConfirmation={toggleConfirmation}
        onPay={handlePayFromCart}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}

// 6. Envolver App con CartProvider
function App() {
  return (
    <ConversationProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ConversationProvider>
  );
}
```

---

## 🎨 Estilos Detallados

### CartDrawer Styles (`/components/Cart/CartDrawer.css`)

```css
/* Overlay */
.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(7, 25, 82, 0.4);
  backdrop-filter: blur(2px);
  z-index: 49;
  animation: fadeIn 200ms ease-out;
}

/* Drawer principal */
.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  background-color: var(--jandi-white);
  box-shadow: -4px 0 24px rgba(7, 25, 82, 0.2);
  z-index: 50;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cart-drawer.open {
  transform: translateX(0);
}

/* Header del carrito */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background-color: var(--jandi-dark-blue);
  color: var(--jandi-white);
  border-bottom: 1px solid var(--jandi-light-blue);
}

.cart-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.cart-header button {
  background: transparent;
  border: none;
  color: var(--jandi-white);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 200ms;
}

.cart-header button:hover {
  background-color: rgba(55, 183, 195, 0.2);
}

/* Lista de items */
.cart-item-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--jandi-gray);
  text-align: center;
  padding: 32px;
}

.cart-empty svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Item individual */
.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background-color: var(--jandi-background);
  border-radius: 12px;
  border: 1px solid rgba(55, 183, 195, 0.2);
  transition: all 200ms;
}

.cart-item:hover {
  box-shadow: 0 2px 8px rgba(7, 25, 82, 0.1);
  border-color: var(--jandi-light-blue);
}

.cart-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(55, 183, 195, 0.3);
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--jandi-dark-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item-price {
  margin: 0;
  font-size: 14px;
  color: var(--jandi-medium-blue);
  font-weight: 600;
}

/* Controles de cantidad */
.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--jandi-white);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(55, 183, 195, 0.3);
}

.cart-item-controls button {
  background-color: transparent;
  border: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--jandi-medium-blue);
  border-radius: 4px;
  transition: all 150ms;
}

.cart-item-controls button:hover {
  background-color: var(--jandi-light-blue);
  color: var(--jandi-white);
}

.cart-item-controls span {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  color: var(--jandi-dark-blue);
  font-size: 14px;
}

/* Botón eliminar */
.cart-item > button:last-child {
  background: transparent;
  border: none;
  color: var(--jandi-gray);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 150ms;
}

.cart-item > button:last-child:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Footer del carrito */
.cart-footer {
  padding: 24px;
  border-top: 2px solid rgba(55, 183, 195, 0.3);
  background-color: var(--jandi-white);
}

/* Total */
.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(55, 183, 195, 0.2);
}

.cart-total span:first-child {
  font-size: 16px;
  color: var(--jandi-dark-blue);
  font-weight: 500;
}

.cart-total-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--jandi-dark-blue);
}

/* Confirmación */
.cart-confirmation {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
}

.cart-confirmation input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--jandi-light-blue);
}

.cart-confirmation span {
  font-size: 14px;
  color: var(--jandi-dark-blue);
  line-height: 1.4;
}

/* Botón de pago */
.cart-pay-button {
  width: 100%;
  padding: 16px;
  background-color: var(--jandi-light-blue);
  color: var(--jandi-white);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 200ms;
  box-shadow: 0 4px 12px rgba(55, 183, 195, 0.3);
}

.cart-pay-button:hover:not(:disabled) {
  background-color: var(--jandi-medium-blue);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(55, 183, 195, 0.4);
}

.cart-pay-button:active:not(:disabled) {
  transform: translateY(0);
}

.cart-pay-button:disabled {
  background-color: var(--jandi-gray);
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

/* Responsive - Mobile */
@media (max-width: 768px) {
  .cart-drawer {
    width: 100vw;
  }
  
  .cart-button {
    top: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
  
  .cart-item img {
    width: 50px;
    height: 50px;
  }
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

---

## 📁 Estructura de Archivos

### Archivos a Crear

```
/contexts/
  └── CartContext.tsx           # Context Provider para el carrito

/components/Cart/
  ├── index.ts                  # Exports centralizados
  ├── CartButton.tsx            # Botón flotante
  ├── CartDrawer.tsx            # Drawer principal
  ├── CartHeader.tsx            # Header del drawer
  ├── CartItemList.tsx          # Lista de items
  ├── CartItem.tsx              # Item individual
  ├── CartFooter.tsx            # Footer con total y pago
  └── CartDrawer.css            # Estilos del carrito
```

### Archivos a Modificar

```
/App.tsx                        # Integrar CartProvider y componentes
/types.ts                       # Añadir interfaces CartItem, CartState
```

---

## 🔄 Flujo de Usuario

### Escenario 1: Agregar Producto al Carrito

1. Usuario ve productos en el chat
2. Usuario clickea "Agregar al carrito" en un producto
3. Producto se agrega al carrito local (Context)
4. Badge del CartButton se actualiza con la cantidad
5. Mensaje se envía al agente (lógica existente)
6. Usuario puede seguir navegando o agregar más productos

### Escenario 2: Revisar Carrito

1. Usuario clickea el CartButton (botón flotante)
2. CartDrawer se desliza desde la derecha
3. Overlay oscuro aparece detrás del drawer
4. Chat queda sombreado pero visible (no se mueve)
5. Usuario revisa la lista de productos
6. Usuario puede:
   - Aumentar/disminuir cantidades
   - Eliminar productos
   - Ver el total actualizado

### Escenario 3: Pagar desde el Carrito

1. Usuario revisa el carrito
2. Usuario marca el checkbox de confirmación
3. Botón "PAGAR" se habilita
4. Usuario clickea "PAGAR"
5. CartDrawer se cierra
6. Mensaje se envía al agente para iniciar el proceso de pago
7. Flujo de pago continúa en el chat (lógica existente)
8. (Opcional) Carrito se limpia después de pago exitoso

### Escenario 4: Cerrar Carrito sin Pagar

1. Usuario clickea fuera del drawer (en el overlay)
   - O clickea el botón X en el header
2. CartDrawer se cierra con animación
3. Overlay desaparece
4. Productos permanecen en el carrito para más tarde

---

## 🎯 Detalles de Implementación

### 1. Z-Index Hierarchy

```
Base Layout:           z-index: 0
Chat Content:          z-index: 1
Sidebar (open):        z-index: 30
CartButton:            z-index: 40
CartOverlay:           z-index: 49
CartDrawer:            z-index: 50
```

### 2. Overlay Behavior

- **No bloquea el sidebar:** El overlay debe permitir ver el sidebar si está abierto
- **Cierra al clickear:** Click en overlay cierra el drawer
- **Blur suave:** `backdrop-filter: blur(2px)` para efecto moderno

### 3. Sincronización con Checkout

**Estrategia:**
- El carrito local (CartContext) es independiente del checkout del agente
- Cuando el usuario agrega un producto:
  1. Se actualiza el carrito local inmediatamente (UI responsiva)
  2. Se envía mensaje al agente (puede tardar)
  3. Cuando el agente responde con checkout, se puede sincronizar
  
**Sincronización bidireccional:**
```typescript
// En App.tsx, cuando llega un checkout del agente
useEffect(() => {
  const lastCheckout = messages.find(m => m.checkout);
  if (lastCheckout?.checkout) {
    // Sincronizar carrito local con checkout del agente
    syncCartWithCheckout(lastCheckout.checkout);
  }
}, [messages]);
```

### 4. Persistencia (Opcional)

```typescript
// En CartContext, guardar en localStorage
useEffect(() => {
  localStorage.setItem('jandi-cart', JSON.stringify(items));
}, [items]);

// Al inicializar, cargar desde localStorage
const [items, setItems] = useState<CartItem[]>(() => {
  const saved = localStorage.getItem('jandi-cart');
  return saved ? JSON.parse(saved) : [];
});
```

### 5. Responsive Design

**Desktop (> 768px):**
- CartDrawer: 380px de ancho
- CartButton: 56px diameter
- Animación desde la derecha

**Mobile (≤ 768px):**
- CartDrawer: 100vw (pantalla completa)
- CartButton: 48px diameter
- Posición ajustada para no interferir con UI mobile

### 6. Accesibilidad

```tsx
// CartButton
<button
  aria-label={`Carrito de compras. ${itemCount} productos`}
  aria-expanded={isOpen}
  aria-controls="cart-drawer"
>

// CartDrawer
<aside
  id="cart-drawer"
  role="dialog"
  aria-modal="true"
  aria-labelledby="cart-title"
>
  <h2 id="cart-title">Mi Carrito</h2>
```

**Navegación por teclado:**
- ESC cierra el drawer
- Tab navega entre elementos
- Enter/Space activan botones

```typescript
// En CartDrawer
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [isOpen, onClose]);
```

---

## 🧪 Testing y Casos de Uso

### Casos de Prueba

#### ✅ Caso 1: Agregar Producto al Carrito
- Usuario agrega producto
- Badge muestra cantidad correcta
- Item aparece en el carrito al abrirlo

#### ✅ Caso 2: Modificar Cantidades
- Aumentar cantidad actualiza el total
- Disminuir a 0 elimina el item
- Badge refleja la cantidad total de items

#### ✅ Caso 3: Eliminar Producto
- Botón de eliminar remueve el item
- Total se recalcula
- Badge se actualiza

#### ✅ Caso 4: Confirmación y Pago
- Checkbox debe estar marcado para habilitar pago
- Botón PAGAR deshabilitado sin confirmación
- Al pagar, se envía mensaje al agente

#### ✅ Caso 5: Overlay y Cierre
- Click en overlay cierra el drawer
- Click en X cierra el drawer
- ESC cierra el drawer
- Productos permanecen en el carrito

#### ✅ Caso 6: Responsive
- En mobile, drawer ocupa 100%
- Botón flotante no interfiere con UI
- Scroll funciona correctamente

#### ✅ Caso 7: Sincronización con Agente
- Productos agregados en chat aparecen en carrito
- Checkout del agente se sincroniza con carrito
- Total coincide entre carrito y checkout

---

## ⚡ Animaciones y Transiciones

### 1. Entrada del Drawer
```css
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.cart-drawer.open {
  animation: slideInFromRight 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Fade del Overlay
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cart-overlay {
  animation: fadeIn 200ms ease-out;
}
```

### 3. Badge Bounce (al agregar item)
```css
@keyframes badgeBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.cart-badge.updated {
  animation: badgeBounce 400ms ease-out;
}
```

### 4. Button Hover
```css
.cart-button:hover {
  transform: scale(1.05) rotate(-5deg);
  transition: transform 200ms;
}
```

---

## 📝 Checklist de Implementación

### Fase 1: Setup Básico (30 min)
- [ ] Crear `CartContext.tsx` con estado y acciones
- [ ] Crear estructura de carpeta `/components/Cart/`
- [ ] Añadir interfaces en `types.ts`
- [ ] Configurar exports en `index.ts`

### Fase 2: Componentes UI (60 min)
- [ ] Implementar `CartButton.tsx`
- [ ] Implementar `CartDrawer.tsx`
- [ ] Implementar `CartHeader.tsx`
- [ ] Implementar `CartItemList.tsx` y `CartItem.tsx`
- [ ] Implementar `CartFooter.tsx`

### Fase 3: Estilos (45 min)
- [ ] Crear `CartDrawer.css`
- [ ] Aplicar paleta JANDI
- [ ] Implementar animaciones
- [ ] Hacer responsive

### Fase 4: Integración (30 min)
- [ ] Envolver App con `CartProvider`
- [ ] Integrar `CartButton` y `CartDrawer` en App.tsx
- [ ] Conectar `handleAddToCheckout` con carrito
- [ ] Implementar `handlePayFromCart`

### Fase 5: Funcionalidades Avanzadas (30 min)
- [ ] Sincronización con checkout del agente
- [ ] Persistencia en localStorage (opcional)
- [ ] Navegación por teclado
- [ ] Aria labels y accesibilidad

### Fase 6: Testing (30 min)
- [ ] Probar agregar/eliminar productos
- [ ] Probar modificar cantidades
- [ ] Probar confirmación y pago
- [ ] Probar overlay y cierre
- [ ] Probar responsive
- [ ] Verificar accesibilidad

### Fase 7: Pulido Final (15 min)
- [ ] Ajustar animaciones
- [ ] Optimizar performance
- [ ] Verificar edge cases (carrito vacío, etc.)
- [ ] Documentar código

**Tiempo Total Estimado:** ~4 horas

---

## 🚀 Resultado Final Esperado

Al completar este plan, JANDI tendrá:

1. 🛒 **Carrito flotante siempre accesible** con badge de cantidad
2. 📱 **Drawer elegante** que se desliza desde la derecha
3. ✨ **Overlay suave** que sombrea el chat sin moverlo
4. ✅ **Confirmación explícita** antes de pagar
5. 💳 **Flujo de pago integrado** con el agente
6. 🎨 **Diseño coherente** con la paleta JANDI
7. 📱 **Totalmente responsive** en todos los dispositivos
8. ♿ **Accesible** con navegación por teclado

---

## 🎨 Mockups Detallados

### Vista Desktop - Carrito Cerrado
```
┌────────────────────────────────────────────────────────────┐
│  [☰]  JANDI                                      [🗒️ 3]    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│                                                             │
│                      ¿Qué vamos a comprar hoy?             │
│                                                             │
│            ┌─────────────────────────────────┐             │
│            │ Necesito comprar café...    [→] │             │
│            └─────────────────────────────────┘             │
│                                                             │
│        [Explicame qué es JANDI]  [Ver ofertas]             │
│                [Mi lista de compras]                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Vista Desktop - Carrito Abierto
```
┌────────────────────────────────────────────────────────────┐
│  [☰]  JANDI                        ▓▓▓▓▓ [X] MI CARRITO    │
│  ─────────────────────────────────▓▓▓▓▓─────────────────── │
│                                   ▓▓▓▓▓                     │
│  Usuario: Necesito café           ▓▓▓▓▓  📦 Leche Entera  │
│                                   ▓▓▓▓▓     x2    $2,400   │
│  Bot: Claro! Encontré estos:      ▓▓▓▓▓     [-] [+] [🗑]   │
│                                   ▓▓▓▓▓                     │
│  [Café Colombiano]  [Agregar]     ▓▓▓▓▓  🥖 Pan Integral   │
│  $3,500 - 500g                    ▓▓▓▓▓     x1    $1,200   │
│                                   ▓▓▓▓▓     [-] [+] [🗑]   │
│  [Café Premium]  [Agregar]        ▓▓▓▓▓                     │
│  $5,200 - 500g                    ▓▓▓▓▓                     │
│                                   ▓▓▓▓▓  ─────────────────  │
│                                   ▓▓▓▓▓  Total: $3,600      │
│  ┌──────────────────────────┐    ▓▓▓▓▓                     │
│  │ Tu mensaje aquí...    [→]│    ▓▓▓▓▓  ☑ Confirmo que    │
│  └──────────────────────────┘    ▓▓▓▓▓    los productos    │
│                                   ▓▓▓▓▓    son correctos    │
└───────────────────────────────────▓▓▓▓▓                     │
                                    ▓▓▓▓▓  ┌───────────────┐ │
                                    ▓▓▓▓▓  │  💳 PAGAR    │ │
                                    ▓▓▓▓▓  └───────────────┘ │
                                    ▓▓▓▓▓────────────────────┘
                                    ▓ = Overlay semi-transparente
```

### Vista Mobile - Carrito Abierto
```
┌─────────────────────────┐
│  [X]  MI CARRITO        │
│─────────────────────────│
│                         │
│  📦 Leche Entera        │
│     x2         $2,400   │
│     [-] [+] [🗑]        │
│                         │
│  🥖 Pan Integral        │
│     x1         $1,200   │
│     [-] [+] [🗑]        │
│                         │
│                         │
│─────────────────────────│
│  Total:        $3,600   │
│                         │
│  ☑ Confirmo que los     │
│    productos son los    │
│    que he elegido       │
│                         │
│  ┌───────────────────┐  │
│  │   💳 PAGAR       │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 🔍 Consideraciones Técnicas Adicionales

### 1. Performance

**Optimizaciones:**
```typescript
// Memoizar componentes que no cambian frecuentemente
const CartItem = memo(({ item, onUpdate, onRemove }: CartItemProps) => {
  // ...
});

// Memoizar cálculos costosos
const total = useMemo(() => {
  return items.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);
}, [items]);

// Debounce para actualizaciones de cantidad
const debouncedUpdateQuantity = useMemo(
  () => debounce((id: string, qty: number) => {
    updateQuantity(id, qty);
  }, 300),
  [updateQuantity]
);
```

### 2. Manejo de Errores

```typescript
// En CartContext
const addItem = (product: Product, quantity: number = 1) => {
  try {
    if (!product || !product.productID) {
      throw new Error('Producto inválido');
    }
    if (quantity <= 0) {
      throw new Error('Cantidad debe ser mayor a 0');
    }
    
    // Verificar stock (si está disponible)
    if (product.stock && product.stock < quantity) {
      toast.error('Stock insuficiente');
      return;
    }
    
    // Agregar item...
    setItems(prev => {
      const existing = prev.find(i => i.product.productID === product.productID);
      if (existing) {
        return prev.map(i =>
          i.product.productID === product.productID
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, addedAt: new Date() }];
    });
    
    toast.success(`${product.name} agregado al carrito`);
  } catch (error) {
    console.error('Error al agregar item:', error);
    toast.error('No se pudo agregar el producto');
  }
};
```

### 3. Loading States

```typescript
// En CartFooter, mostrar loading durante pago
<button
  className="cart-pay-button"
  onClick={onPay}
  disabled={!isConfirmed || items.length === 0 || isProcessing}
>
  {isProcessing ? (
    <>
      <Loader2 className="animate-spin" size={20} />
      Procesando...
    </>
  ) : (
    <>💳 PAGAR</>
  )}
</button>
```

### 4. Notificaciones Toast (Opcional)

```bash
# Instalar react-hot-toast
npm install react-hot-toast
```

```typescript
import toast from 'react-hot-toast';

// Al agregar item
toast.success('Producto agregado al carrito', {
  icon: '🛒',
  style: {
    background: 'var(--jandi-light-blue)',
    color: 'white',
  },
});

// Al eliminar item
toast('Producto eliminado', {
  icon: '🗑️',
});

// Al pagar
toast.promise(
  paymentPromise,
  {
    loading: 'Procesando pago...',
    success: '¡Pago exitoso!',
    error: 'Error en el pago',
  }
);
```

---

## 📊 Métricas de Éxito

Después de implementar, medir:

1. **Engagement:**
   - % de usuarios que abren el carrito
   - Tiempo promedio en el carrito
   - Productos promedio por carrito

2. **Conversión:**
   - % de carritos que resultan en pago
   - Tasa de abandono del carrito
   - Tiempo desde agregar producto hasta pagar

3. **UX:**
   - Clicks promedio hasta completar pago
   - Tasa de uso de confirmación manual vs. pago en chat
   - Feedback de usuarios sobre la experiencia

---

**Creado:** 25 de enero de 2026  
**Autor:** Plan generado por IA  
**Estado:** Listo para implementación  
**Tiempo estimado:** 4 horas  
**Prioridad:** Alta

---

## 🎯 Próximos Pasos

1. ✅ Revisar y aprobar el plan
2. ⬜ Crear branch: `feature/cart-drawer`
3. ⬜ Implementar según las fases del checklist
4. ⬜ Hacer testing exhaustivo
5. ⬜ Code review
6. ⬜ Merge a main
7. ⬜ Deploy y monitoreo

---

**¡Listo para comenzar la implementación! 🚀**
