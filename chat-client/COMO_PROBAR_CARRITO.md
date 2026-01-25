# 🧪 Cómo Probar el Carrito de Compras

## 🚀 Inicio Rápido

### 1. Iniciar la Aplicación

```bash
cd /Users/juanfcastropiccolo/Documents/Personal/UCP/samples/JANDI_app/chat-client
npm run dev
```

### 2. Abrir en el Navegador

Navegar a: `http://localhost:5173`

---

## 📋 Casos de Prueba

### ✅ Caso 1: Ver el Botón del Carrito

**Pasos:**
1. Abrir la aplicación
2. Buscar el botón flotante en la esquina superior derecha

**Resultado Esperado:**
- Botón circular con icono de bolsa de compras
- Color azul marino sobre fondo blanco
- Sin badge (carrito vacío)

---

### ✅ Caso 2: Agregar Productos al Carrito

**Pasos:**
1. En el chat, escribir: `"buscar leche"`
2. Esperar a que el bot muestre productos
3. Clickear "Agregar al carrito" en un producto
4. Observar el botón del carrito

**Resultado Esperado:**
- Badge aparece con el número "1"
- Producto se agrega al carrito local
- Mensaje se envía al agente

**Comandos de prueba:**
```
buscar leche
buscar pan
buscar café
necesito galletitas
```

---

### ✅ Caso 3: Abrir el Carrito

**Pasos:**
1. Agregar al menos un producto (ver Caso 2)
2. Clickear el botón flotante del carrito
3. Observar la animación

**Resultado Esperado:**
- Drawer se desliza desde la derecha (300ms)
- Overlay semi-transparente aparece detrás
- Chat queda sombreado pero visible
- Header muestra "Mi Carrito"
- Lista muestra los productos agregados

---

### ✅ Caso 4: Modificar Cantidades

**Pasos:**
1. Abrir el carrito (ver Caso 3)
2. Buscar los botones +/- en un producto
3. Clickear "+" varias veces
4. Clickear "-" para disminuir
5. Observar el total

**Resultado Esperado:**
- Cantidad aumenta/disminuye correctamente
- Total se actualiza en tiempo real
- Badge del botón se actualiza
- Al llegar a 0, el producto se elimina

---

### ✅ Caso 5: Eliminar Productos

**Pasos:**
1. Abrir el carrito con productos
2. Clickear el icono de basura (🗑️) en un producto
3. Observar la lista

**Resultado Esperado:**
- Producto desaparece de la lista
- Total se recalcula
- Badge se actualiza
- Si era el último producto, muestra mensaje "Tu carrito está vacío"

---

### ✅ Caso 6: Cerrar el Carrito

**Pasos:**
1. Abrir el carrito
2. Probar cada método de cierre:
   - a) Clickear la X en el header
   - b) Clickear fuera del drawer (en el overlay)
   - c) Presionar tecla ESC

**Resultado Esperado:**
- Drawer se cierra con animación
- Overlay desaparece
- Productos permanecen en el carrito
- Badge sigue mostrando la cantidad

---

### ✅ Caso 7: Confirmar y Pagar

**Pasos:**
1. Agregar varios productos al carrito
2. Abrir el carrito
3. Intentar clickear "PAGAR" (debe estar deshabilitado)
4. Marcar el checkbox de confirmación
5. Clickear "PAGAR"
6. Observar el chat

**Resultado Esperado:**
- Botón PAGAR deshabilitado sin checkbox
- Al marcar checkbox, botón se habilita
- Al clickear PAGAR:
  - Drawer se cierra
  - Mensaje aparece en el chat
  - Agente procesa el pago

---

### ✅ Caso 8: Persistencia (localStorage)

**Pasos:**
1. Agregar productos al carrito
2. Cerrar el carrito
3. Recargar la página (F5 o Cmd+R)
4. Abrir el carrito nuevamente

**Resultado Esperado:**
- Productos siguen en el carrito después de recargar
- Cantidades se mantienen
- Badge muestra la cantidad correcta

---

### ✅ Caso 9: Responsive - Mobile

**Pasos:**
1. Abrir DevTools (F12)
2. Activar modo responsive (Cmd+Shift+M)
3. Seleccionar "iPhone 12 Pro" o similar
4. Agregar productos y abrir carrito

