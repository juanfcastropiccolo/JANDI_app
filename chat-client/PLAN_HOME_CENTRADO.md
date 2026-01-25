# 🎯 Plan: Home Centrado Estilo ChatGPT para JANDI

## 📋 Objetivo

Crear una experiencia de inicio de conversación similar a ChatGPT, donde:
1. Al comenzar una conversación nueva, el chat aparece **centrado** en la pantalla
2. Se muestra un mensaje grande y amigable: **"¿Qué vamos a comprar hoy?"**
3. El input de chat está **centrado verticalmente** en la pantalla
4. Después del **primer Enter** (primer mensaje del usuario), el chat cambia al layout normal (mensajes arriba, input abajo)

---

## 🎨 Referencia Visual (ChatGPT)

### Estado Inicial (Conversación Vacía)
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│    ¡Qué vamos a comprar hoy?! 👋    │ ← Mensaje grande centrado
│                                     │  
│    ┌──────────────────────────┐     │
│    │ [+] Necesito comprar cafe│     │  ← Input centrado
│    └──────────────────────────┘     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Después del Primer Mensaje
```
┌─────────────────────────────────────┐
│                                     │
│                        User: hola   │
│                                     │  ← Mensajes arriba
│ Bot: ¡Hola! ¿Cómo andás?            │
│                                     │
│                    (scroll area)    │
│                                     │
├─────────────────────────────────────┤
│ por favor comprame 3 leches enteras │  ← Input abajo
└─────────────────────────────────────┘
```

---

## 🏗️ Arquitectura de Implementación

### 1. Detectar Estado de la Conversación

**Condición para "Conversación Vacía":**
- Solo existe el mensaje inicial del sistema (`initialMessage`)
- No hay mensajes del usuario aún
- O bien, `messages.length === 1 && messages[0].sender === Sender.MODEL`

**Estado:**
```typescript
const isEmptyConversation = useMemo(() => {
  return messages.length === 1 && messages[0].id === 'initial';
}, [messages]);
```

---

### 2. Crear Componente `ChatHome` (Centrado)

**Ubicación:** `/components/ChatHome/ChatHome.tsx`

**Propósito:** Mostrar la vista centrada cuando no hay mensajes

**Props:**
```typescript
interface ChatHomeProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  welcomeMessage: string;
}
```

**Estructura Visual:**
```tsx
<div className="flex flex-col items-center justify-center h-full">
  {/* Mensaje de bienvenida grande */}
  <div className="text-center mb-8">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
      ¿Qué vamos a comprar hoy?
    </h1>
    <p className="text-lg text-gray-600">
      Soy JANDI, tu asistente de compras personal
    </p>
  </div>
  
  {/* Input centrado */}
  <div className="w-full max-w-3xl px-4">
    <ChatInputCentered onSendMessage={onSendMessage} isLoading={isLoading} />
  </div>
  
  {/* Sugerencias opcionales */}
  <div className="mt-8 flex gap-3">
    <SuggestionChip text="Buscar productos" />
    <SuggestionChip text="Ver ofertas" />
    <SuggestionChip text="Mi lista de compras" />
  </div>
</div>
```

---

### 3. Crear Componente `ChatInputCentered`

**Ubicación:** `/components/ChatInput/ChatInputCentered.tsx`

**Diferencias con `ChatInput` normal:**
- Sin bordes superiores (no está pegado al footer)
- Diseño más prominente y grande
- Padding y sombras más pronunciadas
- Animación de focus más notable

**Diseño:**
```tsx
<form onSubmit={handleSubmit} className="relative">
  <input
    type="text"
    placeholder="Escribe tu mensaje..."
    className="w-full p-4 pr-14 text-lg border-2 border-gray-300 rounded-2xl focus:border-jandi-light-blue focus:ring-4 focus:ring-jandi-light-blue focus:ring-opacity-20 transition-all shadow-lg"
  />
  <button
    type="submit"
    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-jandi-light-blue text-white p-3 rounded-full hover:scale-110 transition-all"
  >
    <SendIcon />
  </button>
</form>
```

---

### 4. Modificar `App.tsx` para Condicional Rendering

**Ubicación:** `/App.tsx`

**Lógica:**
```typescript
function AppContent() {
  // ... estado existente ...
  
  // Detectar si es conversación vacía
  const isEmptyConversation = useMemo(() => {
    return messages.length === 1 && messages[0].id === 'initial';
  }, [messages]);
  
  // ... resto del código ...
  
  return (
    <div className="flex h-screen">
      <ToggleSidebarButton isOpen={isOpen} onClick={toggle} />
      <Sidebar {...sidebarProps} />
      
      <div className="flex flex-col flex-1">
        <Header sidebarOpen={isOpen && !isMobile} />
        
        {/* Renderizado condicional */}
        {isEmptyConversation ? (
          // Vista centrada para conversación nueva
          <ChatHome
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            welcomeMessage="¿Qué vamos a comprar hoy?"
          />
        ) : (
          // Vista normal con mensajes
          <>
            <main ref={chatContainerRef} className="flex-grow overflow-y-auto">
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} {...} />
              ))}
            </main>
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
```

