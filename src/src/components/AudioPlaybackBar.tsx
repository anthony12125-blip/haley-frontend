'use client';

import { Play, Pause, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AudioPlaybackBarProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  text?: string;
}

export default function AudioPlaybackBar({
  audioUrl,
  isPlaying,
  onPlayPause,
  onClose,
  text = 'Haley is speaking...'
}: AudioPlaybackBarProps) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] safe-top">
      <div className="bg-blue-900/90 backdrop-blur-sm border-b border-blue-700/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
          {/* Left: Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="flex-shrink-0 p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white" />
            )}
          </button>

          {/* Center: Text and Progress */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-blue-100 mb-1 truncate">
              {text}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-300 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-blue-200">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full hover:bg-blue-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-blue-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
