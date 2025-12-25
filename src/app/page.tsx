'use client';

// Force dynamic rendering to prevent Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, getSystemStatus, loadAllConversations, loadConversation, deleteConversation } from '@/lib/haleyApi';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInputBar from '@/components/ChatInputBar';
import MagicWindow from '@/components/MagicWindow';
import ModeSelector from '@/components/ModeSelector';
import Sidebar from '@/components/Sidebar';
import LoginPage from '@/components/LoginPage';
import type { Message, AIMode, SystemStatus, MagicWindowContent, ConversationHistory } from '@/types';

export default function ChatPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [magicWindowOpen, setMagicWindowOpen] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);

  // Initialize sidebar state from localStorage, with desktop default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_sidebarCollapsed');
      if (savedState !== null) {
        // If we have saved state, use the inverse (since we store "collapsed" but state is "open")
        const isCollapsed = JSON.parse(savedState);
        setSidebarOpen(!isCollapsed);
      } else if (device.type === 'desktop') {
        // Default behavior: open on desktop
        setSidebarOpen(true);
      }
    }
  }, [device.type]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store the inverse: we store "collapsed" state, but our state is "open"
      localStorage.setItem('haley_sidebarCollapsed', JSON.stringify(!sidebarOpen));
    }
  }, [sidebarOpen]);

  // AI State
  const [aiMode, setAiMode] = useState<AIMode>('single');
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('haley'); // DEFAULT: Always start with Haley
  
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
  
  // Conversation History - Per Model
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');
  const [conversationsByModel, setConversationsByJustice] = useState<Record<string, Message[]>>({
    'haley': [],
    'gemini': [],
    'gpt': [],
    'claude': [],
    'llama': [],
    'perplexity': [],
    'mistral': [],
    'grok': [],
  });
  
  // New Chat Guard - prevents spam clicking
  const [hasActiveNewChat, setHasActiveNewChat] = useState(false);

  // Available Justices and Agents (updated order)
  const availableModels = [
    { id: 'gemini', name: 'Gemini', provider: 'Google' },
    { id: 'gpt', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'claude', name: 'Claude', provider: 'Anthropic' },
    { id: 'llama', name: 'Llama', provider: 'Meta' },
    { id: 'perplexity', name: 'Perplexity', provider: 'Perplexity AI' },
    { id: 'mistral', name: 'Mistral', provider: 'Mistral AI' },
    { id: 'grok', name: 'Grok', provider: 'xAI' },
  ];

  const availableAgents: Array<{ id: string; name: string; description: string }> = [];

  // Initialize
  useEffect(() => {
    if (user) {
      initializeChat();
      loadConversationsFromStorage();
      loadSystemStatus();
      const statusInterval = setInterval(loadSystemStatus, 30000); // Update every 30s
      return () => clearInterval(statusInterval);
    }
  }, [user, authLoading, router]);

  const loadConversationsFromStorage = async () => {
    if (!user?.uid) return;
    
    try {
      const loadedConversations = await loadAllConversations(user.uid);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const initializeChat = () => {
    // Start with an empty chat - no system message
    setMessages([]);
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
    
    // Clear new chat guard when user sends first message
    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }

    try {
      // Resolve provider with proper precedence
      const resolvedProvider = activeProvider || 'haley';

      console.log('[SEND] Using provider:', resolvedProvider);

      // Create assistant message placeholder for streaming
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: {
          operation: 'chat',
          model_used: resolvedProvider,
          task: 'general',
          supreme_court: aiMode === 'supreme-court',
          llm_sources: activeModel ? [activeModel] : undefined,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Call async sendMessage with streaming callbacks
      await sendMessage(
        textToSend,
        resolvedProvider,
        // onToken - stream tokens as they arrive
        (token: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        // onComplete - finalize message
        (response) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      baby_invoked: response.baby_invoked,
                      model_used: response.model_used,
                      task: response.task,
                    },
                  }
                : msg
            )
          );
          setIsLoading(false);

          // If audioBlob was used, speak the response
          if (audioBlob) {
            const finalContent = response.result?.response || '';
            speakResponse(finalContent);
          }

          // Check if response includes visualization data
          if (response.result?.visualization) {
            setMagicWindowContent({
              type: 'visualization',
              content: response.result.visualization,
              title: 'Analysis Results',
            });
            setMagicWindowOpen(true);
          }

          // DO NOT reload conversations here - keep streamed messages as source of truth
          // System status updates on 30s interval from useEffect only
        },
        // onError - handle errors
        (error: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Error: ${error}`,
                    metadata: { ...msg.metadata, operation: 'error' },
                  }
                : msg
            )
          );
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `System error: ${error instanceof Error ? error.message : 'Failed to process operation'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
    setMagicWindowContent({
      type: 'data',
      content: {
        files: files.length,
        names: Array.from(files).map(f => f.name).join(', '),
      },
      title: 'Uploaded Files',
    });
    setMagicWindowOpen(true);
  };

  const handleGallerySelect = () => {
    console.log('Gallery selection');
  };

  const handleModeSelect = (mode: 'haley' | 'ais' | 'agents') => {
    if (mode === 'haley') {
      handleModelSelect(null);
    }
  };

  const handleModelSelect = (justice: string | null) => {
    const modelKey = justice || 'haley';
    
    // Save current messages to current justice
    const currentModelKey = activeModel || 'haley';
    setConversationsByJustice(prev => ({
      ...prev,
      [currentModelKey]: messages
    }));
    
    // Load messages for selected justice
    const loadedMessages = conversationsByModel[modelKey];
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages);
    } else {
      // Initialize with empty messages - no notification bubble
      setMessages([]);
    }
    
    setActiveModel(justice);
    setActiveProvider(modelKey); // CRITICAL: Set provider when model changes
    setAiMode('single');
    
    console.log(`Switched to ${modelKey} - loaded ${loadedMessages?.length || 0} messages`);
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
  };

  const handleNewConversation = async () => {
    // NEW CHAT GUARD: Ignore if there's already an active fresh/empty chat
    if (hasActiveNewChat) {
      console.log('New chat already active - ignoring additional clicks');
      return;
    }
    
    // TEMP FIX v1: Create new chat without Firestore persistence
    // Full persistence will be handled in Module 1.5
    
    // Generate new chat ID
    const newId = generateId();
    
    // Create new chat object for local state
    const newChat: ConversationHistory = {
      id: newId,
      title: 'New Chat',
      lastMessage: 'No messages yet',
      timestamp: new Date(),
      lastActive: new Date(),
      messageCount: 0,
      modelMode: activeModel || undefined,
      provider: activeProvider || 'haley', // CRITICAL: Persist provider for new chats
    };
    
    // Add to conversations list (in-memory only, not saved to Firestore)
    setConversations(prev => [newChat, ...prev]);
    
    // Switch to new chat
    setCurrentConversationId(newId);
    
    // Initialize with system message
    initializeChat();
    
    // Set guard to prevent additional new chats
    setHasActiveNewChat(true);
    
    // Close sidebar on mobile
    if (device.type !== 'desktop') {
      setSidebarOpen(false);
    }
    
    console.log('New chat created (temp, not saved):', newId);
  };

  const handleSelectConversation = async (id: string) => {
    
    setCurrentConversationId(id);
    
    // Clear new chat guard when switching to existing conversation
    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }
    
    // Load the selected conversation
    if (user?.uid) {
      const loadedChat = await loadConversation(user.uid, id);
      if (loadedChat && loadedChat.messages && loadedChat.messages.length > 0) {
        setMessages(loadedChat.messages);
        setActiveModel(loadedChat.modelMode);
        // CRITICAL: Restore provider from conversation, fallback to haley
        setActiveProvider(loadedChat.provider || loadedChat.modelMode || 'haley');
      } else {
        initializeChat();
      }
    }
    
    if (device.type !== 'desktop') {
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!user?.uid) return;
    
    try {
      await deleteConversation(user.uid, id);
      await loadConversationsFromStorage();
      
      // If we deleted the current conversation, start a new one
      if (id === currentConversationId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient mb-4">Haley OS</div>
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
    return <LoginPage />;
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

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(!sidebarOpen)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeModel={activeModel}
        onSelectModel={handleModelSelect}
        userName={user.displayName || undefined}
        userEmail={user.email || undefined}
        userPhotoURL={user.photoURL || undefined}
        onRecoverChat={() => console.log('Recover chat not yet implemented')}
        onMigrateChat={() => console.log('Migrate chat not yet implemented')}
      />

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
        device.type === 'desktop' 
          ? (sidebarOpen ? 'ml-80' : 'ml-[60px]')
          : 'ml-0'
      }`}>
        {/* Header with hamburger menu */}
        <ChatHeader
          aiMode={aiMode}
          activeModels={activeModel ? [activeModel] : ['Haley']}
          activeModel={activeModel}
          onToggleResearch={() => setResearchEnabled(!researchEnabled)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenMagicWindow={() => setMagicWindowOpen(!magicWindowOpen)}
          systemStatus={systemStatus}
          researchEnabled={researchEnabled}
          logicEngineEnabled={logicEngineEnabled}
          onToggleLogicEngine={() => setLogicEngineEnabled(!logicEngineEnabled)}
          onMigrateChat={() => console.log('Migrate chat not yet implemented')}
        />

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onRetryMessage={handleRetryMessage}
          onBranchMessage={handleBranchMessage}
          onStreamingComplete={() => setIsLoading(false)}
        />

        {/* Input Bar */}
        <ChatInputBar
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          onGallerySelect={handleGallerySelect}
          sidebarOpen={sidebarOpen && device.type === 'desktop'}
        />

        {/* Magic Window - bottom right, translucent */}
        <MagicWindow
          isOpen={magicWindowOpen}
          content={magicWindowContent}
          researchEnabled={researchEnabled}
          logicEngineEnabled={logicEngineEnabled}
          onClose={() => setMagicWindowOpen(false)}
        />

        {/* Mode Selector Modal */}
        <ModeSelector
          isOpen={modeSelectorOpen}
          currentMode={aiMode}
          activeModel={activeModel}
          onClose={() => setModeSelectorOpen(false)}
          onSelectMode={handleModeSelect}
          onSelectModel={handleModelSelect}
          availableModels={availableModels}
          availableAgents={availableAgents}
        />
      </div>
    </div>
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
