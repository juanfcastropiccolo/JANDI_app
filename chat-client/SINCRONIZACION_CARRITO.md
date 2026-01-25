# Sincronización del Carrito

## Descripción General

El sistema ahora sincroniza automáticamente el carrito que JANDI va construyendo en los mensajes con el panel del carrito en la derecha de la interfaz.

## Cómo Funciona

### 1. Sincronización desde JANDI al Carrito

Cuando JANDI envía un mensaje con un `checkout` que contiene `line_items`, el sistema:

1. Detecta el nuevo checkout mediante el `checkout.id`
2. Convierte los `CheckoutItem` del checkout a objetos `Product` compatibles con el carrito
3. Limpia el carrito actual
4. Agrega todos los productos del checkout al carrito con sus cantidades correspondientes

**Código relevante:**
```typescript
// En App.tsx, líneas ~148-192
useEffect(() => {
  const lastCheckoutMessage = messages
    .slice()
    .reverse()
    .find(m => m.checkout);

  if (lastCheckoutMessage?.checkout) {
    const checkout = lastCheckoutMessage.checkout;
    
    // Solo sincronizar si es un checkout nuevo
    if (checkout.id === lastSyncedCheckoutId.current) {
      return;
    }

    // Convertir line_items del checkout a productos del carrito
    // y sincronizar...
  }
}, [messages, clearCart, addItem]);
```

### 2. Agregar Productos desde el Chat

Cuando el usuario hace clic en "Add to Checkout" en una tarjeta de producto:

1. El producto se agrega al carrito local inmediatamente
2. El carrito se abre automáticamente (con un pequeño delay para mejor UX)
3. Se envía la acción al agente JANDI

**Código relevante:**
```typescript
// En App.tsx, líneas ~193-206
const handleAddToCheckout = (productToAdd: Product) => {
  addItem(productToAdd, 1);
  
  setTimeout(() => {
    openCart();
  }, 300);
  
  const actionPayload = JSON.stringify({
    action: 'add_to_checkout',
    product_id: productToAdd.productID,
    quantity: 1,
  });
  handleSendMessage(actionPayload, {isUserAction: true});
};
```

### 3. Pago desde el Carrito

Cuando el usuario confirma el carrito y hace clic en "PAGAR":

1. Se cierra el drawer del carrito
2. Se envía una acción `start_payment` al agente con los items del carrito
3. JANDI procesa el pago y devuelve el flujo correspondiente

**Código relevante:**
```typescript
// En App.tsx, líneas ~537-550
const handlePayFromCart = async () => {
  if (!isConfirmed || cartItems.length === 0) return;
  
  closeCart();
  
  const actionPayload = JSON.stringify({
    action: 'start_payment',
    cart_items: cartItems.map(item => ({
      product_id: item.product.productID,
      quantity: item.quantity,
    })),
  });
  
  await handleSendMessage(actionPayload, {isUserAction: true});
};
```

## Flujo de Datos

```
Usuario agrega producto → Carrito Local + JANDI
                                ↓
                          JANDI procesa
                                ↓
                       JANDI envía Checkout
                                ↓
                    Sistema detecta nuevo checkout
                                ↓
                    Sincroniza Carrito Local ← Checkout de JANDI
```

## Características Implementadas

- ✅ Sincronización automática del carrito cuando llega un checkout de JANDI
- ✅ Apertura automática del carrito al agregar productos
- ✅ Prevención de loops infinitos de sincronización mediante `lastSyncedCheckoutId`
- ✅ Reset del estado de sincronización al cambiar de conversación
- ✅ Conversión correcta de precios (centavos → dólares)
- ✅ Persistencia del carrito en localStorage (ya existente)

## Mejoras Futuras

### 1. Sincronización Bidireccional Completa
Actualmente, cuando el usuario modifica el carrito desde el panel (cambia cantidades o elimina items), esos cambios no se envían automáticamente a JANDI. Solo se sincronizan cuando el usuario hace clic en "PAGAR".

**Mejora sugerida:** Agregar debounce y enviar actualizaciones a JANDI cuando el usuario modifica el carrito.

### 2. Notificaciones Visuales
Agregar feedback visual cuando se sincroniza el carrito (ej: toast notification o badge en el botón del carrito).

### 3. Manejo de Conflictos
Si el usuario está modificando el carrito justo cuando llega un checkout de JANDI, podría haber conflictos. Implementar una estrategia de resolución (ej: preguntar al usuario qué versión mantener).

### 4. Modo de Edición
Agregar un modo donde el usuario pueda indicar si quiere que el carrito sea "controlado por JANDI" o "manual", para casos donde prefiera que JANDI no sobrescriba sus cambios.

## Archivos Modificados

- `chat-client/App.tsx`: Lógica principal de sincronización
- `chat-client/contexts/CartContext.tsx`: Ya existente, no modificado pero usado para la sincronización
- `chat-client/SINCRONIZACION_CARRITO.md`: Esta documentación

## Testing

Para probar la sincronización:

1. Inicia una conversación con JANDI
2. Pide productos (ej: "Quiero comprar galletas")
3. Haz clic en "Add to Checkout" en algún producto
   - ✅ El carrito debería abrirse automáticamente
   - ✅ El producto debería aparecer en el carrito
4. Pide a JANDI que agregue más productos
5. Cuando JANDI envíe un checkout, el carrito debería actualizarse automáticamente
6. Modifica las cantidades en el carrito
7. Haz clic en el checkbox de confirmación y luego en "PAGAR"
   - ✅ El carrito debería cerrarse
   - ✅ JANDI debería procesar el pago

## Notas Técnicas

### Conversión de Precios
Los precios en el checkout vienen en centavos (ej: 499 = $4.99), mientras que el carrito usa dólares como string. La conversión se hace en la sincronización:

```typescript
offers: {
  price: (lineItem.item.price / 100).toString(),
  priceCurrency: checkout.currency,
  availability: 'InStock',
}
```

### Prevención de Loops
Se usa un ref `lastSyncedCheckoutId` para trackear el último checkout procesado y evitar sincronizaciones duplicadas:

```typescript
const lastSyncedCheckoutId = useRef<string | null>(null);

// Luego en el useEffect:
if (checkout.id === lastSyncedCheckoutId.current) {
  return; // Ya procesado
}
lastSyncedCheckoutId.current = checkout.id;
```

### Reset al Cambiar Conversación
El `lastSyncedCheckoutId` se resetea cuando cambia la conversación para que la sincronización funcione correctamente en cada chat:

```typescript
useEffect(() => {
  // ... código de sincronización de mensajes ...
  lastSyncedCheckoutId.current = null;
}, [currentConversationId]);
```