---

### 5. Componente Opcional: `SuggestionChip`

**Ubicación:** `/components/ChatHome/SuggestionChip.tsx`

**Propósito:** Mostrar sugerencias clickeables debajo del input

**Props:**
```typescript
interface SuggestionChipProps {
  text: string;
  onClick?: () => void;
}
```

**Diseño:**
```tsx
<button
  onClick={onClick}
  className="px-4 py-2 bg-white border-2 border-jandi-light-blue text-jandi-dark-blue rounded-full hover:bg-jandi-light-blue hover:text-white transition-all font-medium"
>
  {text}
</button>
```

---

## 📁 Estructura de Archivos a Crear/Modificar

### Archivos a Crear
```
/components/ChatHome/
  ├── ChatHome.tsx          # Vista centrada principal
  ├── SuggestionChip.tsx    # Chips de sugerencias
  └── index.ts              # Exports

/components/ChatInput/
  ├── ChatInputCentered.tsx # Input centrado para home
  └── index.ts              # Exports actualizados
```

### Archivos a Modificar
```
/App.tsx                    # Lógica condicional de renderizado
/components/Header.tsx      # Opcional: Ocultar header en vista centrada
/index.css                  # Estilos adicionales si es necesario
```

---

## 🎨 Estilos y Diseño

### Paleta de Colores (Aplicar JANDI)
```css
/* Mensaje de bienvenida */
--welcome-title: var(--jandi-dark-blue);      /* #071952 */
--welcome-subtitle: var(--jandi-medium-blue);  /* #088395 */

/* Input centrado */
--input-border: var(--jandi-light-blue);       /* #37B7C3 */
--input-focus-ring: rgba(55, 183, 195, 0.2);

/* Sugerencias */
--chip-border: var(--jandi-light-blue);
--chip-bg-hover: var(--jandi-light-blue);
```

### Responsive
```css
/* Desktop */
.welcome-title {
  font-size: 3rem; /* 48px */
}

/* Tablet */
@media (max-width: 1024px) {
  .welcome-title {
    font-size: 2.5rem; /* 40px */
  }
}

/* Mobile */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem; /* 32px */
  }
}
```

---

## 🔄 Flujo de Usuario

### Paso 1: Usuario Abre JANDI
```
Estado: isEmptyConversation = true
Vista: ChatHome (centrado)
Elementos visibles:
  - Mensaje grande: "¿Qué vamos a comprar hoy?"
  - Input centrado
  - Sugerencias (opcional)
```

### Paso 2: Usuario Escribe y Presiona Enter
```
Acción: handleSendMessage()
Efecto:
  1. Mensaje del usuario se agrega a messages[]
  2. isEmptyConversation cambia a false
  3. React re-renderiza automáticamente
  4. Vista cambia a layout normal
```

### Paso 3: Vista Normal
```
Estado: isEmptyConversation = false
Vista: Layout tradicional
Elementos visibles:
  - Header normal
  - Mensajes arriba (con scroll)
  - Input fijo abajo
  - Sidebar disponible
```

---

## 🧪 Testing y Casos de Uso

### Caso 1: Conversación Nueva
✅ Debe mostrar ChatHome centrado  
✅ Input debe estar centrado verticalmente  
✅ Mensaje de bienvenida debe ser visible  

### Caso 2: Primer Mensaje del Usuario
✅ Al enviar mensaje, debe cambiar a layout normal  
✅ Mensaje del usuario debe aparecer arriba  
✅ Input debe moverse abajo  
✅ Transición debe ser suave  

### Caso 3: Cambio de Conversación a Vacía
✅ Al crear nuevo chat, debe volver a ChatHome  
✅ Al cambiar a chat existente, debe mostrar mensajes  

### Caso 4: Responsive
✅ En mobile, el mensaje debe ajustarse  
✅ En desktop, debe verse centrado  
✅ Input debe ser responsive  

---

## ⚡ Consideraciones de Performance

### 1. Memoización
```typescript
const isEmptyConversation = useMemo(() => {
  return messages.length === 1 && messages[0].id === 'initial';
}, [messages]);
```

### 2. Lazy Loading (Opcional)
```typescript
const ChatHome = lazy(() => import('./components/ChatHome/ChatHome'));
```

