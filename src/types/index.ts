// src/types/index.ts
// Centralized type definitions for Haley OS

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  operation?: string;
  state_changed?: boolean;
  mama_invoked?: boolean;
  baby_invoked?: boolean;
  syscalls?: number;
  model_used?: string;
  task?: string;
  llm_sources?: string[];
  confidence?: number;
  supreme_court?: boolean;
  selectedModel?: string | null; // Track which model was selected when message was created
  streaming?: boolean; // Track if message is currently streaming
  error?: boolean; // Track if message encountered an error
}

export interface SystemStatus {
  os: string;
  kernel_status: {
    kernel: string;
    syscalls: number;
    processes: number;
    modules: number;
    memory_keys: number;
  };
  baby_pid: number;
  note: string;
  active_llms?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon?: string;
  enabled: boolean;
}

export type AIMode = 'single' | 'multi' | 'supreme-court';

export interface ChatSettings {
  selectedModels: string[];
  mode: AIMode;
  researchEnabled: boolean;
  logicEngineEnabled: boolean;
  voiceEnabled: boolean;
  autoScroll: boolean;
}

export interface DeviceProfile {
  type: 'phone' | 'tablet' | 'desktop';
  width: number;
  height: number;
  touchEnabled: boolean;
}

export interface ThemeConfig {
  background: string;
  colors: {
    primary: string;
    accent: string;
    panelDark: string;
    panelMedium: string;
    panelLight: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
  };
}

export interface MagicWindowContent {
  type: 'visualization' | 'code' | 'image' | 'data';
  content: any;
  title?: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  lastActive: Date;
  messageCount: number;
  modelMode?: string | null;  // Active AI model for this conversation
  provider?: string;  // Provider for this conversation (haley, gemini, gpt, etc.)
}
