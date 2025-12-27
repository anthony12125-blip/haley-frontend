'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { MagicWindowContent } from '@/types';

interface MagicWindowProps {
  isOpen: boolean;
  content: MagicWindowContent | null;
  researchEnabled: boolean;
  logicEngineEnabled: boolean;
  onClose: () => void;
}

const ANIMATIONS = [
  'portalOpen',
  'spiralIn',
  'dimensionShift',
  'mysticalEntrance',
  'drStrangeRing',
];

export default function MagicWindow({
  isOpen,
  content,
  researchEnabled,
  logicEngineEnabled,
  onClose,
}: MagicWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Random animation each time
      const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setCurrentAnimation(randomAnim);
      
      // Apply random rotation
      const randomRotation = Math.floor(Math.random() * 360);
      document.documentElement.style.setProperty('--magic-rotation', `${randomRotation}deg`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`magic-window ${isMaximized ? 'maximized' : ''} ${currentAnimation}`}
      style={{
        width: isMaximized ? '90vw' : '380px',
        height: isMaximized ? '85vh' : isExpanded ? '500px' : '80px',
        right: isMaximized ? 'auto' : '20px',
        left: isMaximized ? '50%' : 'auto',
        top: isMaximized ? '50%' : 'auto',
        bottom: isMaximized ? 'auto' : '80px',
        transform: isMaximized ? 'translate(-50%, -50%)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}
    >
      {/* Portal Ring Effect with Dr. Strange style */}
      <div className="portal-ring" style={{ opacity: 0.35 }} />
      
      {/* Multiple rotating rings */}
      <div className="portal-ring-outer" style={{ opacity: 0.25 }} />
      
      {/* Spark Effects */}
      <div className="portal-sparks" style={{ opacity: 0.2 }} />

      {/* Window Content with translucent background and soft edges */}
      <div className="rounded-[24px] w-full h-full flex flex-col overflow-hidden relative z-10" 
           style={{ 
             background: 'rgba(17, 20, 24, 0.35)',
             backdropFilter: 'blur(24px)',
             WebkitBackdropFilter: 'blur(24px)',
             border: '1px solid rgba(255, 255, 255, 0.1)'
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-gradient flex-1 text-left"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <Sparkles size={16} className="text-primary" />
            <span>Magic Window</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="icon-btn !w-8 !h-8"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="icon-btn !w-8 !h-8"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* System Status Indicators */}
        {isExpanded && (
          <div className="px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${researchEnabled ? 'bg-success animate-pulse' : 'bg-secondary/30'}`} />
                <span className={researchEnabled ? 'text-success' : 'text-secondary'}>Research</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${logicEngineEnabled ? 'bg-success animate-pulse' : 'bg-secondary/30'}`} />
                <span className={logicEngineEnabled ? 'text-success' : 'text-secondary'}>Logic Engine</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isExpanded && (
          <div className="flex-1 overflow-auto p-4 animate-fadeIn">
            {content ? (
              renderContent(content)
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-float">🔮</div>
                  <p className="text-secondary text-sm">Magic Window ready...</p>
                </div>
              </div>
            )}
          </div>
        )}
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
            <div className="text-6xl mb-4 animate-spin-slow">🔮</div>
            <p className="text-secondary">Visualization rendering...</p>
            <p className="text-xs text-secondary mt-2">{content.title}</p>
          </div>
        </div>
      );
    
    case 'code':
      return (
        <pre className="bg-panel-dark/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
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
            <div key={key} className="bg-panel-dark/50 p-3 rounded-lg">
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
