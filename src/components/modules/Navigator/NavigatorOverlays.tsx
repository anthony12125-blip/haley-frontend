'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

export interface NavigatorOverlay {
  id: string;
  type: 'circle' | 'arrow' | 'highlight' | 'path' | 'tooltip';
  target: string; // CSS selector, coordinates "x,y", or element id
  color: string;
  label?: string;
  size?: number;
  duration?: number; // Auto-dismiss after ms, 0 = permanent
}

export interface OverlayPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NavigatorOverlaysProps {
  overlays: NavigatorOverlay[];
  getElementPosition?: (selector: string) => DOMRect | null;
  containerRef?: React.RefObject<HTMLElement>;
  onOverlayClick?: (overlay: NavigatorOverlay) => void;
}

// ============================================================================
// OVERLAY COMPONENTS
// ============================================================================

interface BaseOverlayProps {
  overlay: NavigatorOverlay;
  position: OverlayPosition | null;
  onClick?: () => void;
}

// Pulsing circle overlay
function CircleOverlay({ overlay, position, onClick }: BaseOverlayProps) {
  if (!position) return null;

  const size = overlay.size || 60;
  const centerX = position.x + position.width / 2;
  const centerY = position.y + position.height / 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        left: centerX - size / 2,
        top: centerY - size / 2,
        width: size,
        height: size,
      }}
      onClick={onClick}
    >
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `3px solid ${overlay.color}`,
          opacity: 0.3,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `3px solid ${overlay.color}`,
        }}
      />
      {/* Center dot */}
      <div
        className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: overlay.color }}
      />
      {/* Label */}
      {overlay.label && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
          style={{
            backgroundColor: overlay.color,
            color: 'white',
          }}
        >
          {overlay.label}
        </div>
      )}
    </motion.div>
  );
}

// Pointing arrow overlay
function ArrowOverlay({ overlay, position, onClick }: BaseOverlayProps) {
  if (!position) return null;

  const size = overlay.size || 40;
  const centerX = position.x + position.width / 2;
  const targetY = position.y - size - 10; // Above the element

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        left: centerX - size / 2,
        top: targetY,
      }}
      onClick={onClick}
    >
      {/* Bouncing arrow */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}
        >
          <path
            d="M12 4L12 20M12 20L6 14M12 20L18 14"
            stroke={overlay.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      {/* Label */}
      {overlay.label && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
          style={{
            backgroundColor: overlay.color,
            color: 'white',
          }}
        >
          {overlay.label}
        </div>
      )}
    </motion.div>
  );
}

// Highlight box overlay
function HighlightOverlay({ overlay, position, onClick }: BaseOverlayProps) {
  if (!position) return null;

  const padding = 4;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute pointer-events-auto cursor-pointer"
      style={{
        left: position.x - padding,
        top: position.y - padding,
        width: position.width + padding * 2,
        height: position.height + padding * 2,
      }}
      onClick={onClick}
    >
      {/* Highlight box */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          border: `3px solid ${overlay.color}`,
          backgroundColor: `${overlay.color}15`,
          boxShadow: `0 0 20px ${overlay.color}40`,
        }}
        animate={{
          boxShadow: [
            `0 0 10px ${overlay.color}40`,
            `0 0 25px ${overlay.color}60`,
            `0 0 10px ${overlay.color}40`,
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Label */}
      {overlay.label && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
          style={{
            backgroundColor: overlay.color,
            color: 'white',
          }}
        >
          {overlay.label}
        </div>
      )}
    </motion.div>
  );
}

// Path/line overlay connecting points
function PathOverlay({ overlay, position, onClick }: BaseOverlayProps) {
  if (!position) return null;

  // Parse target as "x1,y1:x2,y2" for path
  const [start, end] = overlay.target.split(':').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });

  if (!start || !end) return null;

  return (
    <motion.svg
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 1, pathLength: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      <motion.path
        d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
        stroke={overlay.color}
        strokeWidth="3"
        strokeDasharray="8 4"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Endpoint marker */}
      <circle cx={end.x} cy={end.y} r="6" fill={overlay.color} />
    </motion.svg>
  );
}

