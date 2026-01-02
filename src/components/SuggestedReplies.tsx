'use client';

import { useState } from 'react';

interface SuggestedRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  sidebarOpen?: boolean;
}

export default function SuggestedReplies({
  suggestions,
  onSelect,
  sidebarOpen = false
}: SuggestedRepliesProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || suggestions.length === 0) return null;

  const handleSelect = (suggestion: string) => {
    setDismissed(true);
    onSelect(suggestion);
  };

  return (
    <div
      className={`suggested-replies glass-strong border-t border-border safe-bottom transition-all duration-300 ${
        sidebarOpen ? 'md:left-80' : 'md:left-[60px]'
      }`}
    >
      <style jsx>{`
        .suggested-replies {
          position: fixed;
          bottom: 70px;
          left: 0;
          right: 0;
          z-index: 29;
        }

        .suggestions-container {
          max-width: 48rem;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .suggestion-button {
          display: inline-flex;
          align-items: center;
          padding: 8px 20px;
          background: var(--primary);
          color: white;
          border: 1px solid rgba(75, 108, 255, 0.5);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .suggestion-button:hover {
          background: var(--primary-hover);
          border-color: rgba(75, 108, 255, 0.8);
          transform: translateY(-1px);
        }

        .suggestion-button:active {
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .suggested-replies {
            bottom: 90px;
            left: 0 !important;
          }

          .suggestions-container {
            padding: 8px 12px;
          }

          .suggestion-button {
            font-size: 13px;
            padding: 6px 16px;
          }
        }
      `}</style>

      <div className="suggestions-container">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-button"
            onClick={() => handleSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
