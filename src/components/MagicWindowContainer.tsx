'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import type { MagicWindowContent } from '@/types';

interface MagicWindowContainerProps {
  content: MagicWindowContent | null;
  onClose: () => void;
}

const ANIMATIONS = [
  'portalOpen',
  'spiralIn',
  'dimensionShift',
  'mysticalEntrance',
];

export default function MagicWindowContainer({ content, onClose }: MagicWindowContainerProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (content) {
      // Random animation each time
      const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setCurrentAnimation(randomAnim);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [content]);

  if (!content || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  return (
    <div
      className={`magic-window ${isMaximized ? 'maximized' : ''}`}
      style={{
        width: isMaximized ? '90vw' : '320px',
        height: isMaximized ? '85vh' : '400px',
        left: isMaximized ? '50%' : '20px',
        top: isMaximized ? '50%' : 'auto',
        transform: isMaximized ? 'translate(-50%, -50%)' : 'none',
      }}
    >
      {/* Portal Ring Effect */}
      <div className="portal-ring" />
      
      {/* Spark Effects */}
      <div className="portal-sparks" />

      {/* Window Content */}
      <div className="glass-strong rounded-[20px] w-full h-full flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gradient truncate flex-1">
            {content.title || 'Magic Window'}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="icon-btn !w-8 !h-8"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={handleClose}
              className="icon-btn !w-8 !h-8"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {renderContent(content)}
        </div>
      </div>
    </div>
  );
}

function renderContent(content: MagicWindowContent) {
  switch (content.type) {
    case 'visualization':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-secondary">Visualization rendering...</p>
          </div>
        </div>
      );
    
    case 'code':
      return (
        <pre className="bg-panel-dark p-4 rounded-lg overflow-x-auto text-sm font-mono">
          <code>{typeof content.content === 'string' ? content.content : JSON.stringify(content.content, null, 2)}</code>
        </pre>
      );
    
    case 'image':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={content.content}
            alt="Magic Window Content"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    
    case 'data':
      return (
        <div className="space-y-2">
          {Object.entries(content.content).map(([key, value]) => (
            <div key={key} className="bg-panel-dark p-3 rounded-lg">
              <div className="text-xs text-secondary uppercase mb-1">{key}</div>
              <div className="text-primary font-mono">{String(value)}</div>
            </div>
          ))}
        </div>
      );
    
    default:
      return (
        <div className="text-secondary">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(content.content, null, 2)}
          </pre>
        </div>
      );
  }
}
