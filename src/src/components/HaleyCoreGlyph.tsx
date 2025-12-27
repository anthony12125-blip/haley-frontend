'use client';

/**
 * HaleyCoreGlyph - Abstract Seven-Segment Radial Symbol
 * 
 * Usage: AI, AI Models, Haley
 * Shape: Locked - Cannot be modified
 * Text: false - Pure symbolic representation
 * 
 * This is the core identity symbol that represents:
 * - AI consciousness
 * - AI Models selection
 * - Haley system intelligence
 */

interface HaleyCoreGlyphProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function HaleyCoreGlyph({ 
  size = 24, 
  className = '',
  animated = false 
}: HaleyCoreGlyphProps) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? 'animate-spin-slow' : ''}
      >
        {/* Seven radial segments - representing The Seven */}
        {Array.from({ length: 7 }).map((_, i) => {
          const angle = (i * 360) / 7;
          const startAngle = angle - 20;
          const endAngle = angle + 20;
          
          // Convert angles to radians
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          // Calculate arc points
          const innerRadius = 6;
          const outerRadius = 10;
          
          const x1 = 12 + innerRadius * Math.cos(startRad);
          const y1 = 12 + innerRadius * Math.sin(startRad);
          const x2 = 12 + outerRadius * Math.cos(startRad);
          const y2 = 12 + outerRadius * Math.sin(startRad);
          const x3 = 12 + outerRadius * Math.cos(endRad);
          const y3 = 12 + outerRadius * Math.sin(endRad);
          const x4 = 12 + innerRadius * Math.cos(endRad);
          const y4 = 12 + innerRadius * Math.sin(endRad);
          
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`}
              fill="currentColor"
              opacity={0.6 + (i * 0.05)}
              className={animated ? 'transition-opacity duration-300' : ''}
            />
          );
        })}
        
        {/* Center core - represents AI consciousness */}
        <circle 
          cx="12" 
          cy="12" 
          r="4" 
          fill="currentColor"
          opacity="0.9"
        />
        
        {/* Inner detail - subtle depth */}
        <circle 
          cx="12" 
          cy="12" 
          r="2.5" 
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.4"
        />
        
        {/* Center glow point */}
        <circle 
          cx="12" 
          cy="12" 
          r="1" 
          fill="currentColor"
          opacity="1"
          className={animated ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );
}

// Add animation classes to global CSS if needed
// .animate-spin-slow { animation: spin 8s linear infinite; }
