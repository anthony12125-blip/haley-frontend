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
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'New conversation',
      lastMessage: 'Hello Haley',
      timestamp: new Date(),
    },
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
      </div>

      <div className="px-3 py-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className="w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
          >
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{conv.title}</p>
              <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
