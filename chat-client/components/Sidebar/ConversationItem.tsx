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
import { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { ConversationListItem } from '../../utils/conversationHelpers';

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

function ConversationItem({ conversation, isActive, onClick, onDelete, onRename }: ConversationItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) onDelete();
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onRename) onRename();
  };

  return (
    <div
      onClick={onClick}
      className="relative px-3 py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group"
      style={{
        backgroundColor: isActive ? 'rgba(55, 183, 195, 0.2)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--jandi-light-blue)' : '3px solid transparent',
      }}
      onMouseEnter={() => {
        if (!isActive) {
          const target = document.getElementById(`conv-${conversation.id}`);
          if (target) {
            target.style.backgroundColor = 'rgba(8, 131, 149, 0.4)';
          }
        }
      }}
      onMouseLeave={() => {
        if (!isActive) {
          const target = document.getElementById(`conv-${conversation.id}`);
          if (target) {
            target.style.backgroundColor = 'transparent';
          }
        }
        setShowMenu(false);
      }}
      id={`conv-${conversation.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-medium truncate"
            style={{
              color: isActive ? 'var(--jandi-light-blue)' : 'var(--jandi-white)',
            }}
          >
            {conversation.title}
          </h3>
          {conversation.lastMessage && (
            <p
              className="text-xs truncate mt-1"
              style={{
                color: 'var(--jandi-gray-light)',
                opacity: 0.7,
              }}
            >
              {conversation.lastMessage}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={handleMenuClick}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              backgroundColor: 'rgba(78, 102, 136, 0.5)',
            }}
            aria-label="Opciones"
          >
            <MoreVertical size={16} style={{ color: 'var(--jandi-white)' }} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-8 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
              style={{
                backgroundColor: 'var(--jandi-medium-blue)',
              }}
            >
              {onRename && (
                <button
                  type="button"
                  onClick={handleRename}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-80 transition-all"
                  style={{
                    color: 'var(--jandi-white)',
                  }}
                >
                  <Edit2 size={14} />
                  <span>Renombrar</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-opacity-80 transition-all"
                  style={{
                    color: '#EF4444',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationItem;
