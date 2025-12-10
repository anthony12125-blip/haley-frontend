'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  User,
  History,
  Trash2,
  ChevronRight,
  Menu,
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
}

export default function Sidebar({
  isOpen,
  onClose,
  onSignOut,
  conversations = [],
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Overlay - Mobile only */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden ${
          isOpen ? 'block' : 'hidden'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 glass-strong border-r border-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Hamburger (desktop) and Close (mobile) */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="icon-btn hidden md:flex" title="Toggle sidebar">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold text-gradient">Conversations</h2>
            </div>
            <button onClick={onClose} className="icon-btn md:hidden">
              <X size={20} />
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

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
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

          {/* Footer */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel-light transition-colors"
            >
              <Settings size={20} />
              <span className="text-sm">Settings</span>
              <ChevronRight size={16} className="ml-auto" />
            </button>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/20 text-error transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm">Sign Out</span>
            </button>
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
