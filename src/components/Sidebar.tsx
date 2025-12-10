'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import type { ConversationHistory } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  conversations?: ConversationHistory[];
  currentConversationId?: string;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  activeJustice?: string | null;
  onSelectJustice?: (justice: string | null) => void;
  userEmail?: string;
  userPhotoURL?: string;
}

const THE_SEVEN = [
  { id: 'gemini', name: 'Gemini', color: 'hue-teal' },
  { id: 'gpt', name: 'GPT', color: 'hue-blue' },
  { id: 'claude', name: 'Claude', color: 'hue-orange' },
  { id: 'llama', name: 'Meta', color: 'hue-gold' },
  { id: 'perplexity', name: 'Perplexity', color: 'hue-purple' },
  { id: 'mistral', name: 'Mistral', color: 'hue-blue' },
  { id: 'grok', name: 'Grok', color: 'hue-red' },
];

export default function Sidebar({
  isOpen,
  onClose,
  onSignOut,
  conversations = [],
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  activeJustice,
  onSelectJustice,
  userEmail = 'user@example.com',
  userPhotoURL,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [theSevenCollapsed, setTheSevenCollapsed] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleJusticeSelect = (justiceId: string) => {
    if (onSelectJustice) {
      onSelectJustice(justiceId);
    }
  };

  return (
    <>
      {/* Overlay - Mobile only */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 glass-strong border-r border-border z-50 transition-all duration-300 ${
          isOpen 
            ? 'translate-x-0 w-80' 
            : '-translate-x-full w-80 md:translate-x-0 md:w-0 md:min-w-0 md:overflow-hidden md:border-r-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Collapse Button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-gradient">HaleyOS</h2>
            <button 
              onClick={onClose} 
              className="icon-btn"
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <button
              onClick={onNewConversation}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Haley Quick Launch Button */}
          <div className="px-4 pb-4">
            <button
              onClick={() => onSelectJustice?.(null)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                !activeJustice
                  ? 'bg-gray-700/40 border-gray-600 text-gray-100'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              <Sparkles size={18} />
              <span className="font-medium">Haley</span>
            </button>
          </div>

          {/* The Seven Section - Collapsible */}
          <div className="px-4 mb-4">
            <button
              onClick={() => setTheSevenCollapsed(!theSevenCollapsed)}
              className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-secondary hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>The Seven</span>
              </div>
              {theSevenCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {!theSevenCollapsed && (
              <div className="space-y-2">
                {THE_SEVEN.map((justice) => (
                  <button
                    key={justice.id}
                    onClick={() => handleJusticeSelect(justice.id)}
                    className={`w-full p-2 rounded-lg border transition-all text-left text-sm ${
                      activeJustice === justice.id
                        ? `${justice.color} bg-primary/20 border-primary text-primary`
                        : 'bg-panel-dark border-border text-secondary hover:border-accent hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{justice.name}</span>
                      {activeJustice === justice.id && (
                        <div className={`w-2 h-2 rounded-full ${justice.color} shadow-lg animate-pulse`} 
                             style={{ 
                               boxShadow: `0 0 8px currentColor, 0 0 12px currentColor` 
                             }} 
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
            <h3 className="text-sm font-semibold text-secondary mb-2 sticky top-0 bg-panel-dark py-2">
              Recent Chats
            </h3>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <History size={48} className="mx-auto text-secondary opacity-50 mb-3" />
                <p className="text-secondary text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative rounded-lg border transition-all cursor-pointer ${
                    conv.id === currentConversationId
                      ? 'bg-primary/20 border-primary'
                      : 'bg-panel-medium border-border hover:border-accent'
                  }`}
                  onClick={() => onSelectConversation?.(conv.id)}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1">
                          {conv.title}
                        </h3>
                        <p className="text-xs text-secondary truncate">
                          {conv.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-secondary">
                          <span>{conv.messageCount} messages</span>
                          <span>•</span>
                          <span>{formatDate(conv.timestamp)}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation?.(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity icon-btn !w-6 !h-6"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Google Account Chip */}
          <div className="border-t border-border p-4 space-y-2">
            {/* Google Account Chip */}
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
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User size={18} />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-primary truncate">{userEmail}</div>
                </div>
                <ChevronRight size={16} className={`transition-transform ${showAccountMenu ? 'rotate-90' : ''}`} />
              </button>

              {/* Account Dropdown Menu */}
              {showAccountMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-xl border border-border p-2 space-y-1">
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
                      onSignOut();
                      setShowAccountMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors text-left"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
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
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
