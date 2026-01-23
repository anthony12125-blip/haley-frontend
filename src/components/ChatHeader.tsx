'use client';

import { Menu, ArrowLeft, LayoutGrid } from 'lucide-react';
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
  onBack?: () => void;
  onGoHome?: () => void;
  canGoBack?: boolean;
  onOpenDashboard?: () => void;
  processCount?: number;  // Number of running processes (for badge)
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
  onBack,
  onGoHome,
  canGoBack,
  onOpenDashboard,
  processCount = 1,
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
    // Always show "Haley" when in a module
    if (activeModule) {
      return 'Haley';
    }
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
        {/* Left: Back button (when can go back) or Hamburger Menu */}
        <div className="flex items-center gap-2">
          {canGoBack && onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
              title="Go back"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back</span>
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

        {/* Center: Dynamic Title - Haley is clickable home button */}
        <div className="flex items-center justify-center gap-3">
          {onGoHome ? (
            <button
              onClick={onGoHome}
              className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Chat (Home)"
            >
              {getDisplayName()}
            </button>
          ) : (
            <h1 className="text-xl font-bold text-gradient">{getDisplayName()}</h1>
          )}
          <span className="text-xs font-mono text-muted opacity-60">
            #{BUILD_VERSION.toString().padStart(4, '0')}
          </span>
        </div>

        {/* Right: Dashboard + Migrate Chat Buttons */}
        <div className="flex items-center gap-2">
          {/* Dashboard - Desktop only */}
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="relative hidden md:block p-2 rounded-lg hover:bg-panel-light active:bg-primary/20 transition-all"
              title="Open Dashboard"
              aria-label="Open module dashboard"
            >
              <LayoutGrid size={24} className="text-muted-foreground" />
              {/* Process count badge - show if more than 1 process running */}
              {processCount > 1 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-primary rounded-full">
                  {processCount > 9 ? '9+' : processCount}
                </span>
              )}
            </button>
          )}
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
