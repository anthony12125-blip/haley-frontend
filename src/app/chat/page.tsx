'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, getSystemStatus } from '@/lib/haleyApi';
import type { OSOperationResponse, SystemStatusResponse } from '@/lib/haleyApi';
import { Menu, MoreVertical } from 'lucide-react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInputBar from '@/components/ChatInputBar';
import MagicWindow from '@/components/MagicWindow';
import Sidebar from '@/components/Sidebar';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    operation?: string;
    state_changed?: boolean;
    mama_invoked?: boolean;
    syscalls?: number;
    model_used?: string;
  };
}

export default function ChatPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'Assistant' | 'Regular' | 'Developer' | 'System'>('Assistant');
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(false);
  const [osStatus, setOsStatus] = useState<SystemStatusResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [magicWindowContent, setMagicWindowContent] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial system message
  useEffect(() => {
    const systemMessage: Message = {
      role: 'system',
      content: 'HaleyOS initialized. Ready to assist.',
      timestamp: new Date(),
      metadata: {
        operation: 'system_init'
      }
    };
    setMessages([systemMessage]);
    loadOSStatus();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

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

  const handleSend = async (messageText?: string, audioBlob?: Blob) => {
    const textToSend = messageText || input;
    if ((!textToSend.trim() && !audioBlob) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: audioBlob ? '[Voice message]' : textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: OSOperationResponse = await sendMessage(textToSend);
      
      if (response.status === 'success' || response.status === 'completed') {
        const resultContent = formatOSResult(response.result);
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: resultContent,
          timestamp: new Date(),
          metadata: {
            operation: 'compute',
            state_changed: response.state_changed,
            mama_invoked: response.result?.computation === 'deep_analysis',
            model_used: response.model_used
          }
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // If voice was used, trigger TTS for response
        if (audioBlob) {
          speakResponse(resultContent);
        }
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${response.error_msg || 'Operation failed'}`,
          timestamp: new Date(),
          metadata: {
            operation: 'error'
          }
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

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

  const speakResponse = (text: string) => {
    // TTS implementation - can use Web Speech API or backend service
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileUpload = (files: FileList) => {
    // Handle file uploads
    console.log('Files uploaded:', files);
    // TODO: Implement file upload to backend
  };

  const handleGallerySelect = () => {
    // Open gallery picker
    console.log('Open gallery');
    // TODO: Implement gallery selection
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-haley-text-body text-xl pulse-glow">Loading HaleyOS...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-haley-text-body text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={signOut}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Header */}
        <ChatHeader
          mode={mode}
          onMenuClick={() => setSidebarOpen(true)}
          onMoreClick={() => setMenuOpen(!menuOpen)}
          osStatus={osStatus}
        />

        {/* Messages Area */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        {/* Input Bar */}
        <ChatInputBar
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSend}
          deepReasoningEnabled={deepReasoningEnabled}
          onToggleReasoning={() => setDeepReasoningEnabled(!deepReasoningEnabled)}
          onFileUpload={handleFileUpload}
          onGallerySelect={handleGallerySelect}
        />

        {/* Magic Window - Bottom Left Floating */}
        {magicWindowContent && (
          <MagicWindow content={magicWindowContent} onClose={() => setMagicWindowContent(null)} />
        )}
      </div>
    </div>
  );
}
