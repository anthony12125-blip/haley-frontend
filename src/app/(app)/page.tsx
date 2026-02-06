'use client';

// Force dynamic rendering to prevent Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { sendMessage, sendAudioMessage, sendMultiLLMMessage, getSystemStatus } from '@/lib/haleyApi';
import { loadAllConversations, loadConversation, deleteConversation } from "@/lib/haleyApi";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { MigrationEngine } from '@/lib/migrationEngine';
import { useAIClipboard } from '@/contexts/AIClipboardContext';
import { useProcess, SYSTEM_PIDS } from '@/providers/ProcessProvider';
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
import Dashboard from '@/components/Dashboard';
import ProcessTabBar from '@/components/ProcessTabBar';
import IdeaHarvesterPage from './ai-labs/ideaharvester/page';
import RobloxExpertPage from './ai-labs/robloxexpert/page';
import EngineeringPage from './ai-labs/engineering/page';
import ApiKeysPage from './ai-labs/api-keys/page';
import SoundboardPage from './ai-rd/soundboard/page';
import HomeworkSolver from '@/components/modules/HomeworkSolver';
import CodeAssistant from '@/components/modules/CodeAssistant';
import ActionItemExtractor from '@/components/modules/ActionItemExtractor';
import PhotoStudio from '@/components/modules/PhotoStudio';
import CRM from '@/components/modules/CRM';
import Atlas from '@/components/modules/Atlas';
import ATSResumeOptimizer from '@/components/modules/ATSResumeOptimizer';
import Receptionist from '@/components/modules/Receptionist';
import LegalWorkflow from '@/components/modules/LegalWorkflow';
import FeedbackAdminDashboard from '@/components/modules/FeedbackAdminDashboard';
import WorkflowBuilder from '@/components/modules/WorkflowBuilder';
import WorkflowAnalytics from '@/components/modules/WorkflowAnalytics';
import Navigator from '@/components/modules/Navigator';
import Summarizer from '@/components/modules/Summarizer';
import Translator from '@/components/modules/Translator';
import VoiceCloner from '@/components/modules/VoiceCloner';
import ImageEnhancer from '@/components/modules/ImageEnhancer';
import ImageGenerator from '@/components/modules/ImageGenerator';
import DocScanner from '@/components/modules/DocScanner';
import PlantDiagnostic from '@/components/modules/PlantDiagnostic';
import WritingAssistant from '@/components/modules/WritingAssistant';
import AudioDubber from '@/components/modules/AudioDubber';
import BeautyRetouch from '@/components/modules/BeautyRetouch';
import SafetyIngredientScanner from '@/components/modules/SafetyIngredientScanner';
import SlideDeckGenerator from '@/components/modules/SlideDeckGenerator';
import StudyGuide from '@/components/modules/StudyGuide';
import EmailGenerator from '@/components/modules/EmailGenerator';
import StoryWriter from '@/components/modules/StoryWriter';
import GrammarOverlay from '@/components/modules/GrammarOverlay';
import MathLogicSolver from '@/components/modules/MathLogicSolver';
import ExpenseAuditor from '@/components/modules/ExpenseAuditor';
import CollectibleValuer from '@/components/modules/CollectibleValuer';
import ContractAuditor from '@/components/modules/ContractAuditor';
import SpeakingCoach from '@/components/modules/SpeakingCoach';
import ViralTrendTracker from '@/components/modules/ViralTrendTracker';
import NoCodeWebScraper from '@/components/modules/NoCodeWebScraper';
import CodeSmokeTester from '@/components/modules/CodeSmokeTester';
import FaceSwapMotion from '@/components/modules/FaceSwapMotion';
import VideoAutoCutter from '@/components/modules/VideoAutoCutter';
import MusicProducer from '@/components/modules/MusicProducer';
import VisualStoryboarder from '@/components/modules/VisualStoryboarder';
import CinematicVideoGen from '@/components/modules/CinematicVideoGen';
import IdentityArchitect from '@/components/modules/IdentityArchitect';
import AllInOneDesign from '@/components/modules/AllInOneDesign';
import OpenClaw from '@/components/modules/OpenClaw';
import ModuleFeedbackWrapper from '@/components/ModuleFeedbackWrapper';
import type { Message, AIMode, SystemStatus, MagicWindowContent, ConversationHistory, Artifact } from '@/types';

