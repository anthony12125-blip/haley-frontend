'use client';

import { Microscope, Puzzle, Menu } from 'lucide-react';
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
    if (activeJustice === 'gemini') return 'hue-yellow';
    if (activeJustice === 'claude') return 'hue-red';
    if (activeJustice === 'gpt') return 'hue-green';
    if (aiMode === 'supreme-court') return 'hue-purple';
    return '';
  };

  return (
    <header className={`glass-strong border-b border-border safe-top ${getAIHue()}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="icon-btn"
          title="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Center: Haley Title */}
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-gradient">Haley</h1>
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
