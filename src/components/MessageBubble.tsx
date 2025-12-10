'use client';

import { useState } from 'react';
import { Copy, Volume2, Share, MoreHorizontal, RotateCcw, GitBranch, Check } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onCopy?: () => void;
  onReadAloud?: () => void;
  onShare?: () => void;
  onRetry?: () => void;
  onBranch?: () => void;
}

export default function MessageBubble({
  message,
  onCopy,
  onReadAloud,
  onShare,
  onRetry,
  onBranch,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      await navigator.clipboard.writeText(message.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMetadata = () => {
    if (!message.metadata) return null;

    const badges = [];

    if (message.metadata.model_used) {
      badges.push(
        <span key="model" className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs">
          {message.metadata.model_used}
        </span>
      );
    }

    if (message.metadata.supreme_court) {
      badges.push(
        <span key="supreme" className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-xs">
          Supreme Court
        </span>
      );
    }

    if (message.metadata.mama_invoked || message.metadata.baby_invoked) {
      badges.push(
        <span key="invoked" className="px-2 py-0.5 bg-success/20 text-success rounded text-xs">
          Deep Analysis
        </span>
      );
    }

    return badges.length > 0 ? (
      <div className="flex gap-1 mt-2 flex-wrap">
        {badges}
      </div>
    ) : null;
  };

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
        message.role === 'system' ? 'justify-center' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setMoreMenuOpen(false);
      }}
    >
      <div className="relative group">
        <div
          className={`message-bubble ${
            message.role === 'user'
              ? 'message-user'
              : message.role === 'system'
              ? 'message-system'
              : 'message-assistant'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          {renderMetadata()}
          <div className="text-xs opacity-60 mt-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Action Buttons */}
        {message.role !== 'system' && (showActions || moreMenuOpen) && (
          <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="bg-panel-dark border border-border rounded-lg px-2 py-1 hover:bg-panel-light transition-colors"
              title="Copy"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {onReadAloud && (
              <button
                onClick={onReadAloud}
                className="bg-panel-dark border border-border rounded-lg px-2 py-1 hover:bg-panel-light transition-colors"
                title="Read aloud"
              >
                <Volume2 size={14} />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="bg-panel-dark border border-border rounded-lg px-2 py-1 hover:bg-panel-light transition-colors"
                title="Share"
              >
                <Share size={14} />
              </button>
            )}
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="bg-panel-dark border border-border rounded-lg px-2 py-1 hover:bg-panel-light transition-colors relative"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* More Menu */}
            {moreMenuOpen && (
              <div className="absolute top-full mt-1 right-0 bg-panel-dark border border-border rounded-lg shadow-xl z-10 min-w-[140px]">
                {onRetry && message.role === 'assistant' && (
                  <button
                    onClick={() => {
                      onRetry();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-panel-light transition-colors text-sm"
                  >
                    <RotateCcw size={14} />
                    <span>Retry</span>
                  </button>
                )}
                {onBranch && (
                  <button
                    onClick={() => {
                      onBranch();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-panel-light transition-colors text-sm"
                  >
                    <GitBranch size={14} />
                    <span>Branch</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
