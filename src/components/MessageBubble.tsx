'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Share2, RotateCcw, GitBranch, CheckCircle } from 'lucide-react';
import type { Message } from '@/types';
import { HaleyCoreGlyph } from './HaleyCoreGlyph';

interface MessageBubbleProps {
  message: Message;
  onReadAloud?: () => void;
  onShare?: () => Promise<void>;
  onRetry?: () => void;
  onBranch?: () => void;
  isStreaming?: boolean;
}

export default function MessageBubble({ 
  message, 
  onReadAloud, 
  onShare, 
  onRetry, 
  onBranch,
  isStreaming = false 
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(!isStreaming);
  const contentRef = useRef(message.content);
  const indexRef = useRef(0);

  // Streaming typewriter effect
  useEffect(() => {
    if (!isStreaming || message.role === 'user') {
      setDisplayedContent(message.content);
      setIsComplete(true);
      return;
    }

    // Reset if content changes
    if (contentRef.current !== message.content) {
      contentRef.current = message.content;
      indexRef.current = 0;
      setDisplayedContent('');
      setIsComplete(false);
    }

    // Streaming animation - faster speed for more natural feel
    const interval = setInterval(() => {
      if (indexRef.current < message.content.length) {
        // Add 2-4 characters at a time for smoother flow
        const charsToAdd = Math.min(
          Math.floor(Math.random() * 3) + 2,
          message.content.length - indexRef.current
        );
        
        indexRef.current += charsToAdd;
        setDisplayedContent(message.content.slice(0, indexRef.current));
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 15); // 15ms = fast, natural streaming like ChatGPT/Claude

    return () => clearInterval(interval);
  }, [message.content, isStreaming, message.role]);

  // Don't render until we have content to show (prevents black bar flash)
  if (isStreaming && message.role === 'assistant' && !displayedContent) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Haley OS Message',
          text: message.content,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div 
      className={`message-container ${message.role === 'user' ? 'user-message' : ''}`}
    >
      <style jsx>{`
        .message-container {
          padding: 32px 0;
          position: relative;
          animation: messageAppear 0.3s ease-out forwards;
        }

        .message-container.user-message {
          display: flex;
          justify-content: flex-end;
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-content-wrapper {
          max-width: 48rem;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .user-message .message-content-wrapper {
          max-width: 80%;
          margin: 0 2rem 0 0;
          padding: 0;
        }

        .message-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-secondary);
          letter-spacing: 0.01em;
        }

        :root.light .message-header {
          color: #6A6A6A;
        }

        .message-header.haley-header {
          color: var(--accent);
        }

        :root.light .message-header.haley-header {
          color: #4B6CFF;
        }

        .user-message .message-header {
          text-align: right;
        }

        .message-text {
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .user-message .message-text {
          background: #404040;
          padding: 12px 16px;
          border-radius: 18px;
          color: #ffffff;
          display: inline-block;
          max-width: fit-content;
        }

        :root.light .user-message .message-text {
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        :root.light .message-text {
          color: #1a1a1a;
        }

        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background-color: var(--text-primary);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }

        :root.light .cursor-blink {
          background-color: #1a1a1a;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .action-buttons {
          margin-top: 16px;
          display: flex;
          gap: 8px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .user-message .action-buttons {
          justify-content: flex-end;
        }

        .action-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .haley-symbol-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--accent);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        :root.light .haley-symbol-wrapper {
          border: 1px solid rgba(0, 0, 0, 0.15);
          color: #4B6CFF;
        }

        .haley-symbol-wrapper:hover {
          background: var(--panel-medium);
          border-color: var(--accent);
        }

        :root.light .haley-symbol-wrapper:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: #4B6CFF;
        }

        .action-btn {
          padding: 6px 10px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        :root.light .action-btn {
          border: 1px solid rgba(0, 0, 0, 0.15);
          color: #6A6A6A;
        }

        .action-btn:hover {
          background: var(--panel-medium);
          border-color: var(--accent);
          color: var(--text-primary);
        }

        :root.light .action-btn:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: #4B6CFF;
          color: #000000;
        }

        .metadata-section {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-secondary);
        }

        :root.light .metadata-section {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          color: #6A6A6A;
        }

        .supreme-indicator-wrapper {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        :root.light .supreme-indicator-wrapper {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .supreme-badge {
          background: var(--accent);
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        :root.light .supreme-badge {
          background: #4B6CFF;
        }
      `}</style>

      <div className="message-content-wrapper">
        {/* Message Header */}
        <div className={`message-header ${message.role === 'assistant' ? 'haley-header' : ''}`}>
          {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Haley' : 'System'}
        </div>

        {/* Supreme Court Indicator */}
        {message.metadata?.supreme_court && message.metadata?.llm_sources && (
          <div className="supreme-indicator-wrapper">
            <div className="supreme-badge">
              SUPREME COURT
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {message.metadata.llm_sources.join(', ')}
            </div>
          </div>
        )}

        {/* Message Content with Streaming Effect - NO BACKGROUND */}
        <div className="message-text">
          {displayedContent}
          {!isComplete && message.role === 'assistant' && (
            <span className="cursor-blink" />
          )}
        </div>

        {/* Metadata */}
        {message.metadata && isComplete && (
          <div className="metadata-section">
            {message.metadata.model_used && (
              <div>Model: {message.metadata.model_used}</div>
            )}
            {message.metadata.confidence !== undefined && (
              <div>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</div>
            )}
          </div>
        )}

        {/* Action Buttons - Only show when complete */}
        {message.role !== 'system' && isComplete && (
          <div className="action-buttons">
            {message.role === 'assistant' && (
              <div className="action-column">
                <button
                  onClick={handleCopy}
                  className="action-btn"
                  title="Copy"
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <div className="haley-symbol-wrapper" title="Haley AI">
                  <HaleyCoreGlyph size={20} />
                </div>
              </div>
            )}
            {message.role === 'user' && (
              <button
                onClick={handleCopy}
                className="action-btn"
                title="Copy"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              onClick={handleShare}
              className="action-btn"
              title="Share"
            >
              <Share2 size={14} />
              Share
            </button>
            {message.role === 'assistant' && onRetry && (
              <button
                onClick={onRetry}
                className="action-btn"
                title="Retry"
              >
                <RotateCcw size={14} />
                Retry
              </button>
            )}
            {onBranch && (
              <button
                onClick={onBranch}
                className="action-btn"
                title="Branch"
              >
                <GitBranch size={14} />
                Branch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
