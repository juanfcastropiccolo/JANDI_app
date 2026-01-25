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
import { Send } from 'lucide-react';

interface ChatInputCenteredProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

function ChatInputCentered({ onSendMessage, isLoading }: ChatInputCenteredProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Necesito comprar café..."
        disabled={isLoading}
        autoComplete="off"
        className="w-full p-4 pr-14 text-lg rounded-2xl transition-all shadow-lg focus:outline-none focus:ring-4 focus:scale-[1.02]"
        style={{
          border: '2px solid var(--jandi-light-blue)',
          backgroundColor: 'var(--jandi-white)',
          color: 'var(--jandi-dark-blue)',
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = '0 8px 24px rgba(55, 183, 195, 0.25)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !inputValue.trim()}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: 'var(--jandi-light-blue)',
          color: 'var(--jandi-white)',
        }}
        aria-label="Enviar mensaje"
      >
        <Send size={20} />
      </button>
    </form>
  );
}

export default ChatInputCentered;
