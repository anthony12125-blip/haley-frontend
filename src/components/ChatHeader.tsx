'use client';

import { Microscope, Puzzle, Menu } from 'lucide-react';
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

        {/* Right: Microscope and Puzzle Piece */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleResearch}
            className={`icon-btn ${researchEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Research Mode"
          >
            <Microscope size={24} />
          </button>
          <button
            onClick={onToggleLogicEngine}
            className={`icon-btn ${logicEngineEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Logic Engine"
          >
            <Puzzle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
