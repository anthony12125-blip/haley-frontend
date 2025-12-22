'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import { HaleyThinkingAnimation } from './HaleyThinkingAnimation';
import type { Message } from '@/types';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onRetryMessage?: (messageId: string) => void;
  onBranchMessage?: (messageId: string) => void;
  onStreamingComplete?: () => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  onRetryMessage,
  onBranchMessage,
  onStreamingComplete,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the last assistant message ID
  const lastAssistantMessageId = useMemo(() => {
    // Find the last assistant message by iterating backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Determine animation mode based on loading and streaming state
  const animationMode = useMemo(() => {
    if (!isLoading) return 'static';
    // If we're loading and there's a streaming message, we're generating tokens
    if (streamingMessageId) return 'generating';
    // Otherwise we're thinking (pre-token generation)
    return 'thinking';
  }, [isLoading, streamingMessageId]);

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
        console.log('🎬 STREAMING STARTED - New assistant message detected');
        console.log('   isLoading:', isLoading);
        console.log('   streamingMessageId:', newMessage.id);
        setStreamingMessageId(newMessage.id);
        // Force scroll to bottom on new assistant message
        scrollToBottom(true);
        
        // Clear streaming after message is complete
        const timeoutDuration = newMessage.content.length * 15 + 500;
        setTimeout(() => {
          console.log('✅ STREAMING COMPLETE - Clearing streamingMessageId');
          setStreamingMessageId(null);
          // Tell parent that streaming is done so it can turn off isLoading
          if (onStreamingComplete) {
            onStreamingComplete();
          }
        }, timeoutDuration);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom, isLoading, onStreamingComplete]);

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

  // Debug logging
  console.log('🔍 ChatMessages Render:', {
    isLoading,
    streamingMessageId,
    messageCount: messages.length,
    lastMessageRole: messages[messages.length - 1]?.role
  });

  // Determine animation mode
  // - If streaming (streamingMessageId exists), show fast generating animation
  // - Otherwise show normal thinking animation
  const animationMode = streamingMessageId ? 'generating' : 'thinking';

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
        {messages.map((message) => {
          // Hide glyph from all messages when isLoading is true (thinking animation is showing)
          // Only show glyph on the last assistant message when NOT loading
          const shouldShowGlyph = message.id === lastAssistantMessageId && !isLoading;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={message.id === streamingMessageId}
              isLastAssistantMessage={shouldShowGlyph}
              onReadAloud={() => handleReadAloud(message.content)}
              onShare={() => handleShare(message)}
              onRetry={onRetryMessage ? () => onRetryMessage(message.id) : undefined}
              onBranch={onBranchMessage ? () => onBranchMessage(message.id) : undefined}
            />
          );
        })}

        {isLoading && (
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-header">
                Haley
              </div>
              <HaleyThinkingAnimation mode={animationMode} />
            </div>
          </div>
        )}

        {/* Scroll target - positioned to keep content visible */}
        <div ref={messagesEndRef} style={{ height: '20px' }} />
      </div>
    </div>
  );
}
