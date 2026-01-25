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
import { useState, useMemo } from 'react';
import SidebarHeader from './SidebarHeader';
import SearchBar from './SearchBar';
import ConversationList from './ConversationList';
import UserProfile from './UserProfile';
import { conversationToListItem } from '../../utils/conversationHelpers';
import { useConversations } from '../../contexts/ConversationContext';
import { useWindowSize } from '../../hooks/useWindowSize';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  logoUrl: string;
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

function Sidebar({ isOpen, onClose, onToggle, logoUrl, userEmail, userName, onLogout, onSettings }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile } = useWindowSize();

  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const conversationListItems = useMemo(() => {
    return conversations.map(conversationToListItem);
  }, [conversations]);

  const handleNewChat = () => {
    createNewConversation();
    // En mobile, cerrar el sidebar después de crear nuevo chat
    if (isMobile) {
      onClose();
    }
  };

  const handleSelectConversation = (id: string) => {
    switchConversation(id);
    // En mobile, cerrar el sidebar después de seleccionar
    if (isMobile) {
      onClose();
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      deleteConversation(id);
    }
  };

  const handleRenameConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    const newTitle = window.prompt('Nuevo nombre para la conversación:', conversation.title);
    if (newTitle && newTitle.trim()) {
      renameConversation(id, newTitle.trim());
    }
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          style={{
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full z-40 flex flex-col shadow-xl"
        style={{
          width: isOpen ? (isMobile ? '100%' : '280px') : (isMobile ? '0' : '64px'),
          maxWidth: '320px',
          backgroundColor: 'var(--jandi-dark-blue)',
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {isOpen ? (
          <>
            <SidebarHeader onNewChat={handleNewChat} onClose={onClose} logoUrl={logoUrl} />
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            <ConversationList
              conversations={conversationListItems}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
            />
            <UserProfile
              userEmail={userEmail}
              userName={userName}
              onLogout={onLogout}
              onSettings={onSettings}
            />
          </>
        ) : (
          !isMobile && (
            <div className="flex flex-col h-full">
              {/* Logo arriba sobre fondo blanco - clickeable para abrir */}
              <div
                className="flex items-center justify-center p-4"
                style={{
                  backgroundColor: 'var(--jandi-white)',
                }}
              >
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label="Abrir sidebar"
                  title="Abrir sidebar"
                >
                  <img
                    src="/images/logo.png"
                    alt="JANDI Logo"
                    className="w-12 h-12 object-contain"
                  />
                </button>
              </div>

              {/* Línea divisoria */}
              <div
                className="w-full h-px"
                style={{
                  backgroundColor: 'rgba(8, 131, 149, 0.3)',
                }}
              />

              {/* Espaciador flexible */}
              <div className="flex-grow" />

              {/* Usuario abajo */}
              <div
                className="border-t"
                style={{
                  borderColor: 'rgba(8, 131, 149, 0.3)',
                }}
              >
                <button
                  type="button"
                  onClick={onToggle}
                  className="w-full p-4 flex items-center justify-center hover:bg-opacity-50 transition-all duration-200"
                  aria-label="Abrir sidebar"
                  title="Abrir sidebar"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs"
                    style={{
                      backgroundColor: 'var(--jandi-light-blue)',
                      color: 'var(--jandi-white)',
                    }}
                  >
                    {userName
                      ? userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)
                      : userEmail.substring(0, 2).toUpperCase()}
                  </div>
                </button>
              </div>
            </div>
          )
        )}
      </aside>
    </>
  );
}

export default Sidebar;