export default function ChatPage() {
  console.log('[ChatPage] RENDER - this should only happen on / route');

  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();
  const { setPayload } = useAIClipboard();

  // Process Management - HaleyOS Kernel
  const {
    spawn,
    foreground,
    kill,
    activeModuleId,
    getForeground,
    findProcessByModule,
    goBack,
    goHome,
    canGoBack,
    listProcesses,
    isHydrated,
    currentConversationId: persistedConversationId,
    setCurrentConversationId: setPersistedConversationId,
  } = useProcess();

  // Get process count for dashboard badge
  const processCount = listProcesses().length;

  // Ref to store cleanup functions for active streams
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());

  // Write lock to prevent race conditions during Firestore persistence

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [magicWindowOpen, setMagicWindowOpen] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Derive activeModule from process system for backward compatibility
  const activeModule = activeModuleId;

  // Helper to launch/focus a module
  const launchModule = useCallback((moduleId: string | null) => {
    console.log('[LAUNCH] launchModule called with:', moduleId);

    if (moduleId === null) {
      // Return to chat
      console.log('[LAUNCH] Returning to chat');
      foreground(SYSTEM_PIDS.CHAT);
    } else {
      // Spawn or foreground module
      const existingProcess = findProcessByModule(moduleId);
      if (existingProcess) {
        console.log('[LAUNCH] Module already running, foregrounding:', existingProcess.pid);
        foreground(existingProcess.pid);
      } else {
        console.log('[LAUNCH] Spawning new process for:', moduleId);
        const pid = spawn(moduleId);
        console.log('[LAUNCH] Spawned pid:', pid, '- now foregrounding');
        foreground(pid);
      }
    }
  }, [spawn, foreground, findProcessByModule]);

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
  const summaryCache = useRef<Record<string, string>>({});

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
    { id: 'haley', name: 'Haley', provider: 'OpenClaw' },
  ];

  const availableAgents: Array<{ id: string; name: string; description: string }> = [];

  // Always use Haley (OpenClaw)
  useEffect(() => {
    setActiveModel(null); // null = Haley
  }, []);

  // Always use Haley - no switching
  useEffect(() => {
    setActiveModel(null);
  }, []);

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
  // Monitor for completed provider response messages and show summarize icon
  useEffect(() => {
    // Find all completed provider response messages
    const completedProviderMessages = messages.filter(msg =>
      msg.metadata?.provider &&
      msg.role === 'assistant' &&
      msg.metadata?.isComplete === true
    );
    // Show the summarize button if there are completed provider responses
    setShouldShowSummarizeIcon(completedProviderMessages.length > 0);
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

      // Clear previous artifacts and summary card for the new query
      setArtifacts([]);
      setShowSummaryCard(false);
      setSummaryText('');
      setShouldShowSummarizeIcon(false);

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: textToSend,
        timestamp: new Date(),
        attachments: pendingUploads.length > 0 ? [...pendingUploads] : undefined,
      };

      // Generate a unique group ID to link all provider responses together
      const multiLLMGroupId = generateId();

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      if (hasActiveNewChat) {
        setHasActiveNewChat(false);
      }

      // Create individual message IDs for each provider
      const providerMessageIds: Record<string, string> = {};
      selectedModels.forEach(provider => {
        providerMessageIds[provider] = generateId();
      });

      // Create placeholder messages for each provider
      const providerMessages: Message[] = selectedModels.map(provider => ({
        id: providerMessageIds[provider],
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
        metadata: {
          provider,
          multiLLMGroupId,
          streaming: true,
          isComplete: false,
        },
      }));

      setMessages((prev) => [...prev, ...providerMessages]);

      // Track streaming content for each provider
      const providerStreamingContent: Record<string, string> = {};
      selectedModels.forEach(model => {
        providerStreamingContent[model] = '';
      });

      try {
        const filesToSend = pendingUploads.length > 0 ? pendingUploads : undefined;

        const streams = await sendMultiLLMMessage(
          textToSend,
          selectedModels,
          (provider: string, token: string) => {
            // Update streaming content for this provider's message
            providerStreamingContent[provider] += token;
            const msgId = providerMessageIds[provider];

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId
                  ? {
                      ...msg,
                      content: providerStreamingContent[provider],
                    }
                  : msg
              )
            );
          },
          (provider: string, response) => {
            // Mark this provider's message as complete
            const msgId = providerMessageIds[provider];

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId
                  ? {
                      ...msg,
                      metadata: {
                        ...msg.metadata,
                        streaming: false,
                        isComplete: true,
                      },
                    }
                  : msg
              )
            );

            // Cleanup this provider's stream
            const streamData = streams.find(s => s.provider === provider);
            if (streamData) {
              streamData.cleanup();
              cleanupFunctionsRef.current.delete(`${msgId}-${provider}`);
            }
          },
          (provider: string, error: string) => {
            console.error(`[MULTI-LLM] ${provider} error:`, error);
            const msgId = providerMessageIds[provider];

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId
                  ? {
                      ...msg,
                      content: `Error: ${error}`,
                      metadata: {
                        ...msg.metadata,
                        streaming: false,
                        isComplete: true,
                        isError: true,
                      },
                    }
                  : msg
              )
            );
          },
          // Include files in multi-LLM message payload
          filesToSend,
          // Conversation history for LLM context
          messages
        );

        // Store cleanup functions
        streams.forEach((stream) => {
          const msgId = providerMessageIds[stream.provider];
          cleanupFunctionsRef.current.set(
            `${msgId}-${stream.provider}`,
            stream.cleanup
          );
        });

        // Clear pending uploads after message packaged for backend
        if (pendingUploads.length > 0) {
          setPendingUploads([]);
        }

      } catch (error) {
        // Create error messages for ALL providers
        const errorMessage = error instanceof Error ? error.message : 'Failed to start multi-LLM query';

        setMessages((prev) =>
          prev.map((msg) => {
            const provider = msg.metadata?.provider;
            if (provider && msg.metadata?.multiLLMGroupId === multiLLMGroupId) {
              return {
                ...msg,
                content: `Error: ${errorMessage}`,
                metadata: {
                  ...msg.metadata,
                  streaming: false,
                  isComplete: true,
                  isError: true,
                },
              };
            }
            return msg;
          })
        );
      }

      return; // Exit early for multi-LLM mode
    }

    // Single Model Mode (existing logic)
    // activeModel=null means Haley is selected, use 'haley' as provider
    const provider = activeModel || 'haley';

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
        model_used: provider,
        streaming: true,
      },
    };
    
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const filesToSend = pendingUploads.length > 0 ? pendingUploads : undefined;

      const { messageId, cleanup } = audioBlob
        ? await sendAudioMessage(
            audioBlob,
            provider,
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
                          llm_sources: [provider],
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
            },
            user?.uid,
            currentConversationId
          )
        : await sendMessage(
            textToSend,
            provider,
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
                      llm_sources: [provider],
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
        filesToSend,
        // User and conversation for persistence
        user?.uid,
        currentConversationId,
        // Pass conversation history (will be filtered in haleyApi)
        messages
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
    // SpeakerButton already plays the audio - we only update UI state here
    // Do NOT create a new Audio element (causes echo/duplicate playback)
    setAudioUrl(url);
    setAudioText(text);
    setIsAudioPlaying(true);

    // Note: audioRef is not set here because SpeakerButton manages its own audio element
    // The AudioPlaybackBar will show but pause/close will only update UI state
  };

  const handleAudioPlayPause = () => {
    // Toggle UI state - actual audio control is managed by SpeakerButton
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleAudioClose = () => {
    // Close the playback bar UI - audio will continue until finished
    // TODO: To properly stop audio, SpeakerButton needs to expose a stop method
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

    // Clear multi-LLM artifacts and summary when switching to single mode
    setArtifacts([]);
    setShowSummaryCard(false);
    setSummaryText('');
    setShouldShowSummarizeIcon(false);
  };

  const handleMultiLLMChange = useCallback((enabled: boolean, models: string[]) => {
    setMultiLLMEnabled(enabled);
    setSelectedModels(models);

    // If disabling multi-LLM, clear artifacts
    if (!enabled) {
      setArtifacts([]);
      setShowSummaryCard(false);
      setSummaryText('');
      setShouldShowSummarizeIcon(false);
    }
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
        },
        undefined, // files
        user?.uid,
        currentConversationId,
        // Conversation history for LLM context
        messages
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
      console.log('[SELECT_CONV] Loaded conversation:', id, 'provider:', loadedChat?.provider);
      if (loadedChat && loadedChat.messages && loadedChat.messages.length > 0) {
        setMessages(loadedChat.messages);
        // Use provider from backend (e.g., 'claude', 'gemini', 'gpt')
        if (loadedChat.provider) {
          console.log('[SELECT_CONV] Setting activeModel to:', loadedChat.provider);
          setActiveModel(loadedChat.provider);
        }
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

  if (authLoading || !isHydrated) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient mb-4">Haley OS</div>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          {!authLoading && !isHydrated && (
            <div className="text-sm text-zinc-500 mt-2">Restoring session...</div>
          )}
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
    console.log('[MultiLLM-Summary] Starting summary generation...');

    // Find all provider response messages (messages with metadata.provider)
    const providerMessages = messages.filter(m =>
      m.metadata?.provider &&
      m.role === 'assistant' &&
      m.metadata?.isComplete === true
    );

    if (providerMessages.length === 0) {
      console.warn('[MultiLLM-Summary] No completed provider responses found');
      setSummaryLoading(false);
      setSummaryText('No multi-LLM responses found to summarize.');
      return;
    }

    // Use the most recent group's messages (find the latest multiLLMGroupId)
    const latestGroupId = providerMessages[providerMessages.length - 1]?.metadata?.multiLLMGroupId;
    const groupMessages = latestGroupId
      ? providerMessages.filter(m => m.metadata?.multiLLMGroupId === latestGroupId)
      : providerMessages;

    const cacheKey = latestGroupId || currentConversationId || 'default';

    if (summaryCache.current[cacheKey]) {
      // Toggle: if card is already visible, collapse it; otherwise expand
      if (showSummaryCard) {
        console.log('[MultiLLM-Summary] Toggle: collapsing cached summary');
        setShowSummaryCard(false);
      } else {
        console.log('[MultiLLM-Summary] Toggle: expanding cached summary');
        setShowSummaryCard(true);
        setSummaryLoading(false);
        setSummaryText(summaryCache.current[cacheKey]);
      }
      return;
    }

    // STEP 1: Show card (keep button visible for future toggle)
    setShowSummaryCard(true);
    setSummaryLoading(true);
    setSummaryText('');

    // STEP 1.5: Health check - verify backend is reachable
    console.log('[MultiLLM-Summary] Checking backend health...');
    try {
      const status = await getSystemStatus();
      console.log('[MultiLLM-Summary] Backend health check passed:', status);
    } catch (healthError) {
      console.error('[MultiLLM-Summary] ❌ Backend health check failed:', healthError);
      setSummaryLoading(false);
      setSummaryText('Cannot connect to backend server. Please ensure the backend is running on localhost:8080 or check NEXT_PUBLIC_BACKEND_URL in .env.local');
      return;
    }

    // STEP 3: Collect all provider responses from individual messages
    const providers = groupMessages.map(m => m.metadata?.provider as string);
    console.log('[MultiLLM-Summary] Summarizing responses from:', providers.join(', '));

    const summaryPrompt = `Summarize and compare these AI responses:\n\n${
      groupMessages.map(m => `${(m.metadata?.provider as string).toUpperCase()}: ${m.content}`).join('\n\n')
    }`;

    // STEP 4: Stream response into summary card (NOT main chat)
    let streamingContent = '';

    try {
      console.log('[MultiLLM-Summary] Sending summary request to Haley...');
      const { cleanup } = await sendMessage(
        summaryPrompt,
        'haley',
        (token: string) => {
          // Token callback - stream into card
          streamingContent += token;
          setSummaryText(streamingContent);
        },
        () => {
          // Completion callback - cache the result
          console.log('[MultiLLM-Summary] ✅ Summary complete, caching result');
          summaryCache.current[cacheKey] = streamingContent;
          setSummaryLoading(false);
          cleanup();
        },
        (error) => {
          // Error callback
          console.error('[MultiLLM-Summary] ❌ Summary error:', error);
          setSummaryText(`Error generating summary: ${error}`);
          setSummaryLoading(false);
        },
        undefined, // files
        user?.uid,
        currentConversationId
      );
    } catch (error) {
      console.error('[MultiLLM-Summary] ❌ Failed to generate summary:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSummaryText(`Failed to generate summary: ${errorMsg}`);
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
        onNewConversation={() => launchModule(null)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        activeModel={activeModel}
        onSelectModel={handleModelSelect}
        userName={user?.displayName || undefined}
        userEmail={user?.email || undefined}
        userPhotoURL={user?.photoURL || undefined}
        onRecoverChat={() => {}}
        onMultiLLMChange={handleMultiLLMChange}
        onSelectModule={launchModule}
        onOpenDashboard={() => setDashboardOpen(true)}
      />

      {/* Dashboard Overlay */}
      <Dashboard
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        onSelectModule={(moduleId) => {
          launchModule(moduleId);
          setDashboardOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          device.type === 'desktop'
            ? (sidebarOpen ? 'ml-80' : 'ml-[60px]')
            : 'ml-0'
        }`}
      >
        {/* ChatHeader - Always visible, shows back button when can go back */}
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
          activeModule={activeModule}
          onBack={goBack}
          onGoHome={goHome}
          canGoBack={canGoBack}
          onOpenDashboard={() => setDashboardOpen(true)}
          processCount={processCount}
        />

        {/* Process Tab Bar - shows running processes */}
        <ProcessTabBar />

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
        ) : activeModule === 'homework_solver' ? (
          <ModuleFeedbackWrapper moduleId="homework_solver" moduleName="Homework Solver">
            <HomeworkSolver onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'code_assist' ? (
          <ModuleFeedbackWrapper moduleId="code_assist" moduleName="Code Assistant">
            <CodeAssistant onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'action_item_extractor' ? (
          <ModuleFeedbackWrapper moduleId="action_item_extractor" moduleName="Action Item Extractor">
            <ActionItemExtractor onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'photo_studio' ? (
          <ModuleFeedbackWrapper moduleId="photo_studio" moduleName="Photo Studio">
            <PhotoStudio onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'crm' ? (
          <ModuleFeedbackWrapper moduleId="crm" moduleName="CRM">
            <CRM onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'atlas' ? (
          <ModuleFeedbackWrapper moduleId="atlas" moduleName="Atlas">
            <Atlas onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'ats_resume_optimizer' ? (
          <ModuleFeedbackWrapper moduleId="ats_resume_optimizer" moduleName="ATS Resume Optimizer">
            <ATSResumeOptimizer onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'receptionist' ? (
          <ModuleFeedbackWrapper moduleId="receptionist" moduleName="Receptionist">
            <Receptionist onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'legal_workflow' ? (
          <ModuleFeedbackWrapper moduleId="legal_workflow" moduleName="Legal Workflow">
            <LegalWorkflow onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'workflow_builder' ? (
          <ModuleFeedbackWrapper moduleId="workflow_builder" moduleName="Workflow Builder">
            <WorkflowBuilder onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'workflow_analytics' ? (
          <ModuleFeedbackWrapper moduleId="workflow_analytics" moduleName="Workflow Analytics">
            <WorkflowAnalytics onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'navigator' ? (
          <ModuleFeedbackWrapper moduleId="navigator" moduleName="Navigator">
            <Navigator onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'feedback_admin' ? (
          <FeedbackAdminDashboard onBack={goBack} />
        ) : activeModule === 'summarizer' ? (
          <ModuleFeedbackWrapper moduleId="summarizer" moduleName="Summarizer">
            <Summarizer onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'translator' ? (
          <ModuleFeedbackWrapper moduleId="translator" moduleName="Translator">
            <Translator onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'voice_cloner' ? (
          <ModuleFeedbackWrapper moduleId="voice_cloner" moduleName="Voice Cloner">
            <VoiceCloner onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'image_enhancer' ? (
          <ModuleFeedbackWrapper moduleId="image_enhancer" moduleName="Image Enhancer">
            <ImageEnhancer onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'image_gen' ? (
          <ModuleFeedbackWrapper moduleId="image_gen" moduleName="Image Generator">
            <ImageGenerator onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'doc_scanner' ? (
          <ModuleFeedbackWrapper moduleId="doc_scanner" moduleName="Doc Scanner">
            <DocScanner onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'plant_diagnostic' ? (
          <ModuleFeedbackWrapper moduleId="plant_diagnostic" moduleName="Plant Diagnostic">
            <PlantDiagnostic onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'writing_assist' ? (
          <ModuleFeedbackWrapper moduleId="writing_assist" moduleName="Writing Assistant">
            <WritingAssistant onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'audio_dubber' ? (
          <ModuleFeedbackWrapper moduleId="audio_dubber" moduleName="Audio Dubber">
            <AudioDubber onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'beauty_retouch' ? (
          <ModuleFeedbackWrapper moduleId="beauty_retouch" moduleName="Beauty & Retouch">
            <BeautyRetouch onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'safety_ingredient_scanner' ? (
          <ModuleFeedbackWrapper moduleId="safety_ingredient_scanner" moduleName="Safety Ingredient Scanner">
            <SafetyIngredientScanner onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'slide_deck_generator' ? (
          <ModuleFeedbackWrapper moduleId="slide_deck_generator" moduleName="Slide Deck Generator">
            <SlideDeckGenerator onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'study_guide' ? (
          <ModuleFeedbackWrapper moduleId="study_guide" moduleName="Study Guide">
            <StudyGuide onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'email_gen' ? (
          <ModuleFeedbackWrapper moduleId="email_gen" moduleName="Email Generator">
            <EmailGenerator onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'story_writer' ? (
          <ModuleFeedbackWrapper moduleId="story_writer" moduleName="Story Writer">
            <StoryWriter onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'grammar_overlay' ? (
          <ModuleFeedbackWrapper moduleId="grammar_overlay" moduleName="Grammar Overlay">
            <GrammarOverlay onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'math_logic_solver' ? (
          <ModuleFeedbackWrapper moduleId="math_logic_solver" moduleName="Math Logic Solver">
            <MathLogicSolver onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'expense_auditor' ? (
          <ModuleFeedbackWrapper moduleId="expense_auditor" moduleName="Expense Auditor">
            <ExpenseAuditor onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'collectible_valuer' ? (
          <ModuleFeedbackWrapper moduleId="collectible_valuer" moduleName="Collectible Valuer">
            <CollectibleValuer onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'contract_auditor' ? (
          <ModuleFeedbackWrapper moduleId="contract_auditor" moduleName="Contract Auditor">
            <ContractAuditor onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'speaking_coach' ? (
          <ModuleFeedbackWrapper moduleId="speaking_coach" moduleName="Speaking Coach">
            <SpeakingCoach onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'viral_trend_tracker' ? (
          <ModuleFeedbackWrapper moduleId="viral_trend_tracker" moduleName="Viral Trend Tracker">
            <ViralTrendTracker onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'no_code_web_scraper' ? (
          <ModuleFeedbackWrapper moduleId="no_code_web_scraper" moduleName="No-Code Web Scraper">
            <NoCodeWebScraper onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'code_smoke_tester' ? (
          <ModuleFeedbackWrapper moduleId="code_smoke_tester" moduleName="Code Smoke Tester">
            <CodeSmokeTester onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'face_swap_motion' ? (
          <ModuleFeedbackWrapper moduleId="face_swap_motion" moduleName="Face Swap & Motion">
            <FaceSwapMotion onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'video_auto_cutter' ? (
          <ModuleFeedbackWrapper moduleId="video_auto_cutter" moduleName="Video Auto-Cutter">
            <VideoAutoCutter onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'music_producer' ? (
          <ModuleFeedbackWrapper moduleId="music_producer" moduleName="Music Producer">
            <MusicProducer onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'visual_storyboarder' ? (
          <ModuleFeedbackWrapper moduleId="visual_storyboarder" moduleName="Visual Storyboarder">
            <VisualStoryboarder onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'cinematic_video_gen' ? (
          <ModuleFeedbackWrapper moduleId="cinematic_video_gen" moduleName="Cinematic Video Gen">
            <CinematicVideoGen onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'identity_architect' ? (
          <ModuleFeedbackWrapper moduleId="identity_architect" moduleName="Identity Architect">
            <IdentityArchitect onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'all_in_one_design' ? (
          <ModuleFeedbackWrapper moduleId="all_in_one_design" moduleName="All-in-One Design">
            <AllInOneDesign onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : activeModule === 'openclaw' ? (
          <ModuleFeedbackWrapper moduleId="openclaw" moduleName="OpenClaw">
            <OpenClaw onBack={goBack} />
          </ModuleFeedbackWrapper>
        ) : null}
      </div>

      {/* Mobile FAB for Dashboard - Mobile only */}
      {!dashboardOpen && activeModule === null && (
        <button
          onClick={() => setDashboardOpen(true)}
          className="block md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          title="Open Dashboard"
          aria-label="Open module dashboard"
        >
          <LayoutGrid size={24} className="text-white" />
        </button>
      )}
    </>
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
