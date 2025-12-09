'use client';

import { Message } from '@/app/chat/page';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 safe-area-bottom" style={{ paddingBottom: '90px' }}>
      <div className="max-w-4xl mx-auto space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`message-bubble ${
                message.role === 'user'
                  ? 'message-bubble-user'
                  : message.role === 'system'
                  ? 'bg-haley-secondary/20 border border-haley-secondary/30 text-haley-text-body'
                  : 'message-bubble-assistant'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div className="timestamp mt-1">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="message-bubble-assistant">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-haley-text-body rounded-full animate-bounce"></div>
                <div 
                  className="w-2 h-2 bg-haley-text-body rounded-full animate-bounce" 
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div 
                  className="w-2 h-2 bg-haley-text-body rounded-full animate-bounce" 
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
