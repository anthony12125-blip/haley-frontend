'use client';

/**
 * HaleyThinkingAnimation - Animated Haley logo for loading states
 * 
 * Displays the Haley logo with combined animations:
 * - Spinning (continuous rotation)
 * - Opening/Closing (scale pulsing)
 * - Opacity pulsing
 * 
 * Used to indicate active thinking/processing instead of typing dots
 */

import { HaleyCoreGlyph } from './HaleyCoreGlyph';

export function HaleyThinkingAnimation() {
  return (
    <div className="haley-thinking-animation">
      <style jsx>{`
        .haley-thinking-animation {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          color: var(--accent);
        }

        :root.light .haley-thinking-animation {
          color: #4B6CFF;
        }

        .haley-thinking-animation :global(svg) {
          animation: 
            haleyThinkingSpin 3s linear infinite,
            haleyThinkingScale 2s ease-in-out infinite,
            haleyThinkingPulse 2s ease-in-out infinite;
        }

        @keyframes haleyThinkingSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes haleyThinkingScale {
          0%, 100% {
            transform: scale(0.9) rotate(var(--rotation, 0deg));
          }
          50% {
            transform: scale(1.1) rotate(var(--rotation, 0deg));
          }
        }

        @keyframes haleyThinkingPulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        /* Combined animation approach - we need to apply all transforms together */
        .haley-thinking-animation :global(svg) {
          animation: haleyThinkingCombined 3s ease-in-out infinite;
        }

        @keyframes haleyThinkingCombined {
          0% {
            transform: rotate(0deg) scale(0.95);
            opacity: 0.75;
          }
          25% {
            transform: rotate(90deg) scale(1.05);
            opacity: 0.9;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 1;
          }
          75% {
            transform: rotate(270deg) scale(1.05);
            opacity: 0.9;
          }
          100% {
            transform: rotate(360deg) scale(0.95);
            opacity: 0.75;
          }
        }
      `}</style>
      
      <HaleyCoreGlyph size={32} />
    </div>
  );
}
