'use client';

// Force dynamic rendering to prevent Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, getSystemStatus } from '@/lib/haleyApi';
import { saveChat, loadAllChats, loadChat, deleteChat as deleteStoredChat } from '@/lib/chatStorage';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInputBar from '@/components/ChatInputBar';
import MagicWindow from '@/components/MagicWindow';
import ModeSelector from '@/components/ModeSelector';
import Sidebar from '@/components/Sidebar';
import type { Message, AIMode, SystemStatus, MagicWindowContent, ConversationHistory } from '@/types';

export default function ChatPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();

  // Ref to store cleanup functions for active streams
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());

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
  // FIX #3: Initialize with default model (Gemini, first in list)
  const [activeModel, setActiveModel] = useState<string | null>('gemini');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
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
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      initializeChat();
      loadConversationsFromStorage();
      loadSystemStatus();
      const statusInterval = setInterval(loadSystemStatus, 30000); // Update every 30s
      return () => clearInterval(statusInterval);
    }
  }, [user, authLoading, router]);

  // Cleanup all active streams on unmount
  useEffect(() => {
    return () => {
      console.log('[CHAT] Component unmounting, cleaning up streams');
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  // Monitor activeModel changes for debugging
  useEffect(() => {
    console.log('[CHAT] ===== activeModel STATE CHANGED =====');
    console.log('[CHAT] New activeModel value:', activeModel);
    console.log('[CHAT] ======================================');
  }, [activeModel]);

  const loadConversationsFromStorage = async () => {
    if (!user?.uid) return;
    
    try {
      const loadedConversations = await loadAllChats(user.uid);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const initializeChat = () => {
    const systemMessage: Message = {
      id: generateId(),
      role: 'system',
      content: 'Haley OS initialized. Multi-LLM router active. Ready to assist.',
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
    // FIXED: Removed isLoading check - allow sending while streaming
    if (!textToSend.trim() && !audioBlob) return;

    // Validate model selection
    if (!activeModel) {
      console.error('[CHAT] ❌ CRITICAL: No model selected');
      setActiveModel('gemini');
      alert('Please select an AI model first. Defaulting to Gemini.');
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: audioBlob ? '[Voice message]' : textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Clear new chat guard when user sends first message
    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }

    // Create placeholder assistant message for streaming
    const assistantMessageId = generateId();
    let streamingContent = '';
    
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      metadata: {
        operation: 'chat',
        model_used: activeModel,
        streaming: true,
      },
    };
    
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      console.log('[CHAT] ========== ASYNC SENDING MESSAGE ==========');
      console.log('[CHAT] activeModel state:', activeModel);
      
      // Submit message and stream response
      const { messageId, cleanup } = await sendMessage(
        textToSend,
        activeModel,
        // onToken callback - update message as tokens arrive
        (token: string) => {
          streamingContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: streamingContent }
                : msg
            )
          );
        },
        // onComplete callback
        (response) => {
          console.log('[CHAT] Stream completed');
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: streamingContent,
                    metadata: {
                      ...msg.metadata,
                      streaming: false,
                      model_used: response.model_used,
                      baby_invoked: response.baby_invoked,
                      task: response.task,
                      supreme_court: aiMode === 'supreme-court',
                      llm_sources: activeModel ? [activeModel] : undefined,
                    },
                  }
                : msg
            )
          );

          // Remove cleanup function from ref after completion
          cleanupFunctionsRef.current.delete(assistantMessageId);

          // If audioBlob was used, speak the response
          if (audioBlob) {
            speakResponse(streamingContent);
          }

          // Auto-save after completion
          if (user?.uid) {
            setMessages((currentMessages) => {
              saveChat(user.uid!, currentConversationId, currentMessages, activeModel)
                .then(() => loadConversationsFromStorage())
                .catch((error) => console.error('Error saving chat:', error));
              return currentMessages;
            });
          }

          loadSystemStatus();
        },
        // onError callback
        (error) => {
          console.error('[CHAT] Stream error:', error);

          // Remove cleanup function from ref after error
          cleanupFunctionsRef.current.delete(assistantMessageId);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Error: ${error}`,
                    metadata: { ...msg.metadata, streaming: false, error: true },
                  }
                : msg
            )
          );
        }
      );

      // Store cleanup function for this stream
      cleanupFunctionsRef.current.set(assistantMessageId, cleanup);
      
      console.log('[CHAT] Message submitted (non-blocking)');
      console.log('[CHAT] ============================================');

    } catch (error) {
      console.error('[CHAT] Fatal error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                metadata: { ...msg.metadata, streaming: false, error: true },
              }
            : msg
        )
      );
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
    
    console.log('[CHAT] ========== MODEL SELECTION ==========');
    console.log('[CHAT] Switching from:', activeModel || 'haley');
    console.log('[CHAT] Switching to:', modelKey);
    console.log('[CHAT] Parameter received (justice):', justice);
    
    // Save current messages to current model
    const currentModelKey = activeModel || 'haley';
    setConversationsByJustice(prev => ({
      ...prev,
      [currentModelKey]: messages
    }));
    
    // Load messages for selected model
    const loadedMessages = conversationsByModel[modelKey];
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages);
    } else {
      // Initialize with system message for new model
      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: justice 
          ? `Switched to ${justice.charAt(0).toUpperCase() + justice.slice(1)}. Ready to assist.`
          : 'Haley OS initialized. Multi-LLM router active. Ready to assist.',
        timestamp: new Date(),
        metadata: {
          operation: 'system_init',
          selectedModel: justice,
        },
      };
      setMessages([systemMessage]);
    }
    
    // CRITICAL: Set the model state
    setActiveModel(justice);
    
    // Force update the current conversation's modelMode
    if (currentConversationId) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, modelMode: justice }
          : conv
      ));
    }
    
    setAiMode('single');
    
    console.log(`[CHAT] Model switched to: ${modelKey}`);
    console.log('[CHAT] Loaded messages:', loadedMessages?.length || 0);
    console.log('[CHAT] activeModel should now be:', justice);
    console.log('[CHAT] ========================================');
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
    // Save current chat before switching
    if (user?.uid && messages.length > 1 && id !== currentConversationId) {
      await saveChat(user.uid, currentConversationId, messages, activeModel);
    }
    
    setCurrentConversationId(id);
    
    // Clear new chat guard when switching to existing conversation
    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }
    
    // Load the selected conversation
    if (user?.uid) {
      const loadedChat = await loadChat(user.uid, id);
      if (loadedChat && loadedChat.messages && loadedChat.messages.length > 0) {
        setMessages(loadedChat.messages);
        // CRITICAL FIX: Restore the activeModel from the loaded conversation
        setActiveModel(loadedChat.modelMode);
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
      await deleteStoredChat(user.uid, id);
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
    return null;
  }

  // FIXED: Calculate if any message is currently streaming
  const isAnyMessageStreaming = messages.some(msg => msg.metadata?.streaming === true);

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
          isLoading={isAnyMessageStreaming}
          onRetryMessage={handleRetryMessage}
          onBranchMessage={handleBranchMessage}
          onStreamingComplete={() => {}}
        />

        {/* Input Bar - FIXED: Never disabled during streaming */}
        <ChatInputBar
          input={input}
          setInput={setInput}
          isLoading={false}
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
