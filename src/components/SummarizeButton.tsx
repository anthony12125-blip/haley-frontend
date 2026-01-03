'use client';

import React from 'react';
import IconEnvelopeWings from './icons/IconEnvelopeWings';

interface SummarizeButtonProps {
  onClick: () => void;
  sidebarOpen: boolean;
}

export default function SummarizeButton({ onClick, sidebarOpen }: SummarizeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="summarize-button"
      aria-label="Summarize multi-LLM responses"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        marginLeft: sidebarOpen ? '140px' : '0',
        zIndex: 28,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        padding: '12px'
      }}
    >
      <IconEnvelopeWings
        size={32}
        strokeWidth={2}
        className="envelope-wings-icon"
      />
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
        letterSpacing: '0.5px'
      }}>
        AI Summary
      </span>

      <style jsx>{`
        .summarize-button {
          animation: float 3s ease-in-out infinite;
        }

        .summarize-button:hover {
          transform: translateX(-50%) scale(1.1);
        }

        .summarize-button:active {
          transform: translateX(-50%) scale(0.95);
        }

        .envelope-wings-icon {
          color: var(--accent);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 768px) {
          .summarize-button {
            bottom: 90px;
          }
        }
      `}</style>
    </button>
  );
}
