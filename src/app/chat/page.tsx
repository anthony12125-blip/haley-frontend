'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, getSystemStatus } from '@/lib/haleyApi';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import AISwitcher from '@/components/AISwitcher';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInputBar from '@/components/ChatInputBar';
import MagicWindowContainer from '@/components/MagicWindowContainer';
import Sidebar from '@/components/Sidebar';
import type { Message, AIMode, SystemStatus, MagicWindowContent, ConversationHistory } from '@/types';

export default function ChatPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Set sidebar open by default on desktop
  useEffect(() => {
    if (device.type === 'desktop') {
      setSidebarOpen(true);
    }
  }, [device.type]);

  // AI State
  const [aiMode, setAiMode] = useState<AIMode>('single');
  const [activeModels, setActiveModels] = useState<string[]>(['Claude']);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Feature Toggles
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [logicEngineEnabled, setLogicEngineEnabled] = useState(false);
  
  // Magic Window
  const [magicWindowContent, setMagicWindowContent] = useState<MagicWindowContent | null>(null);
  
  // System State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  // Conversation History
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');

  // Initialize
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      initializeChat();
      loadSystemStatus();
      const statusInterval = setInterval(loadSystemStatus, 30000); // Update every 30s
      return () => clearInterval(statusInterval);
    }
  }, [user, authLoading, router]);

  const initializeChat = () => {
    const systemMessage: Message = {
      id: generateId(),
      role: 'system',
      content: 'HaleyOS initialized. Multi-LLM router active. Ready to assist.',
      timestamp: new Date(),
      metadata: {
        operation: 'system_init',
      },
    };
    setMessages([systemMessage]);
  };

  const loadSystemStatus = async () => {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const handleSend = async (messageText?: string, audioBlob?: Blob) => {
    const textToSend = messageText || input;
    if ((!textToSend.trim() && !audioBlob) || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: audioBlob ? '[Voice message]' : textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(textToSend);

      if (response.status === 'success' || response.status === 'completed') {
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: formatResponse(response.result),
          timestamp: new Date(),
          metadata: {
            operation: 'chat',
            model_used: response.model_used,
            baby_invoked: response.baby_invoked,
            task: response.task,
            supreme_court: aiMode === 'supreme-court',
            llm_sources: aiMode === 'supreme-court' ? activeModels : undefined,
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // If audioBlob was used, speak the response
        if (audioBlob) {
          speakResponse(assistantMessage.content);
        }

        // Check if response includes visualization data
        if (response.result?.visualization) {
          setMagicWindowContent({
            type: 'visualization',
            content: response.result.visualization,
            title: 'Analysis Results',
          });
        }
      } else {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Error: ${response.error_msg || 'Operation failed'}`,
          timestamp: new Date(),
          metadata: {
            operation: 'error',
          },
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      await loadSystemStatus();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `System error: ${error instanceof Error ? error.message : 'Failed to process operation'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (result: any): string => {
    if (!result) return 'Operation completed';
    if (typeof result === 'string') return result;
    if (result.response) return result.response;
    if (result.computation) {
      return `${result.computation}\n\nProblem: ${result.problem}\nSolution: ${result.solution}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`;
    }
    if (result.result !== undefined) {
      return `Result: ${JSON.stringify(result.result)}`;
    }
    return JSON.stringify(result, null, 2);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileUpload = (files: FileList) => {
    console.log('Files uploaded:', files);
    // TODO: Implement file upload to backend
    setMagicWindowContent({
      type: 'data',
      content: {
        files: files.length,
        names: Array.from(files).map(f => f.name).join(', '),
      },
      title: 'Uploaded Files',
    });
  };

  const handleGallerySelect = () => {
    console.log('Gallery selection');
    // TODO: Implement gallery selection
  };

  const handleAIModeChange = (mode: AIMode) => {
    setAiMode(mode);
    if (mode === 'supreme-court') {
      setActiveModels(['Claude', 'GPT-4', 'Gemini', 'Mistral']);
    } else if (mode === 'multi') {
      setActiveModels(['Claude', 'GPT-4']);
    } else {
      setActiveModels(['Claude']);
    }
  };

  const handleRetryMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.role === 'user') {
        handleSend(previousMessage.content);
      }
    }
  };

  const handleBranchMessage = (messageId: string) => {
    console.log('Branch conversation from message:', messageId);
    // TODO: Implement conversation branching
  };

  const handleNewConversation = () => {
    const newId = generateId();
    setCurrentConversationId(newId);
    initializeChat();
    setSidebarOpen(false);
  };

  if (authLoading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient mb-4">HaleyOS</div>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="full-screen flex overflow-hidden">
      {/* Space Background */}
      <div className="space-bg">
        <div className="stars" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              right: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Sidebar - Always present, controlled by isOpen state */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={setCurrentConversationId}
      />

      {/* Main Chat Area - Adjusts based on sidebar state on desktop */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300`}>
        {/* AI Mode Switcher */}
        <AISwitcher
          currentMode={aiMode}
          onModeChange={handleAIModeChange}
          activeModels={activeModels}
        />

        {/* Header */}
        <ChatHeader
          aiMode={aiMode}
          activeModels={activeModels}
          onMenuClick={() => setSidebarOpen(true)}
          onMoreClick={() => setMenuOpen(!menuOpen)}
          systemStatus={systemStatus}
        />

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onRetryMessage={handleRetryMessage}
          onBranchMessage={handleBranchMessage}
        />

        {/* Input Bar */}
        <ChatInputBar
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSend}
          researchEnabled={researchEnabled}
          logicEngineEnabled={logicEngineEnabled}
          onToggleResearch={() => setResearchEnabled(!researchEnabled)}
          onToggleLogicEngine={() => setLogicEngineEnabled(!logicEngineEnabled)}
          onFileUpload={handleFileUpload}
          onGallerySelect={handleGallerySelect}
        />

        {/* Magic Window */}
        <MagicWindowContainer
          content={magicWindowContent}
          onClose={() => setMagicWindowContent(null)}
        />
      </div>
    </div>
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
