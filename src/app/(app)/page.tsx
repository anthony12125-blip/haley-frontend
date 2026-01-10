'use client';

// Force dynamic rendering to prevent Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, sendAudioMessage, sendMultiLLMMessage, getSystemStatus } from '@/lib/haleyApi';
import { loadAllConversations, loadConversation, deleteConversation } from "@/lib/haleyApi";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MigrationEngine } from '@/lib/migrationEngine';
import { useAIClipboard } from '@/contexts/AIClipboardContext';
import { extractArtifacts } from '@/lib/artifactsUtils';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInputBar from '@/components/ChatInputBar';
import UploadPreviewZone from '@/components/UploadPreviewZone';
import MagicWindow from '@/components/MagicWindow';
import ModeSelector from '@/components/ModeSelector';
import VoiceStatusBar from '@/components/VoiceStatusBar';
import AudioPlaybackBar from '@/components/AudioPlaybackBar';
import LLMResponseCard from '@/components/LLMResponseCard';
import ArtifactsPanel from '@/components/ArtifactsPanel';
import LoginPage from '@/components/LoginPage';
import SuggestedReplies from '@/components/SuggestedReplies';
import SummarizeButton from '@/components/SummarizeButton';
import SummaryCard from '@/components/SummaryCard';
import Sidebar from '@/components/Sidebar';
import IdeaHarvesterPage from './ai-labs/ideaharvester/page';
import RobloxExpertPage from './ai-labs/robloxexpert/page';
import EngineeringPage from './ai-labs/engineering/page';
import ApiKeysPage from './ai-labs/api-keys/page';
import SoundboardPage from './ai-rd/soundboard/page';
import type { Message, AIMode, SystemStatus, MagicWindowContent, ConversationHistory, Artifact } from '@/types';

