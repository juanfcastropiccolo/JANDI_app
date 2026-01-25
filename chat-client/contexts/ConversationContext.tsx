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
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import type { Conversation } from '../utils/conversationHelpers';
import { generateConversationTitle } from '../utils/conversationHelpers';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface StoredData {
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;
}

interface ConversationContextValue {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  createNewConversation: () => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  updateConversationMessages: (id: string, messages: ChatMessage[]) => void;
  getCurrentMessages: () => ChatMessage[];
  setContextId: (contextId: string | null) => void;
  setTaskId: (taskId: string | null) => void;
  getContextId: () => string | null;
  getTaskId: () => string | null;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

const STORAGE_KEY = 'jandi-conversations';

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [storedData, setStoredData] = useLocalStorage<StoredData>(STORAGE_KEY, {
    conversations: {},
    currentConversationId: null,
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return Object.values(storedData.conversations).sort((a, b) => b.updatedAt - a.updatedAt);
  });

  // IMPORTANTE: Siempre iniciar sin conversación seleccionada
  // Esto fuerza que se cree una nueva conversación vacía cada vez que se abre JANDI
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Sincronizar con localStorage cuando cambian las conversaciones
  // IMPORTANTE: Nunca guardar currentConversationId para forzar inicio siempre en HOME
  useEffect(() => {
    const conversationsMap = conversations.reduce((acc, conv) => {
      acc[conv.id] = conv;
      return acc;
    }, {} as Record<string, Conversation>);

    setStoredData({
      conversations: conversationsMap,
      currentConversationId: null, // Siempre null para forzar nueva conversación al inicio
    });
  }, [conversations, setStoredData]);

  const createNewConversation = useCallback((): string => {
    const newId = crypto.randomUUID();
    const now = Date.now();

    const newConversation: Conversation = {
      id: newId,
      title: 'Nueva conversación',
      messages: [],
      createdAt: now,
      updatedAt: now,
      contextId: null,
      taskId: null,
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);

    return newId;
  }, []);

  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((conv) => conv.id !== id);
      
      // Si eliminamos la conversación actual, cambiar a la primera disponible
      if (id === currentConversationId) {
        const nextConv = filtered[0];
        setCurrentConversationId(nextConv?.id || null);
      }

      return filtered;
    });
  }, [currentConversationId]);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id
          ? { ...conv, title: newTitle, updatedAt: Date.now() }
          : conv
      )
    );
  }, []);

  const updateConversationMessages = useCallback((id: string, messages: ChatMessage[]) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== id) return conv;

        // Auto-generar título si es la primera vez que tiene mensajes
        const shouldUpdateTitle = conv.title === 'Nueva conversación' && messages.length > 0;
        const newTitle = shouldUpdateTitle ? generateConversationTitle(messages) : conv.title;

        return {
          ...conv,
          messages,
          title: newTitle,
          updatedAt: Date.now(),
        };
      }).sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }, []);

  const getCurrentMessages = useCallback((): ChatMessage[] => {
    if (!currentConversationId) return [];
    const current = conversations.find((conv) => conv.id === currentConversationId);
    return current?.messages || [];
  }, [currentConversationId, conversations]);

  const setContextId = useCallback((contextId: string | null) => {
    if (!currentConversationId) return;
    
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, contextId }
          : conv
      )
    );
  }, [currentConversationId]);

  const setTaskId = useCallback((taskId: string | null) => {
    if (!currentConversationId) return;
    
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, taskId }
          : conv
      )
    );
  }, [currentConversationId]);

  const getContextId = useCallback((): string | null => {
    if (!currentConversationId) return null;
    const current = conversations.find((conv) => conv.id === currentConversationId);
    return current?.contextId || null;
  }, [currentConversationId, conversations]);

  const getTaskId = useCallback((): string | null => {
    if (!currentConversationId) return null;
    const current = conversations.find((conv) => conv.id === currentConversationId);
    return current?.taskId || null;
  }, [currentConversationId, conversations]);

  const currentConversation = conversations.find((conv) => conv.id === currentConversationId) || null;

  const value: ConversationContextValue = {
    conversations,
    currentConversationId,
    currentConversation,
    createNewConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    updateConversationMessages,
    getCurrentMessages,
    setContextId,
    setTaskId,
    getContextId,
    getTaskId,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
}
