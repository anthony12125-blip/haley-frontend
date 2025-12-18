'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import type { SystemStatus, AIMode } from '@/types';

interface ChatHeaderProps {
  aiMode: AIMode;
  activeModels: string[];
  activeModel: string | null;
  onToggleResearch: () => void;
  onToggleSidebar: () => void;
  onOpenMagicWindow: () => void;
  systemStatus: SystemStatus | null;
  researchEnabled: boolean;
  logicEngineEnabled: boolean;
  onToggleLogicEngine: () => void;
  onMigrateChat?: () => void;
}

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

export default function ChatHeader({
  aiMode,
  activeModels,
  activeModel,
  onToggleResearch,
  onToggleSidebar,
  onOpenMagicWindow,
  systemStatus,
  researchEnabled,
  logicEngineEnabled,
  onToggleLogicEngine,
  onMigrateChat,
}: ChatHeaderProps) {
  // Get AI mode color hue
  const getAIHue = () => {
    if (activeModel === 'gemini') return 'hue-teal';
    if (activeModel === 'claude') return 'hue-orange';
    if (activeModel === 'gpt') return 'hue-blue';
    if (activeModel === 'perplexity') return 'hue-purple';
    if (activeModel === 'llama') return 'hue-gold';
    if (activeModel === 'grok') return 'hue-red';
    if (aiMode === 'supreme-court') return 'hue-purple';
    return '';
  };

  // Get display name for top bar
  const getDisplayName = () => {
    if (activeModel) {
      const modelName = {
        'gemini': 'Gemini',
        'gpt': 'GPT',
        'claude': 'Claude',
        'llama': 'Meta',
        'perplexity': 'Perplexity',
        'mistral': 'Mistral',
        'grok': 'Grok',
      }[activeModel];
      return modelName || 'Haley';
    }
    return 'Haley';
  };

  return (
    <header className={`glass-strong border-b border-border safe-top ${getAIHue()}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu - Hidden on desktop */}
        <button
          onClick={onToggleSidebar}
          className="icon-btn md:hidden"
          title="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Desktop: Empty space for alignment */}
        <div className="hidden md:block w-10" />

        {/* Center: Dynamic Title */}
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-gradient">{getDisplayName()}</h1>
        </div>

        {/* Right: Migrate Button */}
        <div className="flex items-center gap-2">
          {onMigrateChat && (
            <button
              onClick={onMigrateChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-panel-light transition-colors text-sm group"
              title="Migrate Chat"
            >
              <MigrateIcon size={18} showAI={true} />
              <span className="hidden sm:inline">Migrate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