export default function ChatPage() {
  console.log('[ChatPage] RENDER - this should only happen on / route');

  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();
  const { setPayload } = useAIClipboard();

  // Ref to store cleanup functions for active streams
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());

  // Write lock to prevent race conditions during Firestore persistence

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [magicWindowOpen, setMagicWindowOpen] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Artifacts
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [shouldShowSummarizeIcon, setShouldShowSummarizeIcon] = useState(false);

  // Summary Card State
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Initialize sidebar state from localStorage, with desktop default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_sidebarCollapsed');
      if (savedState !== null) {
        const isCollapsed = JSON.parse(savedState);
        setSidebarOpen(!isCollapsed);
      } else if (device.type === 'desktop') {
        setSidebarOpen(true);
      }
    }
  }, [device.type]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_sidebarCollapsed', JSON.stringify(!sidebarOpen));
    }
  }, [sidebarOpen]);

  // AI State
  const [aiMode, setAiMode] = useState<AIMode>('single');
  const [activeModel, setActiveModel] = useState<string | null>(null);

  // Multi-LLM State
  const [multiLLMEnabled, setMultiLLMEnabled] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [multiLLMResponses, setMultiLLMResponses] = useState<Record<string, string>>({});
  const [completedModels, setCompletedModels] = useState<Set<string>>(new Set());

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Outbound Artifacts State
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);

  // Feature Toggles
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [logicEngineEnabled, setLogicEngineEnabled] = useState(false);
  
  // Magic Window
  const [magicWindowContent, setMagicWindowContent] = useState<MagicWindowContent | null>(null);
  
  // System State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Voice Status
  const [voiceIsPlaying, setVoiceIsPlaying] = useState(false);
  const [voiceIsListening, setVoiceIsListening] = useState(false);
  const [voiceHasError, setVoiceHasError] = useState(false);
  const [voiceErrorMessage, setVoiceErrorMessage] = useState('');

  // Audio Playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioText, setAudioText] = useState<string>('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Conversation History
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
  
  const [hasActiveNewChat, setHasActiveNewChat] = useState(false);

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

  // Initialize activeModel from localStorage or default to 'haley'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastUsedModel = localStorage.getItem('haley_lastUsedModel') || 'haley';
      setActiveModel(lastUsedModel);
    }
  }, []);

  // Save activeModel to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && activeModel) {
      localStorage.setItem('haley_lastUsedModel', activeModel);
    }
  }, [activeModel]);

  useEffect(() => {
    if (user) {
      initializeChat();
      loadConversationsFromStorage();
      loadSystemStatus();
      const statusInterval = setInterval(loadSystemStatus, 30000);
      return () => clearInterval(statusInterval);
    }
  }, [user, authLoading]);

  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  // Extract artifacts from assistant messages (code blocks AND multi-LLM responses)
  useEffect(() => {
    const newArtifacts: Artifact[] = [];

    messages.forEach(msg => {
      // Regular code block artifacts
      if (msg.role === 'assistant' && !msg.metadata?.streaming && !msg.metadata?.isMultiLLM) {
        const { artifacts: extractedArtifacts } = extractArtifacts(msg.content, msg.id);
        newArtifacts.push(...extractedArtifacts);
      }

      // Multi-LLM artifacts
      if (msg.metadata?.isMultiLLM && msg.metadata?.providers) {
        const providers = msg.metadata.providers;
        const providerResponses = msg.metadata.providerResponses || {};
        const completedProviders = msg.metadata.completedProviders || [];

        providers.forEach((provider: string) => {
          const response = providerResponses[provider] || '';
          const isComplete = completedProviders.includes(provider);
          const isStreaming = !isComplete && response.length > 0;

          newArtifacts.push({
            id: `${msg.id}-${provider}`,
            type: 'llm-response',
            content: response,
            title: provider.charAt(0).toUpperCase() + provider.slice(1),
            messageId: msg.id,
            modelId: provider,
            isStreaming: isStreaming,
          });
        });
      }
    });

    if (newArtifacts.length > 0) {
      setArtifacts(newArtifacts);
      // Artifacts now render in bottom UploadPreviewZone instead of right sidebar
      // setArtifactsPanelOpen(true);
    }
  }, [messages]);

  // Monitor multi-LLM completion and show summarize icon
  useEffect(() => {
    const hasCompleteMultiLLM = messages.some(msg =>
      msg.metadata?.isMultiLLM &&
      msg.metadata?.allProvidersComplete === true
    );
    setShouldShowSummarizeIcon(hasCompleteMultiLLM);
  }, [messages]);

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

    // Allow send if input has text OR files are attached OR audio is present
    if (!input.trim() && !audioBlob && pendingUploads.length === 0) {
      return;
    }

    // VOICE INPUT: Audio blobs bypass multi-LLM mode
    // Multi-LLM Mode Check (only for text messages)
    if (!audioBlob && multiLLMEnabled && selectedModels.length > 0) {

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: textToSend,
        timestamp: new Date(),
        attachments: pendingUploads.length > 0 ? [...pendingUploads] : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      if (hasActiveNewChat) {
        setHasActiveNewChat(false);
      }

      // Create multi-LLM response container message
      const multiLLMMessageId = generateId();
      const multiLLMMessage: Message = {
        id: multiLLMMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: {
          operation: 'multi-llm',
          isMultiLLM: true,
          providers: selectedModels,
          streaming: true,
          providerResponses: {},
          completedProviders: [],
        },
      };

      setMessages((prev) => [...prev, multiLLMMessage]);

      // Initialize response tracking
      const providerResponses: Record<string, string> = {};
      const providerStreamingContent: Record<string, string> = {};
      selectedModels.forEach(model => {
        providerResponses[model] = '';
        providerStreamingContent[model] = '';
      });

      try {
        const filesToSend = pendingUploads.length > 0 ? pendingUploads : undefined;

        const streams = await sendMultiLLMMessage(
          textToSend,
          selectedModels,
          (provider: string, token: string) => {
            // Update streaming content for this provider
            providerStreamingContent[provider] += token;

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === multiLLMMessageId
                  ? {
                      ...msg,
                      metadata: {
                        ...msg.metadata,
                        providerResponses: {
                          ...msg.metadata?.providerResponses,
                          [provider]: providerStreamingContent[provider],
                        },
                      },
                    }
                  : msg
              )
            );
          },
          (provider: string, response) => {
            // Mark provider as completed

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === multiLLMMessageId) {
                  const existingProviders = msg.metadata?.completedProviders || [];
                  const completedProviders = existingProviders.includes(provider)
                    ? existingProviders
                    : [...existingProviders, provider];
                  const allComplete = completedProviders.length === selectedModels.length;

                  return {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      completedProviders,
                      streaming: !allComplete,
                      allProvidersComplete: allComplete,
                    },
                  };
                }
                return msg;
              })
            );

            // Cleanup this provider's stream
            const streamData = streams.find(s => s.provider === provider);
            if (streamData) {
              streamData.cleanup();
              cleanupFunctionsRef.current.delete(`${multiLLMMessageId}-${provider}`);
            }
          },
          (provider: string, error: string) => {
            console.error(`[MULTI-LLM] ${provider} error:`, error);

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === multiLLMMessageId) {
                  // Mark provider as completed even on error
                  const existingProviders = msg.metadata?.completedProviders || [];
                  const completedProviders = existingProviders.includes(provider)
                    ? existingProviders
                    : [...existingProviders, provider];
                  const allComplete = completedProviders.length === selectedModels.length;

                  return {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      providerResponses: {
                        ...msg.metadata?.providerResponses,
                        [provider]: `Error: ${error}`,
                      },
                      completedProviders,
                      streaming: !allComplete,
                      allProvidersComplete: allComplete,
                    },
                  };
                }
                return msg;
              })
            );
          },
          // Include files in multi-LLM message payload
          filesToSend
        );

        // Store cleanup functions
        streams.forEach((stream) => {
          cleanupFunctionsRef.current.set(
            `${multiLLMMessageId}-${stream.provider}`,
            stream.cleanup
          );
        });

        // Clear pending uploads after message packaged for backend
        if (pendingUploads.length > 0) {
          setPendingUploads([]);
        }

      } catch (error) {

        // Create error artifacts for ALL providers
        const errorMessage = error instanceof Error ? error.message : 'Failed to start multi-LLM query';
        const errorResponses: Record<string, string> = {};
        selectedModels.forEach(model => {
          errorResponses[model] = `Error: ${errorMessage}`;
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === multiLLMMessageId
              ? {
                  ...msg,
                  metadata: {
                    ...msg.metadata,
                    providerResponses: errorResponses,
                    completedProviders: selectedModels,
                    streaming: false,
                    allProvidersComplete: true,
                  },
                }
              : msg
          )
        );
      }

      return; // Exit early for multi-LLM mode
    }

    // Single Model Mode (existing logic)
    if (!activeModel) {
      setActiveModel('gemini');
      alert('Please select an AI model first. Defaulting to Gemini.');
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: audioBlob ? '[Voice message]' : textToSend,
      timestamp: new Date(),
      attachments: pendingUploads.length > 0 ? [...pendingUploads] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }

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
      const filesToSend = pendingUploads.length > 0 ? pendingUploads : undefined;

      const { messageId, cleanup } = audioBlob
        ? await sendAudioMessage(
            audioBlob,
            activeModel,
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
            (response) => {
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

              cleanupFunctionsRef.current.delete(assistantMessageId);
            },
            (error) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: `Error: ${error}`,
                        metadata: { ...msg.metadata, streaming: false },
                      }
                    : msg
                )
              );
              cleanupFunctionsRef.current.delete(assistantMessageId);
            }
          )
        : await sendMessage(
            textToSend,
            activeModel,
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
        (response) => {
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

          cleanupFunctionsRef.current.delete(assistantMessageId);
          loadSystemStatus();
        },
        (error) => {

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
        },
        // Include files in message payload
        filesToSend
      );

      cleanupFunctionsRef.current.set(assistantMessageId, cleanup);

      // Clear pending uploads after message packaged for backend
      if (pendingUploads.length > 0) {
        setPendingUploads([]);
      }

    } catch (error) {
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

  const handleFileUpload = (files: FileList) => {
    // Convert FileList to File array
    const newFiles = Array.from(files);

    // Append to existing uploads (not replace)
    setPendingUploads(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setPendingUploads(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleRemoveArtifact = (artifactId: string) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== artifactId));
  };

  const handleAudioReady = (url: string, text: string) => {
    setAudioUrl(url);
    setAudioText(text);

    // Create and play audio
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsAudioPlaying(true);
    audio.onpause = () => setIsAudioPlaying(false);
    audio.onended = () => {
      setIsAudioPlaying(false);
      setAudioUrl(null);
    };

    audio.play();
  };

  const handleAudioPlayPause = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleAudioClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioUrl(null);
    setIsAudioPlaying(false);
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
    const currentModelKey = activeModel || 'haley';
    setConversationsByJustice(prev => ({
      ...prev,
      [currentModelKey]: messages
    }));

    const loadedMessages = conversationsByModel[modelKey];
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages);
    } else {
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

    setActiveModel(justice);

    if (currentConversationId) {
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, modelMode: justice }
          : conv
      ));
    }

    setAiMode('single');
  };

  const handleMultiLLMChange = useCallback((enabled: boolean, models: string[]) => {
    setMultiLLMEnabled(enabled);
    setSelectedModels(models);
  }, []);

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

  const handleRetryProvider = async (messageId: string, provider: string) => {

    // Find the original user message
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex <= 0) return;

    const userMessage = messages[msgIndex - 1];
    if (userMessage.role !== 'user') return;

    // Reset this provider's state to streaming
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                providerResponses: {
                  ...msg.metadata?.providerResponses,
                  [provider]: '',
                },
                completedProviders: (msg.metadata?.completedProviders || []).filter(p => p !== provider),
                streaming: true,
                allProvidersComplete: false,
              },
            }
          : msg
      )
    );

    // Stream content tracker for this retry
    let providerStreamingContent = '';

    try {
      const { messageId: streamMsgId, cleanup } = await sendMessage(
        userMessage.content,
        provider,
        (token) => {
          // Token callback
          providerStreamingContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      providerResponses: {
                        ...msg.metadata?.providerResponses,
                        [provider]: providerStreamingContent,
                      },
                    },
                  }
                : msg
            )
          );
        },
        (response) => {
          // Completion callback
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === messageId) {
                const existingProviders = msg.metadata?.completedProviders || [];
                const completedProviders = existingProviders.includes(provider)
                  ? existingProviders
                  : [...existingProviders, provider];
                const allProviders = msg.metadata?.providers || [];
                const allComplete = completedProviders.length === allProviders.length;

                return {
                  ...msg,
                  metadata: {
                    ...msg.metadata,
                    completedProviders,
                    streaming: !allComplete,
                    allProvidersComplete: allComplete,
                  },
                };
              }
              return msg;
            })
          );
          cleanup();
        },
        (error) => {
          // Error callback
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === messageId) {
                const existingProviders = msg.metadata?.completedProviders || [];
                const completedProviders = existingProviders.includes(provider)
                  ? existingProviders
                  : [...existingProviders, provider];
                const allProviders = msg.metadata?.providers || [];
                const allComplete = completedProviders.length === allProviders.length;

                return {
                  ...msg,
                  metadata: {
                    ...msg.metadata,
                    providerResponses: {
                      ...msg.metadata?.providerResponses,
                      [provider]: `Error: ${error}`,
                    },
                    completedProviders,
                    streaming: !allComplete,
                    allProvidersComplete: allComplete,
                  },
                };
              }
              return msg;
            })
          );
        }
      );

      // Store cleanup function
      cleanupFunctionsRef.current.set(`${messageId}-${provider}-retry`, cleanup);

    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  providerResponses: {
                    ...msg.metadata?.providerResponses,
                    [provider]: `Error: ${error instanceof Error ? error.message : 'Retry failed'}`,
                  },
                  completedProviders: (() => {
                    const existingProviders = msg.metadata?.completedProviders || [];
                    return existingProviders.includes(provider)
                      ? existingProviders
                      : [...existingProviders, provider];
                  })(),
                },
              }
            : msg
        )
      );
    }
  };

  const handleMigrateChat = async () => {
    try {
      // Generate AI-agnostic migration payload for entire chat
      const payload = MigrationEngine.migrateFullChat(messages);

      // Store in AI Clipboard
      setPayload(payload);

      // Copy to system clipboard
      await MigrationEngine.copyToClipboard(payload);

      console.log('Chat migrated successfully:', payload);
    } catch (error) {
      console.error('Failed to migrate chat:', error);
    }
  };

  const handleNewConversation = async () => {
    if (hasActiveNewChat) {
      return;
    }

    const newId = generateId();

    const newChat: ConversationHistory = {
      id: newId,
      title: 'New Chat',
      lastMessage: 'No messages yet',
      timestamp: new Date(),
      lastActive: new Date(),
      messageCount: 0,
      modelMode: activeModel || undefined,
    };

    setConversations(prev => [newChat, ...prev]);
    setCurrentConversationId(newId);
    initializeChat();
    setHasActiveNewChat(true);

    if (device.type !== 'desktop') {
      setSidebarOpen(false);
    }
  };

  const handleSelectConversation = async (id: string) => {

    setCurrentConversationId(id);
    
    if (hasActiveNewChat) {
      setHasActiveNewChat(false);
    }
    
    if (user?.uid) {
      const loadedChat = await loadConversation(user.uid, id);
      if (loadedChat && loadedChat.messages && loadedChat.messages.length > 0) {
        setMessages(loadedChat.messages);
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
      await deleteConversation(user.uid, id);
      await loadConversationsFromStorage();
      
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

  const isAnyMessageStreaming = messages.some(msg => msg.metadata?.streaming === true);

  // Check if we should show suggested replies (when Haley offers the summary)
  const shouldShowSuggestedReplies = messages.some(msg =>
    msg.metadata?.operation === 'summary-offer'
  );

  const handleSuggestionSelect = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleMultiLLMSummary = async () => {
    // STEP 1: Hide button, show card
    setShouldShowSummarizeIcon(false);
    setShowSummaryCard(true);
    setSummaryLoading(true);
    setSummaryText('');

    // STEP 2: Find the completed multi-LLM message
    const multiLLMMsg = messages.find(m =>
      m.metadata?.isMultiLLM &&
      m.metadata?.allProvidersComplete
    );

    if (!multiLLMMsg) {
      setSummaryLoading(false);
      setSummaryText('No multi-LLM responses found to summarize.');
      return;
    }

    // STEP 3: Collect all provider responses
    const providerResponses = multiLLMMsg.metadata?.providerResponses || {};
    const providers = multiLLMMsg.metadata?.providers || [];

    const summaryPrompt = `Summarize and compare these AI responses:\n\n${
      providers.map(p => `${p.toUpperCase()}: ${providerResponses[p]}`).join('\n\n')
    }`;

    // STEP 4: Stream response into summary card (NOT main chat)
    let streamingContent = '';

    try {
      const { messageId, cleanup } = await sendMessage(
        summaryPrompt,
        'haley',
        (token: string) => {
          // Token callback - stream into card
          streamingContent += token;
          setSummaryText(streamingContent);
        },
        (response) => {
          // Completion callback
          setSummaryLoading(false);
          cleanup();
        },
        (error) => {
          // Error callback
          setSummaryText(`Error generating summary: ${error}`);
          setSummaryLoading(false);
        }
      );
    } catch (error) {
      setSummaryText(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSummaryLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar - Now rendered in page.tsx */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={() => setActiveModule(null)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeModel={activeModel}
        onSelectModel={handleModelSelect}
        userName={user?.displayName || undefined}
        userEmail={user?.email || undefined}
        userPhotoURL={user?.photoURL || undefined}
        onRecoverChat={() => {}}
        onSelectModule={setActiveModule}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          device.type === 'desktop'
            ? (sidebarOpen ? 'ml-80' : 'ml-[60px]')
            : 'ml-0'
        }`}
      >
        {activeModule === null ? (
          <>
            {/* Chat Mode */}
            <VoiceStatusBar
              isPlaying={voiceIsPlaying}
              isListening={voiceIsListening}
              hasError={voiceHasError}
              errorMessage={voiceErrorMessage}
            />

            {audioUrl && (
              <AudioPlaybackBar
                audioUrl={audioUrl}
                isPlaying={isAudioPlaying}
                onPlayPause={handleAudioPlayPause}
                onClose={handleAudioClose}
                text={audioText}
              />
            )}

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
              onMigrateChat={handleMigrateChat}
            />

            <ChatMessages
              messages={messages}
              isLoading={isAnyMessageStreaming}
              onRetryMessage={handleRetryMessage}
              onBranchMessage={handleBranchMessage}
              onStreamingComplete={() => {}}
              onRetryProvider={handleRetryProvider}
              onAudioReady={handleAudioReady}
              onVoiceError={(msg) => {
                setVoiceHasError(true);
                setVoiceErrorMessage(msg);
                setTimeout(() => setVoiceHasError(false), 5000);
              }}
              onMultiLLMSummary={handleMultiLLMSummary}
            />

            {(pendingUploads.length > 0 || artifacts.length > 0) && (
              <UploadPreviewZone
                files={pendingUploads}
                artifacts={artifacts}
                onRemoveFile={handleRemoveFile}
                onRemoveArtifact={handleRemoveArtifact}
                sidebarOpen={sidebarOpen && device.type === 'desktop'}
              />
            )}

            {shouldShowSuggestedReplies && (
              <SuggestedReplies
                suggestions={['Yes']}
                onSelect={handleSuggestionSelect}
                sidebarOpen={sidebarOpen && device.type === 'desktop'}
              />
            )}

            {shouldShowSummarizeIcon && (
              <SummarizeButton
                onClick={handleMultiLLMSummary}
                sidebarOpen={sidebarOpen && device.type === 'desktop'}
              />
            )}

            {showSummaryCard && (
              <SummaryCard
                isLoading={summaryLoading}
                summaryText={summaryText}
                onClose={() => setShowSummaryCard(false)}
                sidebarOpen={sidebarOpen && device.type === 'desktop'}
              />
            )}

            <ChatInputBar
              input={input}
              setInput={setInput}
              isLoading={false}
              onSend={handleSend}
              onFileUpload={handleFileUpload}
              onGallerySelect={handleGallerySelect}
              sidebarOpen={sidebarOpen && device.type === 'desktop'}
              onRecordingStart={() => setVoiceIsListening(true)}
              onRecordingStop={() => setVoiceIsListening(false)}
              pendingUploads={pendingUploads}
            />

            <MagicWindow
              isOpen={magicWindowOpen}
              content={magicWindowContent}
              researchEnabled={researchEnabled}
              logicEngineEnabled={logicEngineEnabled}
              onClose={() => setMagicWindowOpen(false)}
            />

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

            {artifactsPanelOpen && artifacts.length > 0 && (
              <ArtifactsPanel
                artifacts={artifacts}
                onClose={() => setArtifactsPanelOpen(false)}
              />
            )}
          </>
        ) : activeModule === 'ideaharvester' ? (
          <IdeaHarvesterPage />
        ) : activeModule === 'robloxexpert' ? (
          <RobloxExpertPage />
        ) : activeModule === 'engineering' ? (
          <EngineeringPage />
        ) : activeModule === 'api-keys' ? (
          <ApiKeysPage />
        ) : activeModule === 'soundboard' ? (
          <SoundboardPage />
        ) : null}
      </div>
    </>
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
