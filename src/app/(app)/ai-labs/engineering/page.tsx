'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
  Wrench,
  Send,
  Trash2,
  Terminal,
  Code,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolUses?: ToolUse[];
  timestamp: Date;
}

interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  tool_uses?: ToolUse[];
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export default function EngineeringPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useTools, setUseTools] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: 'engineering',
          action: useTools ? 'chat_with_tools' : 'chat',
          params: { message: userMessage.content },
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const result: ChatResponse = data.result;

      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response || '',
        toolUses: result.tool_uses,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[Engineering] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'engineering',
          action: 'clear_history',
          params: {},
        }),
      });
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error('[Engineering] Clear error:', err);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatCode = (content: string) => {
    // Simple code block detection and formatting
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0] || '';
        const code = lines.slice(1).join('\n');
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden bg-[#0d1117] border border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <span className="text-xs text-gray-400">{language || 'code'}</span>
              <button
                onClick={() => copyToClipboard(code, `code-${index}`)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {copied === `code-${index}` ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-gray-300">{code}</code>
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1318] via-[#141a21] to-[#0f1318] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Wrench size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Engineering Agent
                </h1>
                <p className="text-sm text-gray-400">
                  Claude Opus 4.5 with computer use capability
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTools}
                  onChange={(e) => setUseTools(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Terminal size={14} />
                  Computer Use
                </span>
              </label>
              <button
                onClick={handleClearHistory}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Clear conversation"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                Back to Haley
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="min-h-[calc(100vh-280px)] space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 flex items-center justify-center mb-6">
                <Sparkles size={40} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Start a conversation with Opus 4.5
              </h2>
              <p className="text-gray-500 max-w-md">
                Ask for help with coding, debugging, system tasks, or enable Computer Use for advanced capabilities.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                {[
                  'Help me debug this Python code',
                  'Write a React component',
                  'Explain this error message',
                  'Optimize my database query',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800/80 text-gray-100'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === 'assistant'
                      ? formatCode(message.content)
                      : message.content
                    }
                  </div>
                  {message.toolUses && message.toolUses.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolUses.map((tool) => (
                        <div
                          key={tool.id}
                          className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex items-center gap-2 text-xs text-orange-400 mb-1">
                            <Terminal size={12} />
                            <span>Tool: {tool.name}</span>
                          </div>
                          <pre className="text-xs text-gray-400 overflow-x-auto">
                            {JSON.stringify(tool.input, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1318] via-[#0f1318] to-transparent pt-8 pb-6">
        <div className="max-w-5xl mx-auto px-6">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={useTools ? "Ask with computer use enabled..." : "Ask the engineering agent..."}
              rows={1}
              className="w-full px-4 py-3 pr-14 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-none"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Send size={20} className="text-white" />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-2">
            Powered by Claude Opus 4.5 {useTools && '+ Computer Use'}
          </p>
        </div>
      </div>
    </div>
  );
}
