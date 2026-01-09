'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Send,
  MoreVertical,
  Lightbulb,
  Gamepad2,
} from 'lucide-react';
import type { ConversationHistory } from '@/types';
import { HaleyCoreGlyph } from './HaleyCoreGlyph';
import { HaleyIndicator } from './HaleyIndicator';
import { MultiLLMToggle } from './MultiLLMToggle';
import ThemeSelector from './ThemeSelector';
import VibePackSelector from './VibePackSelector';
import IconSoundboard from './icons/IconSoundboard';
import IconBeaker from './icons/IconBeaker';
import TokenBalance from './TokenBalance';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onSignOut: () => void;
  conversations?: ConversationHistory[];
  currentConversationId?: string;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  activeModel?: string | null;
  onSelectModel?: (model: string | null) => void;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string;
  onRecoverChat?: () => void;
  onMigrateChat?: () => void;
  onMultiLLMChange?: (enabled: boolean, selectedModels: string[]) => void;
}

// AI Models
const AI_MODELS = [
  { id: 'gemini', name: 'Gemini', color: 'hue-teal' },
  { id: 'gpt', name: 'GPT', color: 'hue-blue' },
  { id: 'claude', name: 'Claude', color: 'hue-orange' },
  { id: 'llama', name: 'Meta', color: 'hue-pink' },
  { id: 'perplexity', name: 'Perplexity', color: 'hue-purple' },
  { id: 'mistral', name: 'Mistral', color: 'hue-yellow' },
  { id: 'grok', name: 'Grok', color: 'hue-cyan' },
];

