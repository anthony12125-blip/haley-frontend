'use client';

import React from 'react';
import { Maximize2, Minimize2, Hand, Bot, ArrowRightLeft, Globe, Target } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface SessionState {
  session_id: string;
  user_id: string;
  status: string;
  mode: string;
  current_url: string | null;
  current_title: string | null;
  goal: string | null;
}

interface ConnectionStats {
  latency: number;
  fps: number;
  bitrate: number;
}

interface NavigatorControlsProps {
  mode: string;
  sessionState: SessionState | null;
  stats: ConnectionStats;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRequestHandoff: (targetMode: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NavigatorControls({
  mode,
  sessionState,
  stats,
  isFullscreen,
  onToggleFullscreen,
  onRequestHandoff
}: NavigatorControlsProps) {
  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between text-white">
          {/* Left: URL and title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-sm font-medium">
                {sessionState?.current_title || 'Loading...'}
              </span>
              {sessionState?.current_url && (
                <span className="text-xs text-gray-400 ml-2 truncate">
                  {sessionState.current_url}
                </span>
              )}
            </div>
          </div>

          {/* Right: Stats and controls */}
          <div className="flex items-center gap-4">
            {/* Connection stats */}
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span>{stats.latency.toFixed(0)}ms</span>
              <span>{stats.fps.toFixed(0)} FPS</span>
            </div>

            {/* Fullscreen button */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Goal indicator (if set) */}
      {sessionState?.goal && (
        <div className="absolute top-14 left-4 right-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/60 rounded-lg text-white text-sm">
            <Target className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="truncate">Goal: {sessionState.goal}</span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between text-white">
          {/* Left: Mode switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRequestHandoff('haley_drives')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'haley_drives'
                  ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">Haley Drives</span>
            </button>

            <ArrowRightLeft className="w-4 h-4 text-gray-500" />

            <button
              onClick={() => onRequestHandoff('user_drives')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                mode === 'user_drives'
                  ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span className="text-sm">Take Control</span>
            </button>
          </div>

          {/* Right: Session status */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className={`w-2 h-2 rounded-full ${
              sessionState?.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
            }`} />
            <span className="capitalize">{sessionState?.status || 'connecting'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
