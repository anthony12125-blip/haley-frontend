'use client';

/**
 * HaleyThinkingAnimation - Animated Haley logo for loading states
 * 
 * Clean animation cycle:
 * 1. Segments separate outward (keeping exact shape)
 * 2. Rotate while separated
 * 3. Contract back to center
 * 4. Expand outward again
 * 5. Rotate while separated
 * 6. Contract back
 * Repeat infinitely
 */

export function HaleyThinkingAnimation() {
  const size = 48; // Larger container to prevent clipping
  
  return (
    <div className="haley-thinking-container">
      <style jsx>{`
        .haley-thinking-container {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          color: var(--accent);
          width: ${size}px;
          height: ${size}px;
          position: relative;
        }

        :root.light .haley-thinking-container {
          color: #4B6CFF;
        }

        .haley-svg-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Main animation container - handles rotation */
        .segments-group {
          transform-origin: 12px 12px;
          animation: segmentsRotate 4s ease-in-out infinite;
        }

        /* Each segment moves outward/inward */
        .segment {
          animation: segmentMove 4s ease-in-out infinite;
        }

        /* Center core stays still */
        .center-core {
          /* No animation - stays centered */
        }

        /* Rotation animation */
        @keyframes segmentsRotate {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(0deg); }
          37.5% { transform: rotate(90deg); }
          50% { transform: rotate(90deg); }
          62.5% { transform: rotate(90deg); }
          75% { transform: rotate(180deg); }
          87.5% { transform: rotate(180deg); }
          100% { transform: rotate(180deg); }
        }

        /* Expand/contract animation */
        @keyframes segmentMove {
          0%, 100% { transform: translate(0, 0); }
          12.5%, 37.5% { transform: translate(var(--tx), var(--ty)); }
          50% { transform: translate(0, 0); }
          62.5%, 87.5% { transform: translate(var(--tx), var(--ty)); }
        }
      `}</style>
      
      <div className="haley-svg-wrapper">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Seven segments - wrapped in group for rotation */}
          <g className="segments-group">
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
              
              // Calculate translation direction for this segment (radial outward)
              const midAngle = (angle * Math.PI) / 180;
              const tx = Math.cos(midAngle) * 3; // Move 3px outward
              const ty = Math.sin(midAngle) * 3;
              
              return (
                <path
                  key={i}
                  className="segment"
                  d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`}
                  fill="currentColor"
                  opacity={0.7}
                  style={{ 
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`
                  } as React.CSSProperties}
                />
              );
            })}
          </g>
          
          {/* Center core - stays still */}
          <g className="center-core">
            <circle 
              cx="12" 
              cy="12" 
              r="4" 
              fill="currentColor"
              opacity="0.9"
            />
            
            <circle 
              cx="12" 
              cy="12" 
              r="2.5" 
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.4"
            />
            
            <circle 
              cx="12" 
              cy="12" 
              r="1" 
              fill="currentColor"
              opacity="1"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
