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
  isStreaming?: boolean; // New prop to enable streaming mode
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
        // Add 1-3 characters at a time for smoother flow
        const charsToAdd = Math.min(
          Math.floor(Math.random() * 2) + 1,
          message.content.length - indexRef.current
        );
        
        indexRef.current += charsToAdd;
        setDisplayedContent(message.content.slice(0, indexRef.current));
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 20); // 20ms = fast, natural streaming

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

  const getBubbleClass = () => {
    const baseClass = 'message-bubble';
    if (message.role === 'user') return `${baseClass} message-user`;
    if (message.role === 'system') return `${baseClass} message-system`;
    return `${baseClass} message-assistant`;
  };

  const getBubbleHeader = () => {
    if (message.role === 'user') {
      return (
        <div className="message-header user-header">
          You
        </div>
      );
    }
    if (message.role === 'assistant') {
      return (
        <div className="message-header haley-header">
          Haley
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="relative group animate-message-appear"
      style={{
        animation: 'messageAppear 0.4s ease-out forwards'
      }}
    >
      <style jsx>{`
        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .streaming-text {
          background: linear-gradient(
            90deg,
            currentColor 0%,
            currentColor 40%,
            rgba(var(--primary-rgb), 0.6) 50%,
            currentColor 60%,
            currentColor 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          animation: shimmer 2s linear infinite;
        }

        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 1em;
          background-color: currentColor;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className={getBubbleClass()}>
        {/* Message Header */}
        {getBubbleHeader()}
        
        {/* Supreme Court Indicator */}
        {message.metadata?.supreme_court && message.metadata?.llm_sources && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
            <div className="supreme-indicator !text-xs !px-2 !py-1">
              <span className="text-[10px]">SUPREME COURT</span>
            </div>
            <div className="text-xs text-secondary">
              {message.metadata.llm_sources.join(', ')}
            </div>
          </div>
        )}

        {/* Message Content with Streaming Effect */}
        <div className="whitespace-pre-wrap">
          <span className={!isComplete && message.role === 'assistant' ? 'streaming-text' : ''}>
            {displayedContent}
          </span>
          {!isComplete && message.role === 'assistant' && (
            <span className="cursor-blink" />
          )}
        </div>

        {/* Metadata */}
        {message.metadata && isComplete && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-secondary">
            {message.metadata.model_used && (
              <div>Model: {message.metadata.model_used}</div>
            )}
            {message.metadata.confidence !== undefined && (
              <div>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</div>
            )}
          </div>
        )}
      </div>

      {/* Action Menu - Fixed at bottom - Only show when complete */}
      {message.role !== 'system' && isComplete && (
        <div
          className={`absolute ${
            message.role === 'user' ? 'right-0' : 'left-0'
          } bottom-0 mb-[-40px]`}
        >
          <div className="glass-strong rounded-lg border border-border p-1 flex items-center gap-1 shadow-lg">
            <button
              onClick={handleCopy}
              className="icon-btn !w-8 !h-8"
              title="Copy"
            >
              {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleShare}
              className="icon-btn !w-8 !h-8"
              title="Share"
            >
              <Share2 size={14} />
            </button>
            {message.role === 'assistant' && onRetry && (
              <button
                onClick={onRetry}
                className="icon-btn !w-8 !h-8"
                title="Retry"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {onBranch && (
              <button
                onClick={onBranch}
                className="icon-btn !w-8 !h-8"
                title="Branch"
              >
                <GitBranch size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
