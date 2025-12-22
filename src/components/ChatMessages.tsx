'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { HaleyThinkingAnimation } from './HaleyThinkingAnimation';
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
  const [isStreamingComplete, setIsStreamingComplete] = useState(true);
  const prevMessagesLengthRef = useRef(0);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Improved scroll to bottom function with instant scrolling
  const scrollToBottom = useCallback((force = false) => {
    if (!containerRef.current || (!force && userScrolledUp)) return;
    
    // Scroll to bottom but account for padding to keep content visible
    // Subtract a small offset to ensure the last message and loading indicator are visible
    const container = containerRef.current;
    const scrollPosition = container.scrollHeight - container.clientHeight;
    container.scrollTop = scrollPosition;
  }, [userScrolledUp]);

  // Detect if user has scrolled up manually
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    
    setUserScrolledUp(!isAtBottom);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Always scroll when new messages arrive (unless user scrolled up)
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom when loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [isLoading, scrollToBottom]);

  // Detect new assistant messages for streaming
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const newMessage = messages[messages.length - 1];
      if (newMessage.role === 'assistant') {
        setStreamingMessageId(newMessage.id);
        setIsStreamingComplete(false); // Mark streaming as not complete
        // Force scroll to bottom on new assistant message
        scrollToBottom(true);
        
        // Clear streaming after message is complete
        const estimatedDuration = newMessage.content.length * 15 + 500;
        setTimeout(() => {
          setStreamingMessageId(null);
          setIsStreamingComplete(true); // Mark streaming as complete
        }, estimatedDuration);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Smooth scrolling during streaming - only when content height actually changes
  useEffect(() => {
    if (streamingMessageId && !userScrolledUp) {
      // Use requestAnimationFrame for smoother scrolling tied to browser repaints
      let rafId: number;
      
      const smoothScroll = () => {
        if (containerRef.current) {
          const { scrollHeight, clientHeight, scrollTop } = containerRef.current;
          const isNearBottom = scrollHeight - clientHeight - scrollTop < 100;
          
          // Only scroll if we're near the bottom
          if (isNearBottom) {
            containerRef.current.scrollTop = scrollHeight - clientHeight;
          }
        }
        rafId = requestAnimationFrame(smoothScroll);
      };
      
      rafId = requestAnimationFrame(smoothScroll);
      return () => cancelAnimationFrame(rafId);
    }
  }, [streamingMessageId, userScrolledUp]);

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

  // Reset scroll tracking when user sends a message
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setUserScrolledUp(false);
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Handle when a message completes streaming
  const handleStreamingComplete = useCallback(() => {
    setIsStreamingComplete(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      onScroll={handleScroll}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--border) transparent',
        scrollBehavior: 'auto' // Use auto instead of smooth to prevent conflicts
      }}
    >
      <style jsx>{`
        .messages-container {
          width: 100%;
          padding-bottom: 120px;
          min-height: 100%;
        }

        .loading-container {
          padding: 32px 0;
          position: relative;
          margin-bottom: 20px;
        }

        .loading-content {
          max-width: 48rem;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .loading-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--accent);
          letter-spacing: 0.01em;
        }

        :root.light .loading-header {
          color: #4B6CFF;
        }
      `}</style>

      <div className="messages-container">
        {messages.map((message, index) => {
          // Find the index of the last assistant message
          const lastAssistantMessageIndex = [...messages].reverse().findIndex(m => m.role === 'assistant');
          const isLastAssistantMessage = message.role === 'assistant' && 
            (messages.length - 1 - lastAssistantMessageIndex) === index;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={message.id === streamingMessageId}
              isLastAssistantMessage={isLastAssistantMessage}
              onReadAloud={() => handleReadAloud(message.content)}
              onShare={() => handleShare(message)}
              onRetry={onRetryMessage ? () => onRetryMessage(message.id) : undefined}
              onBranch={onBranchMessage ? () => onBranchMessage(message.id) : undefined}
              onStreamingComplete={message.id === streamingMessageId ? handleStreamingComplete : undefined}
            />
          );
        })}

        {isLoading && (
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-header">
                Haley
              </div>
              <HaleyThinkingAnimation />
            </div>
          </div>
        )}

        {/* Scroll target - positioned to keep content visible */}
        <div ref={messagesEndRef} style={{ height: '20px' }} />
      </div>
    </div>
  );
}
