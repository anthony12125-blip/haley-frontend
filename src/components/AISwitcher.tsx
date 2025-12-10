'use client';

import { useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';
import { Sparkles, Brain, Users, X } from 'lucide-react';
import type { AIMode } from '@/types';

interface AISwitcherProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  activeModels: string[];
}

const AI_MODES = [
  {
    id: 'single' as AIMode,
    name: 'Single AI',
    icon: Sparkles,
    description: 'One AI model at a time',
  },
  {
    id: 'multi' as AIMode,
    name: 'Multi AI',
    icon: Brain,
    description: 'Multiple AI models working together',
  },
  {
    id: 'supreme-court' as AIMode,
    name: 'Supreme Court',
    icon: Users,
    description: 'All AIs debate and reach consensus',
  },
];

export default function AISwitcher({ currentMode, onModeChange, activeModels }: AISwitcherProps) {
  const [showMenu, setShowMenu] = useState(false);

  const longPressHandlers = useLongPress({
    onLongPress: () => setShowMenu(true),
    onClick: () => {
      // Cycle through modes on short press
      const currentIndex = AI_MODES.findIndex(m => m.id === currentMode);
      const nextMode = AI_MODES[(currentIndex + 1) % AI_MODES.length];
      onModeChange(nextMode.id);
    },
    duration: 500,
  });

  const currentModeData = AI_MODES.find(m => m.id === currentMode);
  const Icon = currentModeData?.icon || Sparkles;

  return (
    <>
      <div className="ai-switcher">
        <div
          className={`ai-bubble ${showMenu ? 'active' : ''}`}
          {...longPressHandlers}
        >
          <div className="ai-indicator" />
          <Icon size={20} />
          <span className="font-semibold text-sm">
            {currentModeData?.name}
          </span>
          {currentMode === 'multi' && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-secondary opacity-75">
                {activeModels.length} active
              </span>
            </div>
          )}
          {currentMode === 'supreme-court' && (
            <div className="supreme-indicator ml-2">
              <Users size={14} />
              <span>DEBATE</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1002] flex items-center justify-center"
          onClick={() => setShowMenu(false)}
        >
          <div className="glass-strong rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gradient">Select AI Mode</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="icon-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {AI_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                const isActive = mode.id === currentMode;

                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onModeChange(mode.id);
                      setShowMenu(false);
                    }}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-primary/20 border-primary'
                        : 'bg-panel-medium border-border hover:border-accent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-primary text-white' : 'bg-panel-dark text-primary'
                      }`}>
                        <ModeIcon size={24} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-primary mb-1">
                          {mode.name}
                        </div>
                        <div className="text-sm text-secondary">
                          {mode.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-secondary text-center">
                Tap to cycle • Long press to select
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
