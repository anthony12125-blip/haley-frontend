'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Share2, RotateCcw, GitBranch, CheckCircle } from 'lucide-react';
import type { Message } from '@/types';

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
      className={`message-container ${message.role === 'user' ? 'message-container-user' : 'message-container-assistant'}`}
    >
      <style jsx>{`
        .message-container {
          padding: 24px 0;
          position: relative;
          animation: messageAppear 0.3s ease-out forwards;
        }

        .message-container-user {
          background: transparent;
        }

        .message-container-assistant {
          background: var(--panel-dark);
          border-bottom: 1px solid var(--border);
        }

        :root.light .message-container-assistant {
          background: #F7F7F7;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
          padding: 0 1rem;
        }

        .message-header {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
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

        .message-text {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        :root.light .message-text {
          color: #000000;
        }

        .cursor-blink {
          display: inline-block;
          width: 8px;
          height: 20px;
          background-color: var(--accent);
          margin-left: 3px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
          border-radius: 1px;
        }

        :root.light .cursor-blink {
          background-color: #4B6CFF;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .action-buttons {
          margin-top: 12px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .message-container:hover .action-buttons {
          opacity: 1;
        }

        .action-btn {
          padding: 6px 10px;
          border-radius: 6px;
          background: var(--panel-medium);
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
          background: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #6A6A6A;
        }

        .action-btn:hover {
          background: var(--panel-light);
          border-color: var(--accent);
          color: var(--text-primary);
        }

        :root.light .action-btn:hover {
          background: #F7F7F7;
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
          border-top: 1px solid rgba(0, 0, 0, 0.06);
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
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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

        {/* Message Content with Streaming Effect */}
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
            <button
              onClick={handleCopy}
              className="action-btn"
              title="Copy"
            >
              {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
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
