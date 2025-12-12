'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { ConversationHistory } from '@/types';
import { HaleyCoreGlyph } from './HaleyCoreGlyph';
import { HaleyIndicator } from './HaleyIndicator';

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
  activeJustice?: string | null;
  onSelectJustice?: (justice: string | null) => void;
  userName?: string;
  userEmail?: string;
  userPhotoURL?: string;
  onRecoverChat?: () => void;
  onMigrateChat?: () => void;
}

// THE SEVEN JUSTICES - Order is locked and must not be changed
const THE_SEVEN = [
  { id: 'gemini', name: 'Gemini', color: 'hue-teal' },
  { id: 'gpt', name: 'GPT', color: 'hue-blue' },
  { id: 'claude', name: 'Claude', color: 'hue-orange' },
  { id: 'llama', name: 'Meta', color: 'hue-pink' },
  { id: 'perplexity', name: 'Perplexity', color: 'hue-purple' },
  { id: 'mistral', name: 'Mistral', color: 'hue-yellow' },
  { id: 'grok', name: 'Grok', color: 'hue-cyan' },
];

// Custom Migrate icon component (envelope with wings)
function MigrateIcon({ size = 24, showAI = true }: { size?: number; showAI?: boolean }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {/* Left wing */}
        <path d="M2 10 C2 8, 3 7, 4 8 C5 9, 6 10, 6 11 L6 13 C6 14, 5 15, 4 14 C3 13, 2 12, 2 10 Z" />
        
        {/* Right wing */}
        <path d="M22 10 C22 8, 21 7, 20 8 C19 9, 18 10, 18 11 L18 13 C18 14, 19 15, 20 14 C21 13, 22 12, 22 10 Z" />
        
        {/* Envelope body - rectangle */}
        <rect x="7" y="8" width="10" height="8" rx="0.5" />
        
        {/* Envelope flap - triangle on top */}
        <path d="M7 8 L12 12 L17 8" />
      </svg>
      {showAI && (
        <span 
          className="absolute -top-1 -right-1 text-[8px] font-bold text-primary"
          style={{ fontSize: size * 0.3 }}
        >
          AI
        </span>
      )}
    </div>
  );
}

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
  activeJustice,
  onSelectJustice,
  userName,
  userEmail = 'user@example.com',
  userPhotoURL,
  onRecoverChat,
  onMigrateChat,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showHaleyMenu, setShowHaleyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Initialize theSevenCollapsed from localStorage (default to expanded = false for collapsed)
  const [theSevenCollapsed, setTheSevenCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_justicesExpanded');
      if (savedState !== null) {
        const isExpanded = JSON.parse(savedState);
        return !isExpanded;
      }
    }
    return false;
  });

  // Save theSevenCollapsed state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_justicesExpanded', JSON.stringify(!theSevenCollapsed));
    }
  }, [theSevenCollapsed]);

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

  const handleJusticeSelect = (justiceId: string) => {
    if (onSelectJustice) {
      onSelectJustice(justiceId);
    }
    setShowHaleyMenu(false);
  };

  // Check if we're in Supreme Court mode
  const isSupremeCourtMode = activeJustice === 'supreme-court';

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
        className={`fixed left-0 top-0 bottom-0 glass-strong border-r border-border z-50 transition-all duration-300 ${
          isOpen 
            ? 'translate-x-0 w-80' 
            : '-translate-x-full w-80 md:translate-x-0 md:w-[60px]'
        }`}
        style={{
          background: isOpen ? undefined : '#111418'
        }}
      >
        {/* Mini Sidebar - Desktop only, when collapsed */}
        {!isOpen && (
          <div className="hidden md:flex flex-col h-full items-center py-3">
            {/* Top: Haley Indicator - Shows comet when collapsed */}
            <HaleyIndicator 
              isExpanded={false}
              onClick={onToggle}
              className="mb-4"
            />

            {/* Primary Action Buttons */}
            <div className="flex-1 flex flex-col items-center gap-2">
              {/* New Chat */}
              <button
                onClick={onNewConversation}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="New Chat"
              >
                <Plus size={22} className="text-gray-400 group-hover:text-gray-200" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  New Chat
                </div>
              </button>

              {/* Recover Chat */}
              <button
                onClick={onRecoverChat}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="Recover Chat"
              >
                <RotateCcw size={22} className="text-gray-400 group-hover:text-gray-200" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Recover Chat
                </div>
              </button>

              {/* Migrate Chat */}
              <button
                onClick={onMigrateChat}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="Migrate Chat"
              >
                <MigrateIcon size={22} showAI={false} />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Migrate Chat
                </div>
              </button>

              {/* Haley Menu - Using Core Glyph */}
              <button
                onClick={() => setShowHaleyMenu(!showHaleyMenu)}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="The Seven"
              >
                <HaleyCoreGlyph size={22} className="text-gray-400 group-hover:text-gray-200" />
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
                    THE SEVEN
                  </div>
                  {THE_SEVEN.map((justice) => (
                    <button
                      key={justice.id}
                      onClick={() => handleJusticeSelect(justice.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        activeJustice === justice.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-panel-light'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${justice.color}`} />
                      <span className="text-sm">{justice.name}</span>
                      {activeJustice === justice.id && (
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
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative mb-3"
                title={userName || userEmail}
              >
                {userPhotoURL ? (
                  <img 
                    src={userPhotoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User size={22} className="text-gray-400 group-hover:text-gray-200" />
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
                <span className="text-lg font-bold text-gradient">Haley</span>
              </div>
              {/* Desktop: Haley Indicator shows down arrow when expanded */}
              <HaleyIndicator 
                isExpanded={true}
                onClick={onToggle}
                className="md:block hidden"
              />
              {/* Mobile: X button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-panel-light transition-colors md:hidden"
                title="Close Sidebar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="p-3 space-y-2 border-b border-border">
              <button
                onClick={onNewConversation}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
              >
                <Plus size={20} />
                <span>New Chat</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onRecoverChat}
                  className="btn-secondary flex items-center justify-center gap-2 py-2"
                >
                  <RotateCcw size={18} />
                  <span className="text-sm">Recover</span>
                </button>

                <button
                  onClick={onMigrateChat}
                  className="btn-secondary flex items-center justify-center gap-2 py-2"
                >
                  <MigrateIcon size={18} showAI={true} />
                  <span className="text-sm">Migrate</span>
                </button>
              </div>
            </div>

            {/* AI Model Selector - Using Core Glyph */}
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setTheSevenCollapsed(!theSevenCollapsed)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  !theSevenCollapsed ? 'bg-panel-medium' : 'hover:bg-panel-light'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HaleyCoreGlyph size={20} className="text-primary" />
                  <span className="font-semibold text-sm">The Seven</span>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>

              {!theSevenCollapsed && (
                <div className="mt-2 space-y-1">
                  {THE_SEVEN.map((justice) => (
                    <button
                      key={justice.id}
                      onClick={() => handleJusticeSelect(justice.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                        activeJustice === justice.id
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-panel-light'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${justice.color}`} />
                      <span className="text-sm">{justice.name}</span>
                      {activeJustice === justice.id && (
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

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto p-3">
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
              <div className="text-sm text-secondary">
                Settings coming soon...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
