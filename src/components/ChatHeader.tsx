'use client';

import { Menu, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { SystemStatus, AIMode } from '@/types';
import IconEnvelopeWings from './icons/IconEnvelopeWings';
import { BUILD_VERSION } from '@/config/buildVersion';

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
  activeModule?: string | null;
  onBackToChat?: () => void;
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
  activeModule,
  onBackToChat,
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
        {/* Left: Back button (when in module) or Hamburger Menu */}
        <div className="flex items-center gap-2">
          {activeModule && onBackToChat ? (
            <button
              onClick={onBackToChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
              title="Back to Chat"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to Chat</span>
            </button>
          ) : (
            <>
              <button
                onClick={onToggleSidebar}
                className="icon-btn md:hidden"
                title="Toggle sidebar"
              >
                <Menu size={24} />
              </button>
              {/* Desktop: Empty space for alignment */}
              <div className="hidden md:block w-10" />
            </>
          )}
        </div>

        {/* Center: Dynamic Title */}
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-xl font-bold text-gradient">{getDisplayName()}</h1>
          <span className="text-xs font-mono text-muted opacity-60">
            #{BUILD_VERSION.toString().padStart(4, '0')}
          </span>
        </div>

        {/* Right: Migrate Chat Button */}
        <div className="flex items-center gap-2">
          {onMigrateChat && (
            <button
              onClick={onMigrateChat}
              className="p-2 rounded-lg hover:bg-panel-light active:bg-primary/20 transition-all"
              title="Migrate entire chat"
              aria-label="Generate AI-agnostic summary for entire chat"
            >
              <IconEnvelopeWings size={38} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
