'use client';

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface SummaryCardProps {
  isLoading: boolean;
  summaryText: string;
  onClose: () => void;
  sidebarOpen: boolean;
}

export default function SummaryCard({ isLoading, summaryText, onClose, sidebarOpen }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        marginLeft: sidebarOpen ? '140px' : '0',
        zIndex: 28,
        width: '90%',
        maxWidth: '600px',
        background: 'var(--panel-dark)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Header with envelope icon */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M1 8C1 8 4 5 7 5" strokeLinecap="round"/>
          <path d="M23 8C23 8 20 5 17 5" strokeLinecap="round"/>
          <rect x="4" y="8" width="16" height="12" rx="2"/>
          <path d="M4 8L12 14L20 8"/>
        </svg>
        <h3 style={{ margin: '0 0 0 12px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>
          AI Summary
        </h3>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '24px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--panel)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body with loading or text */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Generating summary...
          </p>
        </div>
      ) : (
        <div
          style={{
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '8px 0'
          }}
        >
          {summaryText}
        </div>
      )}

      {/* Copy button when done */}
      {!isLoading && summaryText && (
        <button
          onClick={handleCopy}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: copied ? 'var(--success)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--primary-hover)';
            }
          }}
          onMouseOut={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--primary)';
            }
          }}
        >
          {copied ? (
            <>
              <Check size={16} />
              Copied
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy Summary
            </>
          )}
        </button>
      )}
    </div>
  );
}
