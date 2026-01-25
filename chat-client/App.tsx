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
import {useEffect, useRef, useState, useMemo, lazy, Suspense} from 'react';
import ChatInput from './components/ChatInput';
import ChatMessageComponent from './components/ChatMessage';
import Header from './components/Header';
import VoiceHome from './components/VoiceHome/VoiceHome';
import { Sidebar, ToggleSidebarButton } from './components/Sidebar';
import { ChatHome } from './components/ChatHome';
import {appConfig} from './config';
import {CredentialProviderProxy} from './mocks/credentialProviderProxy';
import { ConversationProvider, useConversations } from './contexts/ConversationContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { useSidebar } from './hooks/useSidebar';
import { useWindowSize } from './hooks/useWindowSize';
import { CartButton, CartDrawer } from './components/Cart';

import {type ChatMessage, type PaymentInstrument, type Product, Sender, type Checkout, type PaymentHandler} from './types';

// Lazy load del SplashCursor para mejor performance inicial
const SplashCursor = lazy(() => import('./components/SplashCursor/SplashCursor'));

type InteractionMode = 'voice' | 'text';
type UISurface = 'voiceHome' | 'chat';

type RequestPart =
  | {type: 'text'; text: string}
  | {type: 'data'; data: Record<string, unknown>};

function createChatMessage(
  sender: Sender,
  text: string,
  props: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    sender,
    text,
    ...props,
  };
}

/**
 * Componente interno que usa el ConversationContext
 */
