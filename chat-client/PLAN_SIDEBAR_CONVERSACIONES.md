# Plan Detallado: Implementación de Sidebar de Conversaciones para JANDI

## 📋 Resumen Ejecutivo

Implementación de una barra lateral desplegable (sidebar) para el chat de JANDI que permitirá gestionar múltiples conversaciones, similar a la interfaz de ChatGPT. El diseño priorizará la calidez, confianza y usabilidad, utilizando una paleta de colores coherente y moderna.

---

## 🎨 Diseño Visual y Paleta de Colores

### Paleta Principal 
```
#332D56 - Morado oscuro (sidebar background, elementos principales)
#4E6688 - Azul grisáceo (hover states, bordes, elementos secundarios)
#71C0BB - Turquesa (acentos, elementos activos, highlights)
#E3EEB2 - Verde claro (fondo del chat principal)
```

### Aplicación de Colores
- **Sidebar background**: `#332D56` (morado oscuro, da profesionalismo y calidez)
- **Hover en items**: `#4E6688` con opacidad 50%
- **Conversación activa**: `#71C0BB` con opacidad 20% de fondo, texto en turquesa
- **Botones de acción**: `#71C0BB` como color primario
- **Chat background**: `#E3EEB2` (mantiene la sensación cálida y relajante)
- **Texto en sidebar**: Blanco/gris claro para contraste sobre fondo oscuro
- **Bordes y separadores**: `#4E6688` con 30% de opacidad

---

## 📐 Estructura de Componentes

### 1. Componente Principal: `Sidebar.tsx`
**Ubicación**: `/chat-client/components/Sidebar/Sidebar.tsx`

**Props**:
```typescript
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  userEmail: string | null;
  userName?: string;
}
```

**Responsabilidades**:
- Gestionar el estado de apertura/cierre
- Renderizar la estructura completa del sidebar
- Coordinar los sub-componentes
- Animaciones de transición

---

### 2. Sub-componente: `SidebarHeader.tsx`
**Ubicación**: `/chat-client/components/Sidebar/SidebarHeader.tsx`

**Contenido**:
- Logo de JANDI (tamaño reducido, 32x32px)
- Botón "Nuevo Chat" (icono + texto)
- Botón de cerrar sidebar (solo visible cuando está abierto)

**Props**:
```typescript
interface SidebarHeaderProps {
  onNewChat: () => void;
  onClose: () => void;
  logoUrl: string;
}
```

---

### 3. Sub-componente: `SearchBar.tsx`
**Ubicación**: `/chat-client/components/Sidebar/SearchBar.tsx`

**Props**:
```typescript
interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}
```

**Características**:
- Input con icono de búsqueda
- Búsqueda en tiempo real (debounced 300ms)
- Clear button cuando hay texto
- Placeholder: "Buscar chats..."

---

### 4. Sub-componente: `ConversationList.tsx`
**Ubicación**: `/chat-client/components/Sidebar/ConversationList.tsx`

**Props**:
```typescript
interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}
```

**Características**:
- Lista scrolleable de conversaciones
- Agrupación por fecha (Hoy, Ayer, Últimos 7 días, Últimos 30 días, Más antiguos)
- Título de sección "Tus Chats"
- Truncamiento de texto largo con ellipsis
- Highlight de conversación activa

---

### 5. Sub-componente: `ConversationItem.tsx`
**Ubicación**: `/chat-client/components/Sidebar/ConversationItem.tsx`

**Props**:
```typescript
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}
```

**Características**:
- Título de la conversación (máximo 2 líneas)
- Hover state con acciones (menú de 3 puntos)
- Menú contextual: Renombrar, Eliminar
- Indicador visual de conversación activa
- Animación suave al hacer hover

---

### 6. Sub-componente: `UserProfile.tsx`
**Ubicación**: `/chat-client/components/Sidebar/UserProfile.tsx`

**Props**:
```typescript
interface UserProfileProps {
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}
```

**Características**:
- Avatar con iniciales o imagen
- Nombre de usuario y email
- Dropdown al hacer clic
- Opciones del menú:
  - Upgrade plan
  - Personalization
  - Settings
  - Help
  - Log out

---

### 7. Componente: `ToggleSidebarButton.tsx`
**Ubicación**: `/chat-client/components/Sidebar/ToggleSidebarButton.tsx`

