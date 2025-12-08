// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/haleyApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function HaleyChatInterface() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicWindow, setShowMagicWindow] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/space_comet_lavender.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/space_comet_lavender.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="h-[60px] flex items-center justify-between px-6" style={{
          background: 'rgba(20, 20, 35, 0.65)',
          borderBottom: '1px solid rgba(200, 166, 255, 0.25)'
        }}>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#c8a6ff' }}>Haley</h1>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>AI Operating System</p>
          </div>
          <button
            onClick={() => setShowMagicWindow(!showMagicWindow)}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              background: 'rgba(200, 166, 255, 0.2)',
              color: '#e8ddff',
              border: '1px solid rgba(200, 166, 255, 0.35)'
            }}
          >
            {showMagicWindow ? 'Hide' : 'Show'} Magic Window
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-[800px] mx-auto space-y-[10px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[75%] px-4 py-3"
                  style={{
                    borderRadius: '18px',
                    backgroundColor: msg.role === 'user' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(200, 166, 255, 0.20)',
                    color: msg.role === 'user' ? '#ffffff' : '#e8ddff'
                  }}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div 
                    className="text-xs mt-1"
                    style={{ color: 'rgba(255, 255, 255, 0.45)' }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3"
                  style={{
                    borderRadius: '18px',
                    backgroundColor: 'rgba(200, 166, 255, 0.20)',
                    color: '#e8ddff'
                  }}
                >
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Magic Window */}
        {showMagicWindow && (
          <div 
            className="mx-4 mb-4 p-4 max-h-[60%] overflow-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              borderRadius: '16px',
              border: '1px solid rgba(200, 166, 255, 0.35)'
            }}
          >
            <p style={{ color: '#e8ddff' }}>Magic Window - Dynamic content appears here</p>
          </div>
        )}

        {/* Input Bar */}
        <div 
          className="h-[70px] px-4 flex items-center gap-2"
          style={{
            background: 'rgba(20, 20, 35, 0.65)',
            borderTop: '1px solid rgba(200, 166, 255, 0.25)'
          }}
        >
          {/* Plus Button */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: 'rgba(200, 166, 255, 0.2)',
              color: '#c8a6ff'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message Haley..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(200, 166, 255, 0.25)'
            }}
          />

          {/* Mic Button */}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: 'rgba(200, 166, 255, 0.2)',
              color: '#c8a6ff'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-50"
            style={{
              background: '#c8a6ff',
              color: '#1a1a2e'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
