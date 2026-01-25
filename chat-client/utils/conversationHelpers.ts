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
import type { ChatMessage } from '../types';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  contextId?: string | null;
  taskId?: string | null;
}

export interface ConversationListItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

export interface GroupedConversations {
  [key: string]: ConversationListItem[];
}

/**
 * Genera un título para la conversación basado en el primer mensaje del usuario
 */
export function generateConversationTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((msg) => msg.sender === 'user' && msg.text && !msg.isUserAction);
  
  if (!firstUserMessage || !firstUserMessage.text) {
    return 'Nueva conversación';
  }

  const title = firstUserMessage.text.trim();
  return title.length > 40 ? `${title.substring(0, 40)}...` : title;
}

/**
 * Convierte una conversación a un item de lista
 */
export function conversationToListItem(conversation: Conversation): ConversationListItem {
  const lastMessage = conversation.messages
    .filter((msg) => msg.text && !msg.isLoading)
    .slice(-1)[0];

  return {
    id: conversation.id,
    title: conversation.title,
    lastMessage: lastMessage?.text || '',
    timestamp: conversation.updatedAt,
    messageCount: conversation.messages.length,
  };
}

/**
 * Agrupa conversaciones por fecha con días específicos
 */
export function groupByDate(conversations: ConversationListItem[]): GroupedConversations {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const grouped: GroupedConversations = {};

  conversations.forEach((conv) => {
    const diff = now - conv.timestamp;
    const daysAgo = Math.floor(diff / oneDayMs);

    let groupKey: string;
    if (daysAgo === 0) {
      groupKey = 'today';
    } else if (daysAgo === 1) {
      groupKey = 'yesterday';
    } else if (daysAgo <= 30) {
      groupKey = `day_${daysAgo}`;
    } else {
      groupKey = 'older';
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(conv);
  });

  return grouped;
}

/**
 * Búsqueda fuzzy simple en conversaciones
 */
export function searchConversations(
  conversations: ConversationListItem[],
  query: string
): ConversationListItem[] {
  if (!query.trim()) {
    return conversations;
  }

  const lowerQuery = query.toLowerCase();

  return conversations.filter((conv) => {
    const titleMatch = conv.title.toLowerCase().includes(lowerQuery);
    const messageMatch = conv.lastMessage.toLowerCase().includes(lowerQuery);
    return titleMatch || messageMatch;
  });
}

/**
 * Formatea timestamp a texto legible
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diff < oneDayMs) {
    // Hoy - mostrar hora
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 2 * oneDayMs) {
    // Ayer
    return 'Ayer';
  } else if (diff < 7 * oneDayMs) {
    // Esta semana - mostrar día
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  } else {
    // Más antiguo - mostrar fecha
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}

/**
 * Obtiene el nombre del grupo de fecha
 */
export function getDateGroupLabel(groupKey: string): string {
  if (groupKey === 'today') {
    return 'Hoy';
  } else if (groupKey === 'yesterday') {
    return 'Ayer';
  } else if (groupKey.startsWith('day_')) {
    const days = parseInt(groupKey.replace('day_', ''));
    return `Hace ${days} días`;
  } else if (groupKey === 'older') {
    return 'Más antiguos';
  }
  return groupKey;
}
