'use client';

import { ChevronLeft } from 'lucide-react';

/**
 * HaleyIndicator - Sidebar State Indicator
 * 
 * Scope: sidebar_only
 * Platform: pc (desktop only)
 * 
 * Behavior:
 * - When sidebar expanded: Shows left arrow (pointing towards collapse)
 * - When sidebar collapsed: Shows "H" letter
 * - Arrow and H are mutually exclusive
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
    // Expanded state: Show left arrow for collapse action
    return (
      <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-lg bg-panel-medium hover:bg-gray-800/70 transition-all duration-300 group relative ${className}`}
        title="Collapse Sidebar"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft 
          size={20} 
          className="text-gray-400 group-hover:text-gray-200 transition-colors" 
        />
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          Collapse
        </div>
      </button>
    );
  }

  // Collapsed state: Show "H" letter for expand action
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800/50 transition-all duration-300 group relative ${className}`}
      title="Expand Sidebar"
      aria-label="Expand sidebar"
    >
      <span className="text-2xl font-bold text-gray-400 group-hover:text-gray-200 transition-colors">
        H
      </span>
      
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
        Expand
      </div>
    </button>
  );
}

/**
 * Design Notes:
 * 
 * The indicator design represents:
 * - Left arrow when expanded: Points towards the collapse direction
 * - "H" when collapsed: Simple letter placeholder (will be replaced with logo later)
 * - Clear state communication with mutually exclusive designs
 * - Consistent interaction pattern
 * 
 * The mutually exclusive nature ensures:
 * - Clear state communication
 * - No visual confusion
 * - Minimal UI changes during transition
 */
