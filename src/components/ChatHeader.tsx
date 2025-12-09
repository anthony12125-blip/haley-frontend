'use client';

import { Menu, MoreVertical } from 'lucide-react';
import type { SystemStatusResponse } from '@/lib/haleyApi';

interface ChatHeaderProps {
  mode: 'Assistant' | 'Regular' | 'Developer' | 'System';
  onMenuClick: () => void;
  onMoreClick: () => void;
  osStatus: SystemStatusResponse | null;
}

export default function ChatHeader({ mode, onMenuClick, onMoreClick, osStatus }: ChatHeaderProps) {
  return (
    <div className="glass-light border-b border-white/10 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6 text-haley-text-body" />
        </button>

        {/* Center: Mode Display */}
        <div className="flex-1 flex justify-center">
          <div className="text-haley-text-title font-semibold text-lg">
            {mode}
          </div>
        </div>

        {/* Right: Three Dot Menu */}
        <button
          onClick={onMoreClick}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-6 h-6 text-haley-text-body" />
        </button>
      </div>

      {/* Optional: Status Bar */}
      {osStatus && (
        <div className="px-4 pb-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <span className="text-haley-text-subtext">
              {osStatus.kernel_status.syscalls} syscalls
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