**Resultado Esperado:**
- Botón más pequeño (48px)
- Drawer ocupa 100% del ancho
- Todos los controles son touch-friendly
- Scroll funciona correctamente

---

### ✅ Caso 10: Carrito Vacío

**Pasos:**
1. Asegurarse de que el carrito esté vacío
2. Abrir el carrito

**Resultado Esperado:**
- Icono de bolsa grande y gris
- Mensaje: "Tu carrito está vacío"
- Submensaje: "Agrega productos desde el chat"
- Botón PAGAR deshabilitado

---

## 🎨 Verificaciones Visuales

### Colores
- [ ] Botón flotante: Blanco con borde azul claro
- [ ] Badge: Azul claro (#37B7C3)
- [ ] Header drawer: Azul oscuro (#071952)
- [ ] Items: Fondo claro (#EBF4F6)
- [ ] Botón PAGAR: Azul claro (#37B7C3)

### Animaciones
- [ ] Drawer slide-in suave (300ms)
- [ ] Overlay fade-in (200ms)
- [ ] Hover effects en botones
- [ ] Transiciones de cantidad

### Espaciado
- [ ] Padding consistente (12px, 16px, 24px)
- [ ] Gap entre elementos (8px, 12px)
- [ ] Bordes redondeados (8px, 12px)

---

## 🐛 Problemas Comunes y Soluciones

### Problema: El botón no aparece
**Solución:** Verificar que el build se haya completado correctamente:
```bash
npm run build
npm run dev
```

### Problema: Los productos no se agregan
**Solución:** Verificar que el agente esté respondiendo correctamente. Revisar la consola del navegador (F12).

### Problema: El carrito no persiste
**Solución:** Verificar que localStorage esté habilitado en el navegador. Revisar la consola para errores.

### Problema: El drawer no se cierra con ESC
**Solución:** Asegurarse de que el drawer esté enfocado. Clickear dentro del drawer antes de presionar ESC.

---

## 🔍 Inspección Técnica

### Verificar Estado del Carrito

Abrir la consola del navegador (F12) y ejecutar:

```javascript
// Ver items en localStorage
JSON.parse(localStorage.getItem('jandi-cart'))

// Ver estado del carrito en React DevTools
// Buscar: CartProvider > value > items
```

### Verificar Eventos

En la consola, los siguientes eventos deberían aparecer:
- Al agregar: No hay console.log (silencioso)
- Al eliminar: No hay console.log (silencioso)
- Al pagar: Mensaje enviado al agente

---

## 📊 Checklist de Testing Completo

### Funcionalidad
- [ ] Agregar productos al carrito
- [ ] Modificar cantidades (+/-)
- [ ] Eliminar productos
- [ ] Abrir/cerrar drawer
- [ ] Confirmar y pagar
- [ ] Persistencia en localStorage

### UI/UX
- [ ] Botón flotante visible
- [ ] Badge muestra cantidad correcta
- [ ] Drawer se desliza suavemente
- [ ] Overlay sombrea correctamente
- [ ] Total se calcula bien
- [ ] Checkbox funciona
- [ ] Botón PAGAR se habilita/deshabilita

### Responsive
- [ ] Desktop (>768px)
- [ ] Tablet (768px)
- [ ] Mobile (<768px)

### Accesibilidad
- [ ] Navegación por teclado
- [ ] Cierre con ESC
- [ ] Aria labels presentes
- [ ] Contraste de colores adecuado

### Performance
- [ ] Animaciones fluidas (60fps)
- [ ] No hay lag al abrir/cerrar
- [ ] Scroll suave en la lista
- [ ] Build sin errores

---

## 🎯 Resultado Esperado Final

Después de completar todos los casos de prueba, deberías tener:

✅ Un carrito funcional y fluido  
✅ Productos agregados y modificables  
✅ Pago integrado con el agente  
✅ Persistencia entre recargas  
✅ Responsive en todos los dispositivos  
✅ Accesible y con buena UX  

---

## 📞 Soporte

Si encuentras algún problema durante las pruebas:

1. Revisar la consola del navegador (F12)
2. Verificar que el agente esté corriendo
3. Limpiar localStorage: `localStorage.clear()`
4. Recargar la página
5. Revisar los logs del servidor

---

**Documento de Testing**  
**Versión:** 1.0  
**Fecha:** 25 de enero de 2026  
**Estado:** ✅ Listo para testing