**Props**:
```typescript
interface ToggleSidebarButtonProps {
  isOpen: boolean;
  onClick: () => void;
}
```

**Características**:
- Botón flotante cuando el sidebar está cerrado
- Icono de hamburguesa/close
- Posición fija en la esquina superior izquierda
- Animación de rotación al cambiar estado
- Z-index alto para estar siempre visible

---

## 🔧 Estado y Gestión de Datos

### Context API: `ConversationContext.tsx`
**Ubicación**: `/chat-client/contexts/ConversationContext.tsx`

```typescript
interface ConversationContextValue {
  conversations: Conversation[];
  currentConversationId: string | null;
  createNewConversation: () => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  updateConversationMessages: (id: string, messages: ChatMessage[]) => void;
  getCurrentMessages: () => ChatMessage[];
}
```

**Almacenamiento**:
- LocalStorage para persistencia
- Estructura de datos:
```typescript
interface StoredData {
  conversations: {
    [id: string]: {
      id: string;
      title: string;
      messages: ChatMessage[];
      createdAt: number;
      updatedAt: number;
    }
  };
  currentConversationId: string | null;
}
```

---

## 🎭 Comportamiento y Animaciones

### Transiciones del Sidebar

**Apertura/Cierre**:
- Duración: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Ancho: 0 → 280px (desktop) / fullscreen (mobile)
- Opacity: 0 → 1
- Transform: `translateX(-100%) → translateX(0)`

**Overlay en móvil**:
- Cuando el sidebar está abierto en móvil, mostrar overlay semi-transparente
- Color: `rgba(0, 0, 0, 0.5)`
- Click en overlay cierra el sidebar

### Hover States
- Items de conversación: background `#4E6688` con 40% opacity
- Botones: transform scale(1.02) + brillo aumentado
- Duración: 150ms

### Estados Activos
- Conversación seleccionada: 
  - Background: `#71C0BB` con 20% opacity
  - Border left: 3px solid `#71C0BB`
  - Color de texto: `#71C0BB` (más brillante)

---

## 📱 Responsive Design

### Desktop (> 768px)
- Sidebar ancho: 280px
- Siempre visible cuando está abierto
- Botón de toggle en el header del sidebar
- Chat se ajusta para dar espacio al sidebar

### Tablet (768px - 1024px)
- Sidebar ancho: 260px
- Comportamiento similar a desktop
- Puede ocultarse automáticamente para dar más espacio al chat

### Mobile (< 768px)
- Sidebar ocupa 100% del ancho (max 320px)
- Overlay oscuro sobre el chat cuando está abierto
- Cierre automático al seleccionar una conversación
- Botón flotante para abrir sidebar
- Gestos de swipe para abrir/cerrar

---

## 🛠️ Plan de Implementación Detallado

### **Fase 1: Preparación y Estructura Base** (Sesión 1)

#### 1.1. Crear Estructura de Carpetas
```
/chat-client/components/Sidebar/
  ├── Sidebar.tsx
  ├── SidebarHeader.tsx
  ├── SearchBar.tsx
  ├── ConversationList.tsx
  ├── ConversationItem.tsx
  ├── UserProfile.tsx
  ├── ToggleSidebarButton.tsx
  └── index.ts (exports)

/chat-client/contexts/
  └── ConversationContext.tsx

/chat-client/hooks/
  ├── useConversations.ts
  ├── useLocalStorage.ts
  └── useSidebar.ts

/chat-client/utils/
  └── conversationHelpers.ts
```

#### 1.2. Configurar Colores en Tailwind
- Crear/actualizar `tailwind.config.js`
- Añadir colores personalizados:
```javascript
colors: {
  jandi: {
    purple: '#332D56',
    blue: '#4E6688',
    teal: '#71C0BB',
    cream: '#E3EEB2',
  }
}
```

#### 1.3. Instalar Dependencias Adicionales
```bash
npm install clsx
npm install lucide-react  # Para iconos consistentes
```

---

### **Fase 2: Context y Lógica de Estado** (Sesión 2)

#### 2.1. Crear ConversationContext
- Definir interface de datos
- Implementar funciones CRUD para conversaciones
- Integrar con LocalStorage
- Añadir funciones de búsqueda y filtrado

#### 2.2. Crear Custom Hooks
- `useConversations`: Wrapper del context
- `useLocalStorage`: Abstracción de localStorage con TypeScript
- `useSidebar`: Gestión del estado de apertura/cierre

