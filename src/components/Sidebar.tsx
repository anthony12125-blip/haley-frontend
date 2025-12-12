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
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Sparkles,
  HelpCircle,
  Mail,
  RotateCcw,
  Send,
} from 'lucide-react';
import type { ConversationHistory } from '@/types';

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

// Updated AI list with only display names
const THE_SEVEN = [
  { id: 'claude', name: 'Claude', color: 'hue-orange' },
  { id: 'gpt', name: 'GPT', color: 'hue-blue' },
  { id: 'gemini', name: 'Gemini', color: 'hue-teal' },
  { id: 'perplexity', name: 'Perplexity', color: 'hue-purple' },
];

// Custom Haley icon component
function HaleyIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="currentColor" 
          opacity="0.2"
        />
        <path 
          d="M12 7V12L15 15" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        <circle 
          cx="12" 
          cy="12" 
          r="2" 
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

// Custom Migrate icon component (envelope with wings)
function MigrateIcon({ size = 24, showAI = true }: { size?: number; showAI?: boolean }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Mail size={size * 0.7} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      {showAI && (
        <span 
          className="absolute bottom-0 right-0 text-[8px] font-bold bg-primary rounded px-1"
          style={{ fontSize: size * 0.3 }}
        >
          AI
        </span>
      )}
    </div>
  );
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
            {/* Top: Expand Arrow - Static visible background */}
            <button
              onClick={onToggle}
              className="w-12 h-12 flex items-center justify-center rounded-lg bg-panel-medium hover:bg-gray-800/70 transition-colors group relative mb-4"
              title="Open Sidebar"
            >
              <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-200" />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Open Sidebar
              </div>
            </button>

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

              {/* Haley Menu */}
              <button
                onClick={() => setShowHaleyMenu(!showHaleyMenu)}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="AI Models"
              >
                <HaleyIcon size={22} className="text-gray-400 group-hover:text-gray-200" />
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  AI Models
                </div>
              </button>
            </div>

            {/* Bottom: Profile */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-colors group relative"
                title="Account"
              >
                {userPhotoURL ? (
                  <img 
                    src={userPhotoURL} 
                    alt="User" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User size={24} className="text-gray-400 group-hover:text-gray-200" />
                )}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Account
                </div>
              </button>
              
              {/* Popover menu for mini sidebar - appears to the right */}
              {showAccountMenu && (
                <div 
                  className="absolute left-full bottom-0 ml-2 min-w-[180px] glass-strong rounded-lg border border-border p-2 space-y-1 shadow-lg z-[60]"
                  style={{
                    background: '#1a1e22',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  <button
                    onClick={() => {
                      console.log('Account clicked');
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                  >
                    <User size={18} />
                    <span className="text-sm">Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                  >
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Help clicked');
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                  >
                    <HelpCircle size={18} />
                    <span className="text-sm">Help</span>
                  </button>
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              )}

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
                    SELECT AI MODEL
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
                    <>
                      <div className="h-px bg-border my-1" />
                      <div className="px-3 py-2 flex items-center gap-2">
                        <Users size={14} className="text-primary" />
                        <span className="text-xs text-primary font-semibold">FULL COURT</span>
                      </div>
                    </>
                  )}
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
                <HaleyIcon size={24} className="text-primary" />
                <span className="text-lg font-bold text-gradient">Haley</span>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-panel-light transition-colors md:block"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
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

            {/* AI Model Selector */}
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setTheSevenCollapsed(!theSevenCollapsed)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HaleyIcon size={20} className="text-primary" />
                  <span className="font-semibold text-sm">AI Models</span>
                </div>
                {theSevenCollapsed ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronUp size={18} className="text-gray-400" />
                )}
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
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/20 rounded transition-opacity"
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
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
                >
                  {userPhotoURL ? (
                    <img 
                      src={userPhotoURL} 
                      alt="User" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={18} />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {userName || 'User'}
                    </div>
                    <div className="text-xs text-secondary truncate">
                      {userEmail}
                    </div>
                  </div>
                </button>

                {showAccountMenu && (
                  <div 
                    className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-lg border border-border p-2 space-y-1 shadow-lg z-[60]"
                    style={{
                      background: '#1a1e22',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    <button
                      onClick={() => {
                        console.log('Account clicked');
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                    >
                      <User size={18} />
                      <span className="text-sm">Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                    >
                      <Settings size={18} />
                      <span className="text-sm">Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        console.log('Help clicked');
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors text-left"
                    >
                      <HelpCircle size={18} />
                      <span className="text-sm">Help</span>
                    </button>
                    <button
                      onClick={() => {
                        onSignOut();
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      
      {/* Overlay for Menus - click outside to close */}
      {(showAccountMenu || showHaleyMenu) && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => {
            setShowAccountMenu(false);
            setShowHaleyMenu(false);
          }}
        />
      )}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gradient">Settings</h2>
            <button onClick={onClose} className="icon-btn">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* General */}
            <section>
              <h3 className="text-lg font-semibold mb-3">General</h3>
              <div className="space-y-3">
                <SettingRow label="Auto-scroll" type="toggle" />
                <SettingRow label="Sound effects" type="toggle" />
                <SettingRow label="Haptic feedback" type="toggle" />
              </div>
            </section>

            {/* Theme */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Theme</h3>
              <div className="space-y-3">
                <SettingRow
                  label="Wallpaper"
                  type="select"
                  options={['Space Default', 'Dark Nebula', 'Blue Horizon']}
                />
                <SettingRow
                  label="Display mode"
                  type="select"
                  options={['Off', 'On', 'System']}
                />
              </div>
            </section>

            {/* Voice */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Voice</h3>
              <div className="space-y-3">
                <SettingRow label="Voice input" type="toggle" />
                <SettingRow label="Text-to-speech" type="toggle" />
                <SettingRow label="Voice speed" type="slider" />
              </div>
            </section>

            {/* Data Control */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Data Control</h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  Export conversations
                </button>
                <button className="w-full btn-secondary text-left text-error">
                  Clear all data
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  type,
  options,
}: {
  label: string;
  type: 'toggle' | 'select' | 'slider';
  options?: string[];
}) {
  const [value, setValue] = useState(type === 'toggle' ? false : options?.[0] || '');

  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between p-3 bg-panel-dark rounded-lg">
        <span className="text-sm">{label}</span>
        <div
          className={`toggle-switch ${value ? 'active' : ''}`}
          onClick={() => setValue(!value)}
        >
          <div className="toggle-knob" />
        </div>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="flex items-center justify-between p-3 bg-panel-dark rounded-lg">
        <span className="text-sm">{label}</span>
        <select
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          className="bg-panel-medium border border-border rounded px-3 py-1 text-sm"
        >
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="p-3 bg-panel-dark rounded-lg">
      <span className="text-sm block mb-2">{label}</span>
      <input type="range" className="w-full" min="0" max="100" />
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}
