'use client';

import { useState } from 'react';
import { X, Sparkles, Users, Bot } from 'lucide-react';
import type { AIMode } from '@/types';

interface ModeSelectorProps {
  isOpen: boolean;
  currentMode: AIMode;
  activeJustice: string | null;
  onClose: () => void;
  onSelectMode: (mode: 'haley' | 'ais' | 'agents') => void;
  onSelectJustice: (justice: string) => void;
  availableJustices: Array<{ id: string; name: string; provider: string }>;
  availableAgents: Array<{ id: string; name: string; description: string }>;
}

const THE_SEVEN_JUSTICES = [
  { id: 'gemini', name: 'Gemini', provider: 'Google', color: 'bg-yellow-500/20 border-yellow-500' },
  { id: 'gpt', name: 'GPT-4', provider: 'OpenAI', color: 'bg-green-500/20 border-green-500' },
  { id: 'claude', name: 'Claude', provider: 'Anthropic', color: 'bg-red-500/20 border-red-500' },
  { id: 'llama', name: 'Llama', provider: 'Meta', color: 'bg-purple-500/20 border-purple-500' },
  { id: 'perplexity', name: 'Perplexity', provider: 'Perplexity AI', color: 'bg-cyan-500/20 border-cyan-500' },
  { id: 'mistral', name: 'Mistral', provider: 'Mistral AI', color: 'bg-blue-500/20 border-blue-500' },
  { id: 'grok', name: 'Grok', provider: 'xAI', color: 'bg-pink-500/20 border-pink-500' },
];

export default function ModeSelector({
  isOpen,
  currentMode,
  activeJustice,
  onClose,
  onSelectMode,
  onSelectJustice,
  availableJustices,
  availableAgents,
}: ModeSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<'haley' | 'ais' | 'agents'>('haley');

  if (!isOpen) return null;

  const handleTabSelect = (tab: 'haley' | 'ais' | 'agents') => {
    setSelectedTab(tab);
    if (tab === 'haley') {
      onSelectMode('haley');
      onClose();
    }
  };

  const handleJusticeSelect = (justiceId: string) => {
    onSelectJustice(justiceId);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1002] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="glass-strong rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gradient">Select Mode</h3>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleTabSelect('haley')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              selectedTab === 'haley'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-panel-medium border-border text-secondary hover:border-accent'
            }`}
          >
            <Sparkles size={20} />
            <span className="font-semibold">Haley</span>
          </button>
          <button
            onClick={() => setSelectedTab('ais')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              selectedTab === 'ais'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-panel-medium border-border text-secondary hover:border-accent'
            }`}
          >
            <Users size={20} />
            <span className="font-semibold">AIs</span>
          </button>
          <button
            onClick={() => setSelectedTab('agents')}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
              selectedTab === 'agents'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-panel-medium border-border text-secondary hover:border-accent'
            }`}
          >
            <Bot size={20} />
            <span className="font-semibold">Agents</span>
          </button>
        </div>

        {/* Content based on selected tab */}
        <div className="space-y-3">
          {selectedTab === 'haley' && (
            <div className="text-center py-8">
              <Sparkles size={48} className="mx-auto text-primary mb-4" />
              <h4 className="text-lg font-semibold mb-2">Baby Haley Mode</h4>
              <p className="text-secondary text-sm">
                Return to the primary Haley assistant interface with full orchestration capabilities.
              </p>
            </div>
          )}

          {selectedTab === 'ais' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-secondary mb-3">The Seven</h4>
              {THE_SEVEN_JUSTICES.map((justice) => (
                <button
                  key={justice.id}
                  onClick={() => handleJusticeSelect(justice.id)}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    activeJustice === justice.id
                      ? justice.color
                      : 'bg-panel-medium border-border hover:border-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-primary">{justice.name}</div>
                      <div className="text-xs text-secondary mt-1">{justice.provider}</div>
                    </div>
                    {activeJustice === justice.id && (
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedTab === 'agents' && (
            <div className="space-y-3">
              {availableAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot size={48} className="mx-auto text-secondary opacity-50 mb-4" />
                  <p className="text-secondary text-sm">No agents configured yet</p>
                </div>
              ) : (
                availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      // Handle agent selection
                      onClose();
                    }}
                    className="w-full p-4 rounded-xl border bg-panel-medium border-border hover:border-accent transition-all text-left"
                  >
                    <div className="font-semibold text-primary">{agent.name}</div>
                    <div className="text-xs text-secondary mt-1">{agent.description}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-secondary text-center">
            Long press "Haley" in the header to open this menu
          </p>
        </div>
      </div>
    </div>
  );
}
