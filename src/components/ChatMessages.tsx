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
        }, newMessage.content.length * 20 + 500); // Based on streaming speed
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
      className="flex-1 overflow-y-auto py-6"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 space-y-4">
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
