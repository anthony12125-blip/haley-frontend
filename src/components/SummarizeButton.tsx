'use client';

import React from 'react';

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
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--accent)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M1 8C1 8 4 5 7 5" strokeLinecap="round"/>
        <path d="M23 8C23 8 20 5 17 5" strokeLinecap="round"/>
        <rect x="4" y="8" width="16" height="12" rx="2"/>
        <path d="M4 8L12 14L20 8"/>
      </svg>
    </button>
  );
}
