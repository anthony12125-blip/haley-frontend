'use client';

import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from '@/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onRetryMessage?: (messageId: string) => void;
  onBranchMessage?: (messageId: string) => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  onRetryMessage,
  onBranchMessage,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect new assistant messages for streaming
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      if (newMessage.role === 'assistant') {
        setStreamingMessageId(newMessage.id);
        // Clear streaming after message is complete
        setTimeout(() => {
          setStreamingMessageId(null);
        }, newMessage.content.length * 15 + 500); // Based on streaming speed
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReadAloud = (content: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShare = async (message: Message) => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: message.content,
          title: 'Haley OS Message',
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(message.content);
      alert('Message copied to clipboard!');
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border) transparent'
      }}
    >
      <style jsx>{`
        .messages-container {
          width: 100%;
        }

        .loading-container {
          background: var(--panel-dark);
          border-bottom: 1px solid var(--border);
          padding: 24px 0;
        }

        :root.light .loading-container {
          background: #F7F7F7;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .loading-content {
          max-width: 48rem;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .loading-header {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--accent);
          letter-spacing: 0.01em;
        }

        :root.light .loading-header {
          color: #4B6CFF;
        }

        .typing-indicator {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          animation: typingDot 1.4s ease-in-out infinite;
        }

        :root.light .typing-dot {
          background: #4B6CFF;
        }

        .typing-dot:nth-child(1) {
          animation-delay: 0s;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>

      <div className="messages-container">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
            onReadAloud={() => handleReadAloud(message.content)}
            onShare={() => handleShare(message)}
            onRetry={onRetryMessage ? () => onRetryMessage(message.id) : undefined}
            onBranch={onBranchMessage ? () => onBranchMessage(message.id) : undefined}
          />
        ))}

        {isLoading && (
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-header">
                Haley
              </div>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
}