#### 2.3. Crear Helpers
- `conversationHelpers.ts`:
  - `generateConversationTitle()`: Genera título basado en primer mensaje
  - `groupByDate()`: Agrupa conversaciones por fecha
  - `searchConversations()`: Búsqueda fuzzy
  - `formatTimestamp()`: Formatea fechas legibles

---

### **Fase 3: Componentes Base del Sidebar** (Sesión 3)

#### 3.1. ToggleSidebarButton
- Crear botón flotante con icono
- Implementar animaciones de rotación
- Posicionamiento fijo y responsivo
- Estados hover/active

#### 3.2. Sidebar Container
- Estructura HTML base
- Layout con flexbox
- Animaciones de entrada/salida
- Overlay para móvil
- Gestión de z-index

#### 3.3. SidebarHeader
- Logo de JANDI
- Botón "Nuevo Chat"
- Botón cerrar (desktop)
- Layout y estilos

---

### **Fase 4: Búsqueda y Lista de Conversaciones** (Sesión 4)

#### 4.1. SearchBar
- Input con icono
- Implementar debounce
- Clear button
- Estados focus/blur
- Integración con lógica de búsqueda

#### 4.2. ConversationList
- Scroll container
- Título de sección "Tus Chats"
- Agrupación por fechas
- Empty state cuando no hay conversaciones
- Loading state

#### 4.3. ConversationItem
- Layout de item
- Truncamiento de texto
- Estados hover/active
- Menú contextual (3 puntos)
- Animaciones

---

### **Fase 5: Perfil de Usuario** (Sesión 5)

#### 5.1. UserProfile Component
- Avatar con iniciales
- Info del usuario
- Dropdown menu
- Opciones del menú con iconos
- Animaciones del dropdown

#### 5.2. Integración con App
- Pasar datos de usuario desde App.tsx
- Implementar logout (si aplica)
- Links a settings (preparar rutas)

---

### **Fase 6: Integración con App Principal** (Sesión 6)

#### 6.1. Modificar App.tsx
- Envolver con ConversationProvider
- Integrar estado del sidebar
- Ajustar layout para dar espacio al sidebar
- Modificar fondo del chat a `#E3EEB2`

#### 6.2. Modificar Header.tsx
- **ELIMINAR** el botón "Modo Voz"
- Mantener solo el logo de JANDI
- Quitar el texto "tu personal shopper"
- Ajustar estilos para integración con sidebar

#### 6.3. Sincronizar Conversaciones
- Al crear nuevo mensaje, actualizar conversación actual
- Al cambiar de conversación, cargar mensajes correctos
- Mantener estado de contextId y taskId por conversación

---

### **Fase 7: Funcionalidades Avanzadas** (Sesión 7)

#### 7.1. Menú Contextual de Conversaciones
- Renombrar conversación
- Eliminar conversación con confirmación
- Animaciones del menú

#### 7.2. Generación Automática de Títulos
- Usar primer mensaje del usuario
- Limitar longitud a 40 caracteres
- Fallback: "Nueva conversación"

#### 7.3. Persistencia y Sincronización
- Guardar estado en cada cambio
- Recuperar estado al cargar la app
- Migración de conversación actual a sistema nuevo

---

### **Fase 8: Responsive y Mobile** (Sesión 8)

#### 8.1. Breakpoints y Media Queries
- Ajustar anchos según viewport
- Sidebar fullscreen en móvil
- Botón flotante bien posicionado

#### 8.2. Gestos Touch (Opcional)
- Implementar swipe para abrir/cerrar
- Touch events para menú contextual

#### 8.3. Overlay y Backdrop
- Implementar overlay semi-transparente
- Click outside cierra sidebar
- Bloqueo de scroll del chat cuando sidebar abierto

---

### **Fase 9: Pulido Visual y UX** (Sesión 9)

#### 9.1. Animaciones Finas
- Micro-interacciones en botones
- Smooth scrolling
- Stagger animations en lista de conversaciones
- Loading skeletons

#### 9.2. Estados Vacíos
- Mensaje cuando no hay conversaciones
- Sugerencias de uso
- Ilustración o icono grande

#### 9.3. Feedback Visual
- Toasts para acciones (eliminado, renombrado)
- Confirmaciones antes de eliminar
- Indicadores de carga

---

### **Fase 10: Testing y Optimización** (Sesión 10)

