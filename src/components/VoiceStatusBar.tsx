'use client';

import { Mic } from 'lucide-react';

interface VoiceStatusBarProps {
  isPlaying?: boolean;
  isListening?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export default function VoiceStatusBar({
  isPlaying = false,
  isListening = false,
  hasError = false,
  errorMessage = 'Sorry, no connection available'
}: VoiceStatusBarProps) {
  if (!isPlaying && !isListening && !hasError) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] safe-top">
      {/* Error Bar */}
      {hasError && (
        <div className="bg-red-900/80 backdrop-blur-sm border-b border-red-700 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-red-100">
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Speaking Bar */}
      {isPlaying && !hasError && (
        <div className="bg-blue-900/60 backdrop-blur-sm border-b border-blue-700/50 px-4 py-2">
          <div className="flex items-center justify-center gap-3">
            {/* Animated Waveform SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" className="animate-pulse">
              <rect x="2" y="8" width="2" height="8" fill="currentColor" className="text-blue-300 animate-wave-1" />
              <rect x="6" y="4" width="2" height="16" fill="currentColor" className="text-blue-300 animate-wave-2" />
              <rect x="10" y="6" width="2" height="12" fill="currentColor" className="text-blue-300 animate-wave-3" />
              <rect x="14" y="4" width="2" height="16" fill="currentColor" className="text-blue-300 animate-wave-2" />
              <rect x="18" y="8" width="2" height="8" fill="currentColor" className="text-blue-300 animate-wave-1" />
            </svg>
            <span className="text-sm font-medium text-blue-100">Haley is speaking...</span>
          </div>
        </div>
      )}

      {/* Listening Bar */}
      {isListening && !hasError && !isPlaying && (
        <div className="bg-purple-900/60 backdrop-blur-sm border-b border-purple-700/50 px-4 py-2">
          <div className="flex items-center justify-center gap-3">
            <Mic size={16} className="text-purple-300 animate-pulse" />
            <span className="text-sm font-medium text-purple-100">Listening...</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes wave-1 {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
        @keyframes wave-2 {
          0%, 100% { height: 16px; }
          50% { height: 8px; }
        }
        @keyframes wave-3 {
          0%, 100% { height: 12px; }
          50% { height: 20px; }
        }
        .animate-wave-1 {
          animation: wave-1 1s ease-in-out infinite;
        }
        .animate-wave-2 {
          animation: wave-2 1s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .animate-wave-3 {
          animation: wave-3 1s ease-in-out infinite;
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