### 3. Transiciones Suaves
```css
.chat-container {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 🎯 Animaciones y Transiciones

### Entrada del Mensaje de Bienvenida
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-message {
  animation: fadeInUp 600ms ease-out;
}
```

### Transición de Layout
```css
.chat-layout-transition {
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Input Focus
```css
.input-centered:focus {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(55, 183, 195, 0.2);
}
```

---

## 📝 Implementación Paso a Paso

### Fase 1: Componentes Base (30 min)
1. ✅ Crear `ChatHome.tsx` con estructura básica
2. ✅ Crear `ChatInputCentered.tsx`
3. ✅ Crear `SuggestionChip.tsx`
4. ✅ Exportar en `index.ts`

### Fase 2: Lógica en App.tsx (20 min)
5. ✅ Añadir `isEmptyConversation` memo
6. ✅ Implementar renderizado condicional
7. ✅ Verificar que funciona correctamente

### Fase 3: Estilos y Diseño (30 min)
8. ✅ Aplicar paleta de colores JANDI
9. ✅ Hacer responsive
10. ✅ Añadir animaciones

### Fase 4: Testing (20 min)
11. ✅ Probar conversación nueva
12. ✅ Probar primer mensaje
13. ✅ Probar cambio de conversación
14. ✅ Probar responsive

### Fase 5: Pulido (15 min)
15. ✅ Ajustar tipografías
16. ✅ Optimizar animaciones
17. ✅ Verificar accesibilidad

**Tiempo Total Estimado:** ~2 horas

---

## 🔍 Detalles Técnicos Adicionales

### Header en Vista Centrada
**Opción 1:** Ocultar completamente el header en ChatHome
```typescript
{!isEmptyConversation && <Header />}
```

**Opción 2:** Mostrar header minimalista
```typescript
<Header minimal={isEmptyConversation} />
```

### Sugerencias Inteligentes
Las sugerencias pueden ser dinámicas basadas en:
- Historial del usuario
- Ofertas del día
- Productos populares

```typescript
const suggestions = [
  "Explicame qué es JANDI",
  "Ver ofertas de la semana",
  "Mi lista de compras",
  "Productos recomendados",
];
```

---

## 🎨 Mockup Visual Detallado

### Vista Centrada (ChatHome)
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│          ┌─────────────────────┐            │ 
│          │                     │            │
│          │  ¿Qué vamos a       │            │ ← Mensaje grande
│          │  comprar hoy?       │            │   centrado
│          └─────────────────────┘            │
│                                             │
│     ┌───────────────────────────────┐       │
│     │ Necesito comprar cafe      🔵 │       │ ← Input centrado
│     └───────────────────────────────┘       │   grande
│                                             │
│   [Buscar productos] [Ver ofertas]          │ ← Chips de
│   [Mi lista de compras]                     │   sugerencias
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Transición al Primer Mensaje
```
1. Usuario escribe "buscar manzanas"
2. Presiona Enter
3. Animación: ChatHome fade out (300ms)
4. Layout cambia a normal
5. Mensaje aparece con fade in (300ms)
6. Bot responde
```

---

## ✅ Checklist de Implementación

### Componentes
- [ ] `ChatHome.tsx` creado
- [ ] `ChatInputCentered.tsx` creado
- [ ] `SuggestionChip.tsx` creado
- [ ] Exports configurados

### Lógica
- [ ] `isEmptyConversation` implementado
- [ ] Renderizado condicional en App.tsx
- [ ] Transición funciona correctamente
- [ ] No hay bugs al cambiar de vista

### Estilos
- [ ] Paleta JANDI aplicada
- [ ] Responsive en mobile, tablet, desktop
- [ ] Animaciones suaves
- [ ] Typography correcta

### Testing
- [ ] Conversación nueva muestra ChatHome
- [ ] Primer mensaje cambia a layout normal
- [ ] Cambio de conversación funciona
- [ ] No hay errores en consola

### Accesibilidad
- [ ] Aria labels correctos
- [ ] Navegación por teclado funcional
- [ ] Contraste de colores adecuado
- [ ] Screen reader compatible

---

## 🚀 Resultado Final Esperado

Al completar este plan, JANDI tendrá:

1. ✨ **Experiencia de inicio elegante** similar a ChatGPT
2. 🎯 **Mensaje de bienvenida prominente** que invita a interactuar
3. 📝 **Input centrado** que facilita comenzar la conversación
4. 🔄 **Transición suave** al layout normal después del primer mensaje
5. 📱 **Totalmente responsive** en todos los dispositivos
6. 🎨 **Diseño coherente** con la paleta de colores JANDI

---

**Creado:** 25 de enero de 2026  
**Autor:** Plan generado por IA  
**Estado:** Listo para implementación  
**Tiempo estimado:** 2 horas
