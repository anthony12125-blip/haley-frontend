'use client';

import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface SidebarHistoryProps {
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export default function SidebarHistory({ onSelectConversation, onNewChat }: SidebarHistoryProps) {
  // TODO: Load from localStorage or API
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'New conversation',
      lastMessage: 'Hello Haley',
      timestamp: new Date(),
    },
  ]);

  return (
    <div className="w-64 h-full glass border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-haley-primary hover:bg-haley-secondary rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-left mb-1"
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-haley-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
