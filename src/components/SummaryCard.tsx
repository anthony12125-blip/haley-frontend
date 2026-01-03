'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface SummaryCardProps {
  isLoading: boolean;
  summaryText: string;
  onClose: () => void;
  sidebarOpen: boolean;
}

export default function SummaryCard({ isLoading, summaryText, onClose, sidebarOpen }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);

  // ESC key handler and body scroll lock
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content {
          background: var(--panel-dark);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 90vw;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid var(--border);
          background: var(--panel);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .envelope-icon {
          flex-shrink: 0;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
        }

        .modal-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn:hover {
          background: var(--primary-hover);
        }

        .modal-btn.copied {
          background: var(--success);
        }

        .modal-close {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary);
          color: var(--primary);
          transform: scale(1.05);
        }

        .modal-close:active {
          transform: scale(0.95);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 32px;
          background: var(--panel-dark);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .modal-body::-webkit-scrollbar {
          width: 12px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          border: 3px solid transparent;
          background-clip: padding-box;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
          background-clip: padding-box;
        }

        .loading-container {
          text-align: center;
          padding: 40px 20px;
        }

        .loading-text {
          margin-top: 16px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .summary-content {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-word;
          width: 100%;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95vw;
            height: 95vh;
            border-radius: 12px;
          }

          .modal-header {
            padding: 16px 20px;
          }

          .modal-title {
            font-size: 18px;
            gap: 12px;
          }

          .modal-body {
            padding: 20px;
          }

          .summary-content {
            padding: 16px;
            font-size: 13px;
          }

          .modal-close {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>

      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <svg className="envelope-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M1 8C1 8 4 5 7 5" strokeLinecap="round"/>
              <path d="M23 8C23 8 20 5 17 5" strokeLinecap="round"/>
              <rect x="4" y="8" width="16" height="12" rx="2"/>
              <path d="M4 8L12 14L20 8"/>
            </svg>
            <span>AI Summary</span>
          </div>
          <div className="modal-actions">
            {!isLoading && summaryText && (
              <button
                className={`modal-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            )}
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
              title="Close (ESC)"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-container">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <p className="loading-text">Generating summary...</p>
            </div>
          ) : (
            <div className="summary-content">
              {summaryText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
