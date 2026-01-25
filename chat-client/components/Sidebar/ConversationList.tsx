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
import { useMemo, useState } from 'react';
import ConversationItem from './ConversationItem';
import type { ConversationListItem, GroupedConversations } from '../../utils/conversationHelpers';
import { groupByDate, getDateGroupLabel, searchConversations } from '../../utils/conversationHelpers';

interface ConversationListProps {
  conversations: ConversationListItem[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string) => void;
}

function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  searchQuery,
  onDeleteConversation,
  onRenameConversation,
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    // Filtrar conversaciones vacías (con título "Nueva conversación")
    const nonEmptyConversations = conversations.filter(
      (conv) => conv.title !== 'Nueva conversación'
    );
    return searchConversations(nonEmptyConversations, searchQuery);
  }, [conversations, searchQuery]);

  const groupedConversations: GroupedConversations = useMemo(() => {
    return groupByDate(filteredConversations);
  }, [filteredConversations]);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          className="text-6xl mb-4"
          style={{
            color: 'var(--jandi-light-blue)',
            opacity: 0.5,
          }}
        >
          💬
        </div>
        <h3
          className="text-lg font-medium mb-2"
          style={{
            color: 'var(--jandi-white)',
          }}
        >
          No hay conversaciones
        </h3>
        <p
          className="text-sm"
          style={{
            color: 'var(--jandi-gray-light)',
            opacity: 0.7,
          }}
        >
          Comienza un nuevo chat con JANDI
        </p>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div
          className="text-6xl mb-4"
          style={{
            color: 'var(--jandi-light-blue)',
            opacity: 0.5,
          }}
        >
          🔍
        </div>
        <h3
          className="text-lg font-medium mb-2"
          style={{
            color: 'var(--jandi-white)',
          }}
        >
          No se encontraron resultados
        </h3>
        <p
          className="text-sm"
          style={{
            color: 'var(--jandi-gray-light)',
            opacity: 0.7,
          }}
        >
          Intenta con otros términos de búsqueda
        </p>
      </div>
    );
  }

  const renderGroup = (groupKey: string) => {
    const group = groupedConversations[groupKey];
    if (!group || group.length === 0) return null;

    return (
      <div key={groupKey} className="mb-4">
        <h4
          className="px-5 py-2 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: 'var(--jandi-gray-light)',
            opacity: 0.6,
          }}
        >
          {getDateGroupLabel(groupKey)}
        </h4>
        <div className="space-y-1">
          {group.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentConversationId}
              onClick={() => onSelectConversation(conv.id)}
              onDelete={() => onDeleteConversation(conv.id)}
              onRename={() => onRenameConversation(conv.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Ordenar las claves de los grupos
  const sortedGroupKeys = Object.keys(groupedConversations).sort((a, b) => {
    const order: Record<string, number> = { today: 0, yesterday: 1 };
    
    if (a in order && b in order) return order[a] - order[b];
    if (a in order) return -1;
    if (b in order) return 1;
    
    if (a.startsWith('day_') && b.startsWith('day_')) {
      const daysA = parseInt(a.replace('day_', ''));
      const daysB = parseInt(b.replace('day_', ''));
      return daysA - daysB;
    }
    
    if (a.startsWith('day_')) return -1;
    if (b.startsWith('day_')) return 1;
    
    return 0;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <h2
        className="px-5 py-3 text-sm font-bold uppercase tracking-wider"
        style={{
          color: 'var(--jandi-white)',
        }}
      >
        Tus Chats
      </h2>
      <div className="pb-4">
        {sortedGroupKeys.map((groupKey) => renderGroup(groupKey))}
      </div>
    </div>
  );
}

export default ConversationList;
