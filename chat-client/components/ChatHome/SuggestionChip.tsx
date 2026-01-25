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
interface SuggestionChipProps {
  text: string;
  onClick?: () => void;
}

function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: 'var(--jandi-white)',
        border: '2px solid var(--jandi-light-blue)',
        color: 'var(--jandi-dark-blue)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--jandi-light-blue)';
        e.currentTarget.style.color = 'var(--jandi-white)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--jandi-white)';
        e.currentTarget.style.color = 'var(--jandi-dark-blue)';
      }}
    >
      {text}
    </button>
  );
}

export default SuggestionChip;
