'use client';

import { useState } from 'react';
import { Copy, Share2, RotateCcw, GitBranch, CheckCircle } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onReadAloud?: () => void;
  onShare?: () => Promise<void>;
  onRetry?: () => void;
  onBranch?: () => void;
}

export default function MessageBubble({ message, onReadAloud, onShare, onRetry, onBranch }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

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
          title: 'HaleyOS Message',
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
    <div className="relative group">
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

        {/* Message Content */}
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Metadata */}
        {message.metadata && (
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

      {/* Action Menu - Fixed at bottom */}
      {message.role !== 'system' && (
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