// Tooltip overlay
function TooltipOverlay({ overlay, position, onClick }: BaseOverlayProps) {
  if (!position) return null;

  const centerX = position.x + position.width / 2;
  const targetY = position.y - 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute pointer-events-auto"
      style={{
        left: centerX,
        top: targetY,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={onClick}
    >
      <div
        className="relative px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
        style={{
          backgroundColor: overlay.color,
          color: 'white',
          maxWidth: '250px',
        }}
      >
        {overlay.label || 'Click here'}
        {/* Arrow pointing down */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${overlay.color}`,
          }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN OVERLAYS COMPONENT
// ============================================================================

export default function NavigatorOverlays({
  overlays,
  getElementPosition,
  containerRef,
  onOverlayClick,
}: NavigatorOverlaysProps) {
  const [positions, setPositions] = useState<Map<string, OverlayPosition | null>>(new Map());
  const [dismissedOverlays, setDismissedOverlays] = useState<Set<string>>(new Set());

  // Parse target to get position
  const parseTarget = useCallback((target: string): OverlayPosition | null => {
    // Check for coordinate format "x,y" or "x,y,w,h"
    if (/^\d+,\d+(,\d+,\d+)?$/.test(target)) {
      const parts = target.split(',').map(Number);
      return {
        x: parts[0],
        y: parts[1],
        width: parts[2] || 0,
        height: parts[3] || 0,
      };
    }

    // Try CSS selector via callback
    if (getElementPosition) {
      const rect = getElementPosition(target);
      if (rect) {
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      }
    }

    // Try querying container
    if (containerRef?.current) {
      try {
        const element = containerRef.current.querySelector(target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          return {
            x: rect.x - containerRect.x,
            y: rect.y - containerRect.y,
            width: rect.width,
            height: rect.height,
          };
        }
      } catch {
        // Invalid selector
      }
    }

    return null;
  }, [getElementPosition, containerRef]);

  // Update positions when overlays change
  useEffect(() => {
    const newPositions = new Map<string, OverlayPosition | null>();

    overlays.forEach(overlay => {
      if (overlay.type !== 'path') {
        newPositions.set(overlay.id, parseTarget(overlay.target));
      } else {
        // Path overlays don't need position parsing
        newPositions.set(overlay.id, { x: 0, y: 0, width: 0, height: 0 });
      }
    });

    setPositions(newPositions);
  }, [overlays, parseTarget]);

  // Handle auto-dismiss
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    overlays.forEach(overlay => {
      if (overlay.duration && overlay.duration > 0) {
        const timer = setTimeout(() => {
          setDismissedOverlays(prev => new Set([...prev, overlay.id]));
        }, overlay.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [overlays]);

  // Clear dismissed when overlays change
  useEffect(() => {
    setDismissedOverlays(new Set());
  }, [overlays]);

  const handleOverlayClick = (overlay: NavigatorOverlay) => {
    onOverlayClick?.(overlay);
    // Auto-dismiss on click
    setDismissedOverlays(prev => new Set([...prev, overlay.id]));
  };

  const visibleOverlays = overlays.filter(o => !dismissedOverlays.has(o.id));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {visibleOverlays.map(overlay => {
          const position = positions.get(overlay.id) ?? null;
          const props: BaseOverlayProps = {
            overlay,
            position,
            onClick: () => handleOverlayClick(overlay),
          };

          switch (overlay.type) {
            case 'circle':
              return <CircleOverlay key={overlay.id} {...props} />;
            case 'arrow':
              return <ArrowOverlay key={overlay.id} {...props} />;
            case 'highlight':
              return <HighlightOverlay key={overlay.id} {...props} />;
            case 'path':
              return <PathOverlay key={overlay.id} {...props} />;
            case 'tooltip':
              return <TooltipOverlay key={overlay.id} {...props} />;
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </div>
  );
}
