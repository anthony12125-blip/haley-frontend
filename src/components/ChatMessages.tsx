'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    scrollToBottom();
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
          title: 'HaleyOS Message',
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
      className="flex-1 overflow-y-auto py-6"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onReadAloud={() => handleReadAloud(message.content)}
            onShare={() => handleShare(message)}
            onRetry={onRetryMessage ? () => onRetryMessage(message.id) : undefined}
            onBranch={onBranchMessage ? () => onBranchMessage(message.id) : undefined}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="message-bubble message-assistant">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
