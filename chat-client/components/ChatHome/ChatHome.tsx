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
import ChatInputCentered from './ChatInputCentered';
import SuggestionChip from './SuggestionChip';
import TextType from '../TextType-simple';

interface ChatHomeProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  welcomeMessage: string;
}

function ChatHome({ onSendMessage, isLoading, welcomeMessage }: ChatHomeProps) {
  const suggestions = [
    "Explicame qué es JANDI",
    "Ver ofertas de la semana",
    "Mi lista de compras",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Mensaje de bienvenida grande con efecto typing */}
      <div className="text-center mb-12 welcome-message w-full max-w-5xl">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-4"
          style={{
            color: 'var(--jandi-dark-blue)',
            minHeight: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextType
            as="span"
            text={[
              "¿Qué vamos a comprar hoy? 🤙",
              "Programemos la compra de la semana... 😉",
              "Armemos tu lista de compras! 🗒️"
            ]}
            typingSpeed={90}
            deletingSpeed={50}
            pauseDuration={5000}
            initialDelay={500}
            loop={true}
            showCursor={true}
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
          />
        </h1>
      </div>

      {/* Input centrado */}
      <div className="w-full max-w-3xl mb-8">
        <ChatInputCentered onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>

      {/* Sugerencias */}
      <div className="flex flex-wrap gap-3 justify-center">
        {suggestions.map((suggestion, index) => (
          <SuggestionChip
            key={index}
            text={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
          />
        ))}
      </div>
    </div>
  );
}

export default ChatHome;
