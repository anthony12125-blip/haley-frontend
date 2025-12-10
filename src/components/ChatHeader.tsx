'use client';

import { Menu, MoreVertical, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import SupremeCourtIndicator from './SupremeCourtIndicator';
import type { SystemStatus, AIMode } from '@/types';

interface ChatHeaderProps {
  mode: AIMode;
  aiMode: AIMode;
  activeModels: string[];
  onMenuClick: () => void;
  onMoreClick: () => void;
  systemStatus: SystemStatus | null;
}

export default function ChatHeader({
  mode,
  aiMode,
  activeModels,
  onMenuClick,
  onMoreClick,
  systemStatus,
}: ChatHeaderProps) {
  const [showStatus, setShowStatus] = useState(false);

  const isOnline = systemStatus !== null;

  return (
    <header className="glass-strong border-b border-border safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu */}
        <button onClick={onMenuClick} className="icon-btn">
          <Menu size={24} />
        </button>

        {/* Center: Title & Status */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <h1 className="text-xl font-bold text-gradient">HaleyOS</h1>
          {aiMode === 'supreme-court' && (
            <SupremeCourtIndicator activeModels={activeModels} />
          )}
          <button
            onClick={() => setShowStatus(!showStatus)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-panel-light transition-colors"
          >
            {isOnline ? (
              <Wifi size={16} className="text-success" />
            ) : (
              <WifiOff size={16} className="text-error" />
            )}
            <span className="text-xs text-secondary hidden md:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>
        </div>

        {/* Right: More Options */}
        <button onClick={onMoreClick} className="icon-btn">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Status Panel */}
      {showStatus && systemStatus && (
        <div className="px-4 pb-3 border-t border-border mt-2 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-panel-dark p-2 rounded-lg">
              <div className="text-secondary mb-1">Kernel</div>
              <div className="text-primary font-semibold">{systemStatus.kernel_status.kernel}</div>
            </div>
            <div className="bg-panel-dark p-2 rounded-lg">
              <div className="text-secondary mb-1">Syscalls</div>
              <div className="text-primary font-semibold">{systemStatus.kernel_status.syscalls}</div>
            </div>
            <div className="bg-panel-dark p-2 rounded-lg">
              <div className="text-secondary mb-1">Modules</div>
              <div className="text-primary font-semibold">{systemStatus.kernel_status.modules}</div>
            </div>
            <div className="bg-panel-dark p-2 rounded-lg">
              <div className="text-secondary mb-1">Memory Keys</div>
              <div className="text-primary font-semibold">{systemStatus.kernel_status.memory_keys}</div>
            </div>
          </div>
          {systemStatus.note && (
            <div className="mt-2 text-xs text-secondary text-center">
              {systemStatus.note}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