function AppContent() {
  const [user_email, _setUserEmail] = useState<string | null>('foo@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const credentialProvider = useRef(new CredentialProviderProxy());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { isOpen, toggle, close } = useSidebar();
  const { isMobile, isDesktop } = useWindowSize();

  // Hook del carrito
  const {
    items: cartItems,
    isOpen: isCartOpen,
    isConfirmed,
    total: cartTotal,
    addItem,
    removeItem,
    updateQuantity,
    toggleCart,
    closeCart,
    toggleConfirmation,
    clearCart,
    getItemCount,
  } = useCart();

  // Usar el context de conversaciones
  const {
    currentConversationId,
    getCurrentMessages,
    updateConversationMessages,
    createNewConversation,
    setContextId,
    setTaskId,
    getContextId,
    getTaskId,
  } = useConversations();

  // Obtener mensajes de la conversación actual
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getCurrentMessages();
  });

  // Usar ref para evitar loops de sincronización
  const isUpdatingFromContext = useRef(false);

  // Sincronizar mensajes cuando cambia la conversación
  useEffect(() => {
    isUpdatingFromContext.current = true;
    setMessages(getCurrentMessages());
    // Pequeño delay para permitir que el render se complete
    setTimeout(() => {
      isUpdatingFromContext.current = false;
    }, 0);
  }, [currentConversationId, getCurrentMessages]);

  // Guardar mensajes en el context cuando cambian (pero no durante sincronización)
  // Usar un pequeño debounce para evitar actualizaciones muy frecuentes
  useEffect(() => {
    if (!isUpdatingFromContext.current && currentConversationId && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        updateConversationMessages(currentConversationId, messages);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentConversationId, updateConversationMessages]);

  // Crear conversación inicial si no existe
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

  // Detectar si es conversación vacía (sin mensajes)
  const isEmptyConversation = useMemo(() => {
    return messages.length === 0;
  }, [messages]);

  // Modo de interacción: solo texto (modo voz desactivado)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('text');

  // Detectar si el flujo determinístico está activo (checkout/payment)
  const isDeterministicFlowActive = useMemo(() => {
    return messages.some(
      (m) => !!m.checkout || !!m.paymentMethods || !!m.paymentInstrument
    );
  }, [messages]);

  // Determinar qué superficie mostrar
  const uiSurface: UISurface = useMemo(() => {
    if (isDeterministicFlowActive) {
      return 'chat'; // Forzar chat cuando hay checkout/payment
    }
    return interactionMode === 'voice' ? 'voiceHome' : 'chat';
  }, [isDeterministicFlowActive, interactionMode]);

  // contextId y taskId ahora vienen del ConversationContext
  const contextId = getContextId();
  const taskId = getTaskId();

  // Obtener último mensaje del bot para TTS
  const lastBotMessage = useMemo(() => {
    const botMessages = messages.filter((m) => m.sender === Sender.MODEL && m.text && !m.isLoading);
    return botMessages.length > 0 ? botMessages[botMessages.length - 1].text : undefined;
  }, [messages]);

  // Scroll to the bottom when new messages are added
  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      // Usar requestAnimationFrame para evitar parpadeos durante el render
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

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

  const handleStartPayment = () => {
    const actionPayload = JSON.stringify({action: 'start_payment'});
    handleSendMessage(actionPayload, {
      isUserAction: true,
    });
  };

  const handlePaymentMethodSelection = async (checkout: Checkout) => {
    if (!checkout || !checkout.payment || !checkout.payment.handlers) {
      const errorMessage = createChatMessage(
        Sender.MODEL,
        "Sorry, I couldn't retrieve payment methods.",
      );
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    //find the handler with id "example_payment_provider"
    const handler = checkout.payment.handlers.find(
      (handler: PaymentHandler) => handler.id === 'example_payment_provider',
    );
    if (!handler) {
      const errorMessage = createChatMessage(
        Sender.MODEL,
        "Sorry, I couldn't find the supported payment handler.",
      );
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    try {
      const paymentResponse =
        await credentialProvider.current.getSupportedPaymentMethods(
          user_email,
          handler.config,
        );
      const paymentMethods = paymentResponse.payment_method_aliases;

      const paymentSelectorMessage = createChatMessage(Sender.MODEL, '', {
        paymentMethods,
      });
      setMessages((prev) => [...prev, paymentSelectorMessage]);
    } catch (error) {
      console.error('Failed to resolve mandate:', error);
      const errorMessage = createChatMessage(
        Sender.MODEL,
        "Sorry, I couldn't retrieve payment methods.",
      );
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handlePaymentMethodSelected = async (selectedMethod: string) => {
    // Hide the payment selector by removing it from the messages
    setMessages((prev) => prev.filter((msg) => !msg.paymentMethods));

    // Add a temporary user message
    const userActionMessage = createChatMessage(
      Sender.USER,
      `User selected payment method: ${selectedMethod}`,
      {isUserAction: true},
    );
    setMessages((prev) => [...prev, userActionMessage]);

    try {
      if (!user_email) {
        throw new Error('User email is not set.');
      }

      const paymentInstrument =
        await credentialProvider.current.getPaymentToken(
          user_email,
          selectedMethod,
        );

      if (!paymentInstrument || !paymentInstrument.credential) {
        throw new Error('Failed to retrieve payment credential');
      }

      const paymentInstrumentMessage = createChatMessage(Sender.MODEL, '', {
        paymentInstrument,
      });
      setMessages((prev) => [...prev, paymentInstrumentMessage]);
    } catch (error) {
      console.error('Failed to process payment mandate:', error);
      const errorMessage = createChatMessage(
        Sender.MODEL,
        "Sorry, I couldn't process the payment. Please try again.",
      );
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleConfirmPayment = async (paymentInstrument: PaymentInstrument) => {
    // Hide the payment confirmation component
    const userActionMessage = createChatMessage(
      Sender.USER,
      `User confirmed payment.`,
      {isUserAction: true},
    );
    // Let handleSendMessage manage the loading indicator
    setMessages((prev) => [
      ...prev.filter((msg) => !msg.paymentInstrument),
      userActionMessage,
    ]);

    try {
      const parts: RequestPart[] = [
        {type: 'data', data: {'action': 'complete_checkout'}},
        {
          type: 'data',
          data: {
            'a2a.ucp.checkout.payment_data': paymentInstrument,
            'a2a.ucp.checkout.risk_signals': {'data': 'some risk data'},
          },
        },
      ];

      await handleSendMessage(parts, {
        isUserAction: true,
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = createChatMessage(
        Sender.MODEL,
        'Sorry, there was an issue confirming your payment.',
      );
      // If handleSendMessage wasn't called, we might need to manually update state
      // In this case, we remove the loading indicator that handleSendMessage would have added
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]); // This assumes handleSendMessage added a loader
      setIsLoading(false); // Ensure loading is stopped on authorization error
    }
  };

  const handleSendMessage = async (
    messageContent: string | RequestPart[],
    options?: {isUserAction?: boolean; headers?: Record<string, string>},
  ) => {
    if (isLoading) return;

    const userMessage = createChatMessage(
      Sender.USER,
      options?.isUserAction
        ? '<User Action>'
        : typeof messageContent === 'string'
          ? messageContent
          : 'Sent complex data',
    );
    
    // Agregar mensaje del usuario y el indicador de carga en una sola operación
    const loadingMessage = createChatMessage(Sender.MODEL, '', {isLoading: true});
    if (userMessage.text) {
      setMessages((prev) => [...prev, userMessage, loadingMessage]);
    } else {
      setMessages((prev) => [...prev, loadingMessage]);
    }
    setIsLoading(true);

    try {
      const requestParts =
        typeof messageContent === 'string'
          ? [{type: 'text', text: messageContent}]
          : messageContent;

      const requestParams: {
        message: {
          role: string;
          parts: RequestPart[];
          messageId: string;
          kind: string;
          contextId?: string;
          taskId?: string;
        };
        configuration: {
          historyLength: number;
        };
      } = {
        message: {
          role: 'user',
          parts: requestParts,
          messageId: crypto.randomUUID(),
          kind: 'message',
        },
        configuration: {
          historyLength: 0,
        },
      };

      if (contextId) {
        requestParams.message.contextId = contextId;
      }
      if (taskId) {
        requestParams.message.taskId = taskId;
      }

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-A2A-Extensions':
          'https://ucp.dev/specification/reference?v=2026-01-11',
        'UCP-Agent':
          'profile="http://localhost:3000/profile/agent_profile.json"',
      };

      const response = await fetch('/api', {
        method: 'POST',
        headers: {...defaultHeaders, ...options?.headers},
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'message/send',
          params: requestParams,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Update context and task IDs from the response for subsequent requests
      if (data.result?.contextId) {
        setContextId(data.result.contextId);
      }
      //if there is a task and it's in one of the active states
      if (
        data.result?.id &&
        data.result?.status?.state in ['working', 'submitted', 'input-required']
      ) {
        setTaskId(data.result.id);
      } else {
        //if not reset taskId
        setTaskId(null);
      }

      const combinedBotMessage = createChatMessage(Sender.MODEL, '');

      const responseParts =
        data.result?.parts || data.result?.status?.message?.parts || [];

      for (const part of responseParts) {
        if (part.text) {
          // Simple text
          combinedBotMessage.text +=
            (combinedBotMessage.text ? '\n' : '') + part.text;
        } else if (part.data?.['a2a.product_results']) {
          // Product results
          combinedBotMessage.text +=
            (combinedBotMessage.text ? '\n' : '') +
            (part.data['a2a.product_results'].content || '');
          combinedBotMessage.products =
            part.data['a2a.product_results'].results;
        } else if (part.data?.['a2a.ucp.checkout']) {
          // Checkout
          combinedBotMessage.checkout = part.data['a2a.ucp.checkout'];
        }
      }

      const newMessages: ChatMessage[] = [];
      const hasContent =
        combinedBotMessage.text ||
        combinedBotMessage.products ||
        combinedBotMessage.checkout;
      if (hasContent) {
        newMessages.push(combinedBotMessage);
      }

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev.slice(0, -1), ...newMessages]);
      } else {
        const fallbackResponse =
          "Sorry, I received a response I couldn't understand.";
        setMessages((prev) => [
          ...prev.slice(0, -1),
          createChatMessage(Sender.MODEL, fallbackResponse),
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = createChatMessage(
        Sender.MODEL,
        'Sorry, something went wrong. Please try again.',
      );
      // Replace the placeholder with the error message
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const lastCheckoutIndex = messages.map((m) => !!m.checkout).lastIndexOf(true);

  // Handler para pago desde el carrito
  const handlePayFromCart = async () => {
    if (!isConfirmed || cartItems.length === 0) return;
    
    closeCart(); // Cerrar el drawer
    
    // Enviar acción de inicio de pago al agente
    const actionPayload = JSON.stringify({
      action: 'start_payment',
      cart_items: cartItems.map(item => ({
        product_id: item.product.productID,
        quantity: item.quantity,
      })),
    });
    
    await handleSendMessage(actionPayload, {isUserAction: true});
  };

  // Renderizar según superficie activa
  if (uiSurface === 'voiceHome') {
    return (
      <>
        {/* SplashCursor solo en desktop */}
        {!isMobile && (
          <Suspense fallback={null}>
            <SplashCursor />
          </Suspense>
        )}
        <VoiceHome
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          lastBotMessage={lastBotMessage}
          onSwitchToChat={() => setInteractionMode('text')}
        />
      </>
    );
  }

  // Vista Chat (tradicional o forzada por flujo determinístico)
  return (
    <div className="flex h-screen max-h-screen font-sans" style={{ backgroundColor: 'var(--jandi-background)' }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onClose={close}
        onToggle={toggle}
        logoUrl={appConfig.logoUrl}
        userEmail={user_email || 'usuario@jandi.com'}
        userName="Usuario"
      />

      {/* Main Content */}
      <div 
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: isMobile ? '0' : (isOpen ? '280px' : '64px'),
        }}
      >
        {/* Renderizado condicional: ChatHome o Chat normal */}
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
            <main
              ref={chatContainerRef}
              className="flex-grow overflow-y-auto p-4 md:p-6 space-y-2">
              {messages.map((msg, index) => (
                <ChatMessageComponent
                  key={msg.id}
                  message={msg}
                  onAddToCart={handleAddToCheckout}
                  onCheckout={
                    msg.checkout?.status !== 'ready_for_complete'
                      ? handleStartPayment
                      : undefined
                  }
                  onSelectPaymentMethod={handlePaymentMethodSelected}
                  onConfirmPayment={handleConfirmPayment}
                  onCompletePayment={
                    msg.checkout?.status === 'ready_for_complete'
                      ? handlePaymentMethodSelection
                      : undefined
                  }
                  isLastCheckout={index === lastCheckoutIndex}></ChatMessageComponent>
              ))}
            </main>
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </>
        )}
      </div>

      {/* Cart Components - Siempre renderizados */}
      <CartButton
        itemCount={getItemCount()}
        onClick={toggleCart}
        isOpen={isCartOpen}
      />
      
      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        items={cartItems}
        total={cartTotal}
        isConfirmed={isConfirmed}
        onToggleConfirmation={toggleConfirmation}
        onPay={handlePayFromCart}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}

/**
 * An example A2A chat client that demonstrates consuming a business's A2A Agent with UCP Extension.
 * Only for demo purposes, not intended for production use.
 */
function App() {
  return (
    <ConversationProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </ConversationProvider>
  );
}

export default App;
