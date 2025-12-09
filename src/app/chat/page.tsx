// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, getSystemStatus, executeModule } from '@/lib/haleyApi';
import type { OSOperationResponse, SystemStatusResponse } from '@/lib/haleyApi';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    operation?: string;
    state_changed?: boolean;
    mama_invoked?: boolean;
    syscalls?: number;
  };
}

export default function HaleyChatInterface(): JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [osStatus, setOsStatus] = useState<SystemStatusResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial system message
  useEffect(() => {
    const systemMessage: Message = {
      role: 'system',
      content: 'HaleyOS initialized. This is an operating system interface, not a chatbot. Use natural language to interact with the OS.',
      timestamp: new Date(),
      metadata: {
        operation: 'system_init'
      }
    };
    setMessages([systemMessage]);
    
    // Load OS status
    loadOSStatus();
  }, []);

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

  const loadOSStatus = async () => {
    try {
      const status = await getSystemStatus();
      setOsStatus(status);
    } catch (error) {
      console.error('Failed to load OS status:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Send message via Baby → Kernel OS operation
      const response: OSOperationResponse = await sendMessage(userInput);
      
      if (response.status === 'success' || response.status === 'completed') {
        // Extract result
        const resultContent = formatOSResult(response.result);
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: resultContent,
          timestamp: new Date(),
          metadata: {
            operation: 'compute',
            state_changed: response.state_changed,
            mama_invoked: response.result?.computation === 'deep_analysis'
          }
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Error response
        const errorMessage: Message = {
          role: 'assistant',
          content: `OS Error: ${response.error_msg || 'Operation failed'}`,
          timestamp: new Date(),
          metadata: {
            operation: 'error'
          }
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      // Refresh OS status
      await loadOSStatus();
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `System error: ${error instanceof Error ? error.message : 'Failed to process operation'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatOSResult = (result: any): string => {
    if (!result) return 'Operation completed';
    
    if (typeof result === 'string') return result;
    
    if (result.response) return result.response;
    
    if (result.computation) {
      return `Computation: ${result.computation}\nProblem: ${result.problem}\nSolution: ${result.solution}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`;
    }
    
    if (result.result !== undefined) {
      return `Result: ${JSON.stringify(result.result)}`;
    }
    
    return JSON.stringify(result, null, 2);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick action buttons
  const quickActions = [
    {
      label: '🧮 Calculator',
      action: async () => {
        setIsLoading(true);
        try {
          const response = await executeModule('calculator', 'add', { a: 5, b: 3 });
          const message: Message = {
            role: 'assistant',
            content: `Calculator result: ${response.result?.result}`,
            timestamp: new Date(),
            metadata: { operation: 'exec_module' }
          };
          setMessages(prev => [...prev, message]);
        } catch (error) {
          console.error('Calculator error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    {
      label: '📊 OS Status',
      action: async () => {
        await loadOSStatus();
        if (osStatus) {
          const message: Message = {
            role: 'system',
            content: `OS Status:\n- Kernel: ${osStatus.kernel_status.kernel}\n- Syscalls: ${osStatus.kernel_status.syscalls}\n- Mama invocations: ${osStatus.kernel_status.mama_invocations}\n- Mama state: ${osStatus.kernel_status.mama_state}\n- Processes: ${osStatus.kernel_status.processes}\n- Modules: ${osStatus.kernel_status.modules}`,
            timestamp: new Date(),
            metadata: { operation: 'status' }
          };
          setMessages(prev => [...prev, message]);
        }
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-white text-xl">Loading HaleyOS...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">HaleyOS</h1>
                <p className="text-purple-200 text-sm">Operating System Interface</p>
              </div>
            </div>
            
            {/* OS Status Badge */}
            {osStatus && (
              <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-full">
                <div className={`w-2 h-2 rounded-full ${osStatus.kernel_status.mama_state === 'halted' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-white text-sm">
                  Syscalls: {osStatus.kernel_status.syscalls}
                </span>
                <span className="text-purple-300 text-sm">
                  Mama: {osStatus.kernel_status.mama_state}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {showDebug ? '🔍' : '🔍'}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-100'
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {showDebug && message.metadata && (
                    <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-60">
                      {Object.entries(message.metadata).map(([key, value]) => (
                        <div key={key}>
                          {key}: {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto flex space-x-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm border border-white/20 transition-colors"
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-black/30 backdrop-blur-md border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4 items-end">
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter OS operation..."
                  className="w-full bg-transparent text-white placeholder-white/50 resize-none outline-none"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 rounded-2xl text-white font-medium transition-colors"
              >
                {isLoading ? '⏳' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