// Helper function to format dates
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function Sidebar({
  isOpen,
  onClose,
  onToggle,
  onSignOut,
  conversations = [],
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  activeModel,
  onSelectModel,
  userName,
  userEmail = 'user@example.com',
  userPhotoURL,
  onRecoverChat,
  onMigrateChat,
  onMultiLLMChange,
}: SidebarProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showHaleyMenu, setShowHaleyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Multi-LLM Query state (default OFF, no persistence)
  const [multiLLMEnabled, setMultiLLMEnabled] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Notify parent when Multi-LLM state changes
  useEffect(() => {
    onMultiLLMChange?.(multiLLMEnabled, selectedModels);
  }, [multiLLMEnabled, selectedModels, onMultiLLMChange]);
  
  // Initialize aiModelsCollapsed from localStorage (default to expanded = false for collapsed)
  const [aiModelsCollapsed, setAiModelsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_aiModelsExpanded');
      if (savedState !== null) {
        const isExpanded = JSON.parse(savedState);
        return !isExpanded;
      }
    }
    return false;
  });

  // Initialize projectsCollapsed from localStorage (default to collapsed = true)
  const [projectsCollapsed, setProjectsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_projectsExpanded');
      if (savedState !== null) {
        const isExpanded = JSON.parse(savedState);
        return !isExpanded;
      }
    }
    return true; // Default to collapsed
  });

  // Initialize R&D expanded state from localStorage (default to EXPANDED)
  const [rndExpanded, setRndExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_rndExpanded');
      if (savedState !== null) {
        return JSON.parse(savedState);
      }
    }
    return true; // Default to EXPANDED - R&D is always visible
  });

  // Save aiModelsCollapsed state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_aiModelsExpanded', JSON.stringify(!aiModelsCollapsed));
    }
  }, [aiModelsCollapsed]);

  // Save projectsCollapsed state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_projectsExpanded', JSON.stringify(!projectsCollapsed));
    }
  }, [projectsCollapsed]);

  // Save R&D expanded state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_rndExpanded', JSON.stringify(rndExpanded));
    }
  }, [rndExpanded]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleModelSelect = (modelId: string | null) => {
    if (multiLLMEnabled) {
      // Multi-select mode
      if (modelId === null) {
        // Haley cannot be selected in multi-LLM mode
        return;
      }

      setSelectedModels(prev => {
        if (prev.includes(modelId)) {
          // Deselect if already selected
          return prev.filter(id => id !== modelId);
        } else {
          // Add to selection
          return [...prev, modelId];
        }
      });
    } else {
      // Single-select mode (original behavior)
      if (onSelectModel) {
        onSelectModel(modelId);
      }
      // Auto-apply LLM-native Vibe Pack
      if (modelId && typeof window !== 'undefined') {
        localStorage.setItem('haley_vibePack', modelId);
        window.dispatchEvent(new CustomEvent('vibePackChange', { detail: modelId }));
      }
      setShowHaleyMenu(false);
    }
  };

  // Check if we're in Supreme Court mode
  const isSupremeCourtMode = activeModel === 'supreme-court';

  return (
    <>
      {/* Overlay - Mobile only */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar - Full width on mobile, Mini/Full on desktop */}
      <div
        className={`sidebar-container fixed left-0 top-0 bottom-0 glass-strong border-r border-border z-50 transition-all duration-300 ${
          isOpen 
            ? 'translate-x-0 w-80' 
            : '-translate-x-full w-80 md:translate-x-0 md:w-[60px]'
        }`}
      >
        {/* Mini Sidebar - Desktop only, when collapsed */}
        {!isOpen && (
          <div className="sidebar-mini hidden md:flex flex-col h-full items-center py-3">
            {/* Top: Haley Indicator - Shows comet when collapsed */}
            <HaleyIndicator 
              isExpanded={false}
              onClick={onToggle}
              className="mb-4"
            />

            {/* Primary Action Buttons */}
            <div className="flex-1 flex flex-col items-center gap-2">
              {/* AI Labs */}
              <button
                onClick={() => router.push('/ai-rd/soundboard')}
                className="sidebar-mini-btn w-10 h-10 flex items-center justify-center rounded-lg hover:bg-panel-light transition-colors group relative"
                title="AI Labs"
              >
                <IconBeaker size={22} className="sidebar-mini-icon" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  AI Labs
                </div>
              </button>

              {/* New Chat */}
              <button
                onClick={onNewConversation}
                className="sidebar-mini-btn w-10 h-10 flex items-center justify-center rounded-lg hover:bg-panel-light transition-colors group relative"
                title="New Chat"
              >
                <Plus size={22} className="sidebar-mini-icon" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  New Chat
                </div>
              </button>

              {/* Haley Menu - Using Core Glyph */}
              <button
                onClick={() => setShowHaleyMenu(!showHaleyMenu)}
                className="sidebar-mini-btn w-12 h-12 flex items-center justify-center rounded-lg hover:bg-panel-light transition-colors group relative"
                title="The Seven"
              >
                <HaleyCoreGlyph size={22} className="sidebar-mini-icon" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  The Seven
                </div>
              </button>

              {/* Haley AI Menu popover for mini sidebar */}
              {showHaleyMenu && (
                <div 
                  className="absolute left-full bottom-0 ml-2 min-w-[200px] glass-strong rounded-lg border border-border p-2 space-y-1 shadow-lg z-[60]"
                  style={{
                    background: '#1a1e22',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  <div className="px-3 py-2 text-xs text-secondary font-semibold">
                    AI MODELS
                  </div>
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        activeModel === model.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-panel-light'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${model.color}`} />
                      <span className="text-sm">{model.name}</span>
                      {activeModel === model.id && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
                      )}
                    </button>
                  ))}
                  
                  {isSupremeCourtMode && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="px-3 py-2 flex items-center gap-2 bg-primary/10 rounded-lg">
                        <Users size={14} className="text-primary" />
                        <span className="text-xs text-primary font-semibold">FULL SUPREME COURT</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom: User Profile - Collapsed */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="sidebar-mini-btn w-12 h-12 flex items-center justify-center rounded-lg hover:bg-panel-light transition-colors group relative mb-3"
                title={userName || userEmail}
              >
                {userPhotoURL ? (
                  <img 
                    src={userPhotoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User size={22} className="sidebar-mini-icon" />
                )}
              </button>

              {/* User Menu Dropdown - Collapsed View */}
              {showUserMenu && (
                <div className="absolute bottom-full left-full ml-2 mb-2 w-48 glass-strong rounded-lg border border-border shadow-xl z-[60]">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                    >
                      <Settings size={18} />
                      <span className="text-sm">Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        onSignOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Full Sidebar - When expanded */}
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Header with Close Button */}
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <HaleyCoreGlyph size={24} className="text-primary" />
                <span className="text-lg font-bold text-gradient">Haley OS</span>
              </div>
              {/* Desktop: Haley Indicator shows down arrow when expanded */}
              <HaleyIndicator 
                isExpanded={true}
                onClick={onToggle}
                className="sidebar-back-button md:block hidden"
              />
              {/* Mobile: X button */}
              <button
                onClick={onClose}
                className="sidebar-back-button p-2 rounded-lg hover:bg-panel-light transition-colors md:hidden"
                title="Close Sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* R&D - Research & Development Section - TOP PRIORITY */}
            <div className="relative group p-3">
              <button
                onClick={() => setRndExpanded(!rndExpanded)}
                className="sidebar-menu-header w-full relative overflow-hidden rounded-lg transition-all duration-180 ease-out"
                style={{
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  paddingLeft: '14px',
                  paddingRight: '14px',
                }}
              >
                {/* Hover glow effect */}
                <div 
                  className="sidebar-hover-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-180"
                  style={{
                    background: 'rgba(80, 160, 255, 0.08)',
                    boxShadow: '0 0 8px rgba(80, 160, 255, 0.25)',
                  }}
                />
                
                {/* Active state indicator - left accent bar */}
                {rndExpanded && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{ background: 'rgba(80, 160, 255, 0.8)' }}
                  />
                )}
                
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <IconBeaker 
                    size={20} 
                    strokeWidth={1.5}
                    className="flex-shrink-0 transition-transform group-hover:scale-105"
                  />
                  <div className="flex-1 text-left">
                    <div 
                      className="font-semibold tracking-tight"
                      style={{ 
                        fontSize: '1.3em',
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      AI Labs
                    </div>
                    {/* Permanent subtitle */}
                    <div 
                      className="text-xs uppercase tracking-wider opacity-70 transition-opacity duration-180"
                      style={{ 
                        fontVariant: 'small-caps',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Lab / Sandbox
                    </div>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`transition-colors duration-200 ${
                      rndExpanded ? 'text-primary' : 'text-gray-400'
                    }`}
                  />
                </div>
              </button>

              {/* R&D Content - Expanded by default */}
              {rndExpanded && (
                <div className="mt-3 space-y-1">
                  {/* R&D Soundboard submenu item */}
                  <button
                    onClick={() => router.push('/ai-rd/soundboard')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-panel-light transition-colors text-sm"
                  >
                    <IconSoundboard className="flex-shrink-0" />
                    <span>R&D Soundboard</span>
                  </button>
                  {/* Idea Harvester submenu item */}
                  <button
                    onClick={() => router.push('/ai-labs/ideaharvester')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-panel-light transition-colors text-sm"
                  >
                    <Lightbulb size={18} className="flex-shrink-0" />
                    <span>Idea Harvester</span>
                  </button>
                  {/* Roblox Expert submenu item */}
                  <button
                    onClick={() => router.push('/ai-labs/robloxexpert')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-panel-light transition-colors text-sm"
                  >
                    <Gamepad2 size={18} className="flex-shrink-0" />
                    <span>Roblox Expert</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                {/* New Chat button */}
                <button
                  onClick={onNewConversation}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-sm"
                >
                  <Plus size={18} />
                  <span>New chat</span>
                </button>

                {/* Recover button */}
                <button
                  onClick={onRecoverChat}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-sm"
                >
                  <RotateCcw size={16} />
                  <span>Recover</span>
                </button>
              </div>
            </div>

            {/* AI Model Selector - Using Core Glyph */}
            <div className="p-3 border-t border-b border-border">
              <button
                onClick={() => setAiModelsCollapsed(!aiModelsCollapsed)}
                className={`sidebar-menu-header w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  !aiModelsCollapsed ? 'sidebar-menu-header-active' : 'hover:bg-panel-light'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">AI Models</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    !aiModelsCollapsed ? 'text-primary' : 'text-gray-400'
                  }`}
                />
              </button>

              {!aiModelsCollapsed && (
                <div className="mt-2 space-y-1 max-h-[50vh] overflow-y-auto">
                  {/* Multi-LLM Toggle - Always visible */}
                  <div className="px-3 py-2 mb-2 border-b border-border">
                    <MultiLLMToggle
                      enabled={multiLLMEnabled}
                      onChange={(enabled) => {
                        setMultiLLMEnabled(enabled);
                        if (!enabled) {
                          // Reset to single-select mode
                          setSelectedModels([]);
                          // Restore active model if there was one before multi-mode
                          if (activeModel) {
                            onSelectModel?.(activeModel);
                          }
                        } else {
                          // When enabling multi-LLM, clear single selection
                          onSelectModel?.(null);
                        }
                      }}
                    />
                    {multiLLMEnabled && (
                      <div className="text-xs text-secondary mt-2">
                        Select 2+ models to query in parallel
                      </div>
                    )}
                  </div>
                  
                  {/* Haley option - default mode (disabled in multi-LLM) */}
                  <button
                    onClick={() => handleModelSelect(null as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      multiLLMEnabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : activeModel === null
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-panel-light'
                    }`}
                    disabled={multiLLMEnabled}
                    title={multiLLMEnabled ? 'Haley unavailable in Multi-LLM mode' : 'Select Haley (routing layer)'}
                  >
                    <HaleyCoreGlyph size={16} className={activeModel === null && !multiLLMEnabled ? 'text-primary' : ''} />
                    <span className="text-sm font-semibold">Haley</span>
                    {activeModel === null && !multiLLMEnabled && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
                    )}
                  </button>
                  
                  {/* Select All Toggle - only visible in Multi-LLM mode */}
                  {multiLLMEnabled && (
                    <div className="py-2 border-t border-b border-border my-2">
                      <button
                        onClick={() => {
                          const allModelIds = AI_MODELS.map(m => m.id);
                          if (selectedModels.length === AI_MODELS.length) {
                            // Deselect all
                            setSelectedModels([]);
                          } else {
                            // Select all
                            setSelectedModels(allModelIds);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                      >
                        <div className="w-4 h-4 rounded border-2 border-current flex items-center justify-center">
                          {selectedModels.length === AI_MODELS.length && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          {selectedModels.length === AI_MODELS.length ? 'Deselect All' : 'Select All'}
                        </span>
                        <span className="text-xs text-secondary ml-auto">
                          {selectedModels.length}/{AI_MODELS.length}
                        </span>
                      </button>
                    </div>
                  )}
                  
                  {/* Other AI Models */}
                  {AI_MODELS.map((model) => {
                    const isSelected = multiLLMEnabled 
                      ? selectedModels.includes(model.id)
                      : activeModel === model.id;
                    
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-panel-light'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${model.color}`} />
                        <span className="text-sm">{model.name}</span>
                        {isSelected && (
                          <div className="ml-auto flex items-center gap-2">
                            {multiLLMEnabled ? (
                              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  
                  {isSupremeCourtMode && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="px-3 py-2 flex items-center gap-2 bg-primary/10 rounded-lg">
                        <Users size={14} className="text-primary" />
                        <span className="text-xs text-primary font-semibold">FULL SUPREME COURT</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Conversation History */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <div className="text-xs text-secondary font-semibold mb-2 px-2">
                RECENT CHATS
              </div>
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-sm text-secondary text-center py-8">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conv.id
                          ? 'bg-primary/20'
                          : 'hover:bg-panel-light'
                      }`}
                      onClick={() => onSelectConversation?.(conv.id)}
                    >
                      <MessageSquare size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{conv.title}</div>
                        <div className="text-xs text-secondary">
                          {formatDate(new Date(conv.lastActive))}
                        </div>
                      </div>
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/20 transition-all"
                          title="Delete conversation"
                        >
                          <Trash2 size={14} className="text-error" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Token Balance */}
            <div className="px-3 pb-2">
              <TokenBalance 
                userId={userEmail || 'default_user'} 
                userEmail={userEmail}
                compact={true}
              />
            </div>

            {/* Footer - User Profile */}
            <div className="p-3 border-t border-border">
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
                >
                  {userPhotoURL ? (
                    <img 
                      src={userPhotoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                      {userName || 'User'}
                    </div>
                  </div>
                  <MoreVertical size={18} className="text-gray-400 flex-shrink-0" />
                </button>

                {/* User Menu Dropdown - Expanded View */}
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-lg border border-border shadow-xl z-[60]">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowSettings(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                      >
                        <Settings size={18} />
                        <span className="text-sm">Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                      >
                        <LogOut size={18} />
                        <span className="text-sm">Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="glass-strong rounded-xl border border-border max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-panel-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <ThemeSelector />

              <div className="pt-4 border-t border-border">
                <VibePackSelector />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
