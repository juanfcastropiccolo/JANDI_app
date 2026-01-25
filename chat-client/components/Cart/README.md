# 🛒 Carrito de Compras - JANDI

## Descripción

Sistema de carrito de compras desplegable implementado para JANDI que permite a los usuarios:
- Ver su lista de productos en cualquier momento
- Modificar cantidades y eliminar productos
- Confirmar y pagar directamente desde el carrito
- Experiencia fluida que no interrumpe el chat

## Componentes

### CartButton
Botón flotante en la esquina superior derecha que muestra:
- Icono de bolsa de compras en azul marino
- Badge con la cantidad total de items
- Posición fija que no interfiere con el contenido

### CartDrawer
Panel lateral desplegable que contiene:
- **CartHeader**: Título y botón de cierre
- **CartItemList**: Lista scrolleable de productos
- **CartFooter**: Total, confirmación y botón de pago

### CartItem
Componente individual de producto que muestra:
- Imagen del producto
- Nombre y precio
- Controles de cantidad (+/-)
- Botón de eliminar

## Uso

### Agregar Productos
Los productos se agregan automáticamente al carrito cuando el usuario clickea "Agregar al carrito" en los productos mostrados en el chat.

### Ver Carrito
Click en el botón flotante de la esquina superior derecha.

### Modificar Cantidades
Usar los botones +/- en cada producto dentro del carrito.

### Pagar
1. Marcar el checkbox "Confirmo que los productos son los que he elegido"
2. Clickear el botón "PAGAR"
3. El carrito se cierra y el agente toma el control del proceso de pago

## Características Técnicas

### Estado Global
- Gestionado por `CartContext`
- Persistencia en localStorage
- Sincronización automática con el checkout del agente

### Responsive
- Desktop: 380px de ancho
- Mobile: 100% de ancho
- Botón adaptativo según tamaño de pantalla

### Accesibilidad
- Navegación por teclado completa
- Cierre con tecla ESC
- Aria labels apropiados
- Contraste de colores adecuado

### Animaciones
- Slide-in desde la derecha (300ms)
- Fade del overlay (200ms)
- Hover effects en todos los botones
- Transiciones suaves

## Integración con el Agente

Cuando el usuario paga desde el carrito:
1. Se cierra el drawer
2. Se envía un mensaje al agente con:
   ```json
   {
     "action": "start_payment",
     "cart_items": [
       {
         "product_id": "...",
         "quantity": 2
       }
     ]
   }
   ```
3. El agente procesa el pago y continúa el flujo automáticamente

## Estilos

Los estilos utilizan la paleta de colores de JANDI:
- `--jandi-dark-blue`: Azul oscuro principal
- `--jandi-medium-blue`: Azul medio para hover
- `--jandi-light-blue`: Azul claro para acentos
- `--jandi-background`: Fondo claro
- `--jandi-white`: Blanco

## Archivos

```
/components/Cart/
├── CartButton.tsx       # Botón flotante
├── CartDrawer.tsx       # Drawer principal
├── CartHeader.tsx       # Header del drawer
├── CartItemList.tsx     # Lista de items
├── CartItem.tsx         # Item individual
├── CartFooter.tsx       # Footer con pago
├── index.ts             # Exports
└── README.md            # Este archivo

/contexts/
└── CartContext.tsx      # Context Provider
```

## Mantenimiento

### Agregar Nuevas Funcionalidades
El carrito está diseñado de forma modular. Para agregar funcionalidades:
1. Agregar métodos al `CartContext`
2. Actualizar la interfaz `CartContextType`
3. Implementar en los componentes correspondientes

### Personalizar Estilos
Los estilos inline pueden ser movidos a un archivo CSS separado si se prefiere. Actualmente están inline para mejor encapsulación.

## Testing

Para probar el carrito:
1. Iniciar la aplicación
2. Buscar productos en el chat
3. Agregar productos al carrito
4. Abrir el carrito (botón superior derecho)
5. Modificar cantidades
6. Confirmar y pagar

---

**Implementado:** 25 de enero de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Producción
