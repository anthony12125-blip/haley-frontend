'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MagicWindowProps {
  content: any;
  onClose: () => void;
}

export default function MagicWindow({ content, onClose }: MagicWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      className={`fixed z-30 transition-all duration-300 ${
        isMinimized
          ? 'bottom-24 left-4 w-16 h-16'
          : 'bottom-24 left-4 w-96 h-96'
      }`}
    >
      {/* Window Container */}
      <div className="glass rounded-haley-lg shadow-card border border-white/20 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30">
          <div className="text-haley-text-title text-sm font-medium">
            {isMinimized ? '✨' : '✨ Magic Window'}
          </div>
          {!isMinimized && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Minimize"
              >
                <span className="text-haley-text-body text-xs">—</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-haley-text-body" />
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {!isMinimized && (
          <div className="flex-1 overflow-auto p-4">
            {content?.type === 'roblox' && (
              <div className="text-haley-text-body">
                <div className="text-sm font-medium mb-2">Roblox Preview</div>
                <div className="bg-black/40 rounded-haley p-4 text-center">
                  🎮 Roblox integration coming soon
                </div>
              </div>
            )}

            {content?.type === 'ui_preview' && (
              <div className="text-haley-text-body">
                <div className="text-sm font-medium mb-2">UI Preview</div>
                <div className="bg-black/40 rounded-haley p-4">
                  {/* Render dynamic UI preview */}
                  <div className="text-center text-haley-text-subtext">
                    UI preview placeholder
                  </div>
                </div>
              </div>
            )}

            {content?.type === 'code_execution' && (
              <div className="text-haley-text-body">
                <div className="text-sm font-medium mb-2">Code Execution</div>
                <div className="bg-black/40 rounded-haley p-3 font-mono text-xs">
                  <div className="text-green-400">$ {content.command}</div>
                  <div className="text-haley-text-subtext mt-2">
                    {content.output || 'Running...'}
                  </div>
                </div>
              </div>
            )}

            {!content?.type && (
              <div className="flex items-center justify-center h-full text-haley-text-subtext text-sm">
                No preview available
              </div>
            )}
          </div>
        )}

        {/* Minimized Click Area */}
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-2xl"
          >
            ✨
          </button>
        )}
      </div>
    </div>
  );
}