#### 10.1. Testing Manual
- Probar en diferentes viewports
- Verificar todas las interacciones
- Comprobar persistencia de datos
- Testing en diferentes navegadores

#### 10.2. Optimización de Performance
- Lazy loading de conversaciones antiguas
- Virtualización de lista si > 100 conversaciones
- Memoización de componentes pesados
- Optimización de re-renders

#### 10.3. Accesibilidad
- Navegación por teclado
- ARIA labels
- Focus management
- Screen reader support

---

## 🎯 Orden de Implementación Recomendado

### Día 1: Fundamentos
1. ✅ Crear estructura de carpetas
2. ✅ Configurar colores en Tailwind/CSS
3. ✅ Instalar dependencias
4. ✅ Crear ConversationContext básico
5. ✅ Crear hooks básicos

### Día 2: Componentes Core
6. ✅ Implementar ToggleSidebarButton
7. ✅ Crear Sidebar container con animaciones
8. ✅ Implementar SidebarHeader
9. ✅ Modificar Header.tsx (quitar modo voz)

### Día 3: Lista y Búsqueda
10. ✅ Implementar SearchBar
11. ✅ Crear ConversationList
12. ✅ Crear ConversationItem
13. ✅ Implementar agrupación por fechas

### Día 4: Usuario e Integración
14. ✅ Crear UserProfile con dropdown
15. ✅ Integrar Sidebar con App.tsx
16. ✅ Sincronizar mensajes con conversaciones
17. ✅ Cambiar fondo del chat a `#E3EEB2`

### Día 5: Funcionalidades y Pulido
18. ✅ Implementar menú contextual
19. ✅ Añadir rename y delete
20. ✅ Responsive design y mobile
21. ✅ Testing y ajustes finales

---

## 📝 Consideraciones Técnicas Importantes

### 1. Gestión de Estado
- Usar Context API para compartir estado de conversaciones
- Evitar prop drilling
- Memoizar selectores para evitar re-renders innecesarios

### 2. Persistencia
- LocalStorage como primera capa
- Límite de 5MB en localStorage (gestionar overflow)
- Compresión de datos antiguos si es necesario
- Backup en caso de corrupción de datos

### 3. Performance
- Lista virtualizada si hay > 50 conversaciones
- Debounce en búsqueda (300ms)
- Lazy loading de mensajes antiguos
- Memoización de componentes

### 4. Accesibilidad
- Keyboard navigation completa
- Focus trap en el sidebar cuando está abierto
- ARIA labels descriptivos
- Anuncios para screen readers en acciones importantes

### 5. Compatibilidad
- Testar en Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Chrome Mobile
- Fallbacks para navegadores antiguos

---

## 🚀 Mejoras Futuras (Post-MVP)

1. **Búsqueda Avanzada**
   - Búsqueda por contenido dentro de mensajes
   - Filtros por fecha
   - Tags/categorías

2. **Organización**
   - Carpetas/categorías
   - Favoritos/Pin conversaciones
   - Archivado de conversaciones antiguas

3. **Sincronización Cloud**
   - Backend para persistencia
   - Sync entre dispositivos
   - Backup automático

4. **Personalización**
   - Temas de color personalizables
   - Tamaño de fuente ajustable
   - Orden de conversaciones (fecha, nombre, manual)

5. **Compartir**
   - Exportar conversación
   - Compartir link a conversación
   - Colaboración multi-usuario

---

## 🎨 Referencias Visuales

### Estructura Visual del Sidebar

```
┌─────────────────────────┐
│  [≡] Logo   [+ Nuevo]  │  ← Header
├─────────────────────────┤
│  [🔍] Buscar chats...  │  ← Búsqueda
├─────────────────────────┤
│                         │
│  Tus Chats             │  ← Título sección
│                         │
│  ┌─────────────────┐  │
│  │ Conv 1      [⋮] │  │  ← Items
│  └─────────────────┘  │
│  ┌─────────────────┐  │
│  │ Conv 2      [⋮] │  │
│  └─────────────────┘  │
│  ...                   │  ← Lista scroll
│                         │
├─────────────────────────┤
│  [👤] Usuario ▼        │  ← Perfil
└─────────────────────────┘
```

### Paleta Aplicada

