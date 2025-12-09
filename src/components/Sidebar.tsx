'use client';

import { X, LogOut, Settings, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
}

export default function Sidebar({ isOpen, onClose, onSignOut }: SidebarProps) {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'System initialization', timestamp: '2 hours ago' },
    { id: 2, title: 'Calculator module test', timestamp: 'Yesterday' },
    { id: 3, title: 'Deep reasoning example', timestamp: '2 days ago' },
  ]);

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 glass border-r border-white/10 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col safe-area-top safe-area-bottom`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-haley-text-title text-lg font-semibold">HaleyOS</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-haley-text-body" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button className="w-full haley-button flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="mb-2 flex items-center gap-2 text-haley-text-subtext text-sm">
            <Clock className="w-4 h-4" />
            <span>Recent Conversations</span>
          </div>
          
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="group flex items-center justify-between p-3 hover:bg-white/10 rounded-haley cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-haley-text-body text-sm truncate">
                    {conv.title}
                  </div>
                  <div className="text-haley-text-subtext text-xs mt-0.5">
                    {conv.timestamp}
                  </div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-haley transition-colors text-haley-text-body">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 rounded-haley transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
