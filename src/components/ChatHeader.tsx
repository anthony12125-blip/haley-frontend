'use client';

import { Microscope, Ruler, Menu } from 'lucide-react';
import { useState } from 'react';
import type { SystemStatus, AIMode } from '@/types';

interface ChatHeaderProps {
  aiMode: AIMode;
  activeModels: string[];
  activeJustice: string | null;
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
  activeJustice,
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
    if (activeJustice === 'gemini') return 'hue-teal';
    if (activeJustice === 'claude') return 'hue-orange';
    if (activeJustice === 'gpt') return 'hue-blue';
    if (activeJustice === 'perplexity') return 'hue-purple';
    if (activeJustice === 'llama') return 'hue-gold';
    if (activeJustice === 'grok') return 'hue-red';
    if (aiMode === 'supreme-court') return 'hue-purple';
    return '';
  };

  // Get display name for top bar
  const getDisplayName = () => {
    if (activeJustice) {
      const justice = {
        'gemini': 'Gemini',
        'gpt': 'GPT',
        'claude': 'Claude',
        'llama': 'Meta',
        'perplexity': 'Perplexity',
        'mistral': 'Mistral',
        'grok': 'Grok',
      }[activeJustice];
      return justice || 'Haley';
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

        {/* Right: Microscope and Protractor */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleResearch}
            className={`icon-btn flex items-center ${researchEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Research Mode"
          >
            <Microscope size={24} />
            <span className="hidden md:inline ml-2 text-sm font-medium whitespace-nowrap">Research Mode</span>
          </button>
          <button
            onClick={onToggleLogicEngine}
            className={`icon-btn flex items-center ${logicEngineEnabled ? 'bg-primary/20 text-primary' : ''}`}
            title="Toggle Project Mode"
          >
            <Ruler size={24} />
            <span className="hidden md:inline ml-2 text-sm font-medium whitespace-nowrap">Project Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
}