```
Sidebar:        #332D56 (fondo)
Hover items:    #4E6688 (40% opacity)
Item activo:    #71C0BB (20% opacity bg, borde izq sólido)
Botones:        #71C0BB (color primario)
Chat fondo:     #E3EEB2
Texto claro:    #FFFFFF / #F9FAFB
Texto oscuro:   #332D56
Acentos:        #71C0BB
```

---

## ✅ Checklist de Finalización

### Funcionalidad
- [ ] Sidebar abre y cierra suavemente
- [ ] Nueva conversación crea chat vacío con mensaje inicial
- [ ] Búsqueda filtra conversaciones en tiempo real
- [ ] Lista muestra todas las conversaciones agrupadas por fecha
- [ ] Click en conversación cambia a esos mensajes
- [ ] Menú contextual permite renombrar y eliminar
- [ ] Perfil de usuario muestra dropdown con opciones
- [ ] Botón toggle funciona desde cualquier punto

### Visual
- [ ] Colores aplicados según paleta definida
- [ ] Animaciones suaves y profesionales
- [ ] Hover states claros y consistentes
- [ ] Conversación activa claramente identificada
- [ ] Responsive en mobile, tablet y desktop
- [ ] Logo de JANDI visible y bien posicionado
- [ ] Fondo del chat en `#E3EEB2`
- [ ] Sin botón de "Modo Voz" en el header

### Persistencia
- [ ] Conversaciones se guardan en localStorage
- [ ] Al recargar, mantiene conversación actual
- [ ] Mensajes se asocian correctamente a cada conversación
- [ ] Eliminar conversación la quita del storage

### UX
- [ ] Feedback visual en todas las acciones
- [ ] Empty states informativos
- [ ] Loading states donde aplique
- [ ] Confirmación antes de eliminar
- [ ] Navegación intuitiva
- [ ] Performance fluida (no lag)

---

## 📚 Recursos y Archivos Clave

### Archivos a Modificar
1. `App.tsx` - Integración principal
2. `Header.tsx` - Quitar modo voz
3. `index.css` - Añadir variables de color
4. `config.ts` - Ajustar configuración de mensajes

### Archivos a Crear (listado completo)
1. `/components/Sidebar/Sidebar.tsx`
2. `/components/Sidebar/SidebarHeader.tsx`
3. `/components/Sidebar/SearchBar.tsx`
4. `/components/Sidebar/ConversationList.tsx`
5. `/components/Sidebar/ConversationItem.tsx`
6. `/components/Sidebar/UserProfile.tsx`
7. `/components/Sidebar/ToggleSidebarButton.tsx`
8. `/components/Sidebar/index.ts`
9. `/contexts/ConversationContext.tsx`
10. `/hooks/useConversations.ts`
11. `/hooks/useLocalStorage.ts`
12. `/hooks/useSidebar.ts`
13. `/utils/conversationHelpers.ts`

### Configuración Tailwind (si usa Tailwind)
Si el proyecto usa Tailwind CSS, actualizar configuración:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        jandi: {
          purple: '#332D56',
          blue: '#4E6688',
          teal: '#71C0BB',
          cream: '#E3EEB2',
        }
      }
    }
  }
}
```

Si **no** usa Tailwind, usar CSS custom properties en `index.css`:

```css
:root {
  --jandi-purple: #332D56;
  --jandi-blue: #4E6688;
  --jandi-teal: #71C0BB;
  --jandi-cream: #E3EEB2;
}
```

---

## 🎯 Resultado Final Esperado

Al completar este plan, la aplicación JANDI tendrá:

1. ✨ **Sidebar profesional** con diseño cálido y confiable
2. 📝 **Gestión completa de conversaciones** (crear, buscar, cambiar, eliminar)
3. 🎨 **Paleta de colores coherente** que transmite confianza
4. 📱 **Diseño responsive** que funciona en todos los dispositivos
5. 💾 **Persistencia local** de todas las conversaciones
6. 👤 **Perfil de usuario** con opciones y menú desplegable
7. 🚀 **Performance optimizada** con animaciones fluidas
8. ♿ **Accesibilidad básica** para todos los usuarios

El usuario podrá gestionar múltiples conversaciones con JANDI de forma intuitiva, manteniendo el historial organizado y accesible, todo con una interfaz moderna que inspira confianza y profesionalismo.

---

**Fecha de creación**: 25 de enero de 2026  
**Proyecto**: JANDI - Personal Shopper Chat  
**Documento**: Plan de Implementación v1.0
