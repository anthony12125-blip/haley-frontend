'use client';

import { ChevronDown } from 'lucide-react';

/**
 * HaleyIndicator - Sidebar State Indicator
 * 
 * Scope: sidebar_only
 * Platform: pc (desktop only)
 * 
 * Behavior:
 * - When sidebar expanded: Shows down arrow (collapse action)
 * - When sidebar collapsed: Shows subtle downward comet streak (expand action)
 * - Arrow and comet are mutually exclusive
 * - Indicator direction is always down
 * - No other sidebar elements change
 */

interface HaleyIndicatorProps {
  isExpanded: boolean;
  onClick: () => void;
  className?: string;
}

export function HaleyIndicator({ 
  isExpanded, 
  onClick,
  className = '' 
}: HaleyIndicatorProps) {
  if (isExpanded) {
    // Expanded state: Show down arrow for collapse action
    return (
      <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-lg bg-panel-medium hover:bg-gray-800/70 transition-all duration-300 group relative ${className}`}
        title="Collapse Sidebar"
        aria-label="Collapse sidebar"
      >
        <ChevronDown 
          size={20} 
          className="text-gray-400 group-hover:text-gray-200 transition-colors" 
        />
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          Collapse
        </div>
      </button>
    );
  }

  // Collapsed state: Show subtle downward comet streak for expand action
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-all duration-300 group relative ${className}`}
      title="Expand Sidebar"
      aria-label="Expand sidebar"
    >
      <div className="relative w-6 h-6">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-400 group-hover:text-gray-200 transition-colors"
        >
          {/* Subtle downward comet streak */}
          
          {/* Comet head - bright point */}
          <circle 
            cx="12" 
            cy="8" 
            r="2" 
            fill="currentColor"
            opacity="0.9"
            className="group-hover:opacity-100 transition-opacity"
          />
          
          {/* Comet trail - subtle downward streak */}
          <path
            d="M 12 10 Q 11.5 13 11 16 Q 10.8 17 11 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
            className="group-hover:opacity-0.6 transition-opacity"
            fill="none"
          />
          
          {/* Secondary fainter trail */}
          <path
            d="M 12 10 Q 12.5 13 13 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.2"
            className="group-hover:opacity-0.4 transition-opacity"
            fill="none"
          />
          
          {/* Subtle glow effect */}
          <circle 
            cx="12" 
            cy="8" 
            r="3" 
            fill="currentColor"
            opacity="0.1"
            className="group-hover:opacity-0.2 transition-opacity"
          />
        </svg>
      </div>
      
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
        Expand
      </div>
    </button>
  );
}

/**
 * Design Notes:
 * 
 * The comet design represents:
 * - Downward motion (matching the arrow direction)
 * - Subtlety when collapsed (doesn't dominate the UI)
 * - A sense of invitation to expand
 * - Consistent directional language (always down)
 * 
 * The mutually exclusive nature ensures:
 * - Clear state communication
 * - No visual confusion
 * - Minimal UI changes during transition
 */
