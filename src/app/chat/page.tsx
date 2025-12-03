'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, checkDiagnosticsQuick, checkDiagnosticsFull } from '@/lib/haleyApi';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm HaleyOS, your AI assistant for construction and contracting. What can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
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
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDiagnostics = async () => {
    setIsLoading(true);
    try {
      const result = await checkDiagnosticsQuick();
      const diagnosticMessage: Message = {
        role: 'system',
        content: `🔍 Quick Diagnostics Results:\n\n` +
          `✅ All Configured: ${result.all_configured ? 'YES' : 'NO'}\n` +
          `⚙️ Missing Keys: ${result.missing_keys.length > 0 ? result.missing_keys.join(', ') : 'None'}\n` +
          `🔧 Invalid Models: ${result.invalid_models.length > 0 ? result.invalid_models.join(', ') : 'None'}\n` +
          `🌐 Invalid Endpoints: ${result.invalid_endpoints.length > 0 ? result.invalid_endpoints.join(', ') : 'None'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, diagnosticMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'system',
        content: `Error running diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullDiagnostics = async () => {
    setIsLoading(true);
    const loadingMessage: Message = {
      role: 'system',
      content: '🔄 Running full Seven Justices diagnostics... (this takes ~10 seconds)',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const result = await checkDiagnosticsFull();
      let content = `🎯 Seven Justices Diagnostics Complete!\n\n`;
      content += `✅ Passed: ${result.api_tests_passed}/7\n`;
      content += `❌ Failed: ${result.api_tests_failed}/7\n\n`;
      content += `Results:\n`;
      
      result.results.forEach((r) => {
        const icon = r.status === 'success' ? '✅' : '❌';
        const time = r.response_time_ms ? ` (${r.response_time_ms}ms)` : '';
        const error = r.error ? ` - ${r.error}` : '';
        content += `${icon} ${r.justice}${time}${error}\n`;
      });

      const diagnosticMessage: Message = {
        role: 'system',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), diagnosticMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'system',
        content: `Error running full diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">HaleyOS Chat</h1>
            <p className="text-white/80 text-sm">Logged in as {user.email}</p>
          </div>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
          </button>
        </div>
      </div>

      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
          <div className="max-w-4xl mx-auto flex gap-4">
            <button
              onClick={handleQuickDiagnostics}
              disabled={isLoading}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Quick Check (~100ms)
            </button>
            <button
              onClick={handleFullDiagnostics}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Full Test (~10s)
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : msg.role === 'system'
                    ? 'bg-yellow-500/20 text-white border border-yellow-500/50'
                    : 'bg-white/90 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs opacity-60 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/90 text-gray-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
