'use client';

/**
 * HaleyThinkingAnimation - Animated Haley logo for loading states
 * 
 * The Seven dispersing and reuniting animation:
 * - Seven segments separate from the center (representing each AI)
 * - They expand outward
 * - Spin while separated
 * - Contract back together
 * - Continuous cycle
 * 
 * Used to indicate active thinking/processing instead of typing dots
 */

export function HaleyThinkingAnimation() {
  const size = 40;
  
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

        .haley-thinking-svg {
          position: absolute;
          top: 0;
          left: 0;
        }

        /* Animate each segment individually */
        .segment-0 { animation: segmentFloat0 4s ease-in-out infinite; }
        .segment-1 { animation: segmentFloat1 4s ease-in-out infinite; }
        .segment-2 { animation: segmentFloat2 4s ease-in-out infinite; }
        .segment-3 { animation: segmentFloat3 4s ease-in-out infinite; }
        .segment-4 { animation: segmentFloat4 4s ease-in-out infinite; }
        .segment-5 { animation: segmentFloat5 4s ease-in-out infinite; }
        .segment-6 { animation: segmentFloat6 4s ease-in-out infinite; }

        /* Center core pulses */
        .center-core {
          animation: corePulse 4s ease-in-out infinite;
        }

        /* Outer ring rotates */
        .outer-ring {
          animation: ringRotate 4s ease-in-out infinite;
          transform-origin: center;
        }

        /* Core pulsing animation */
        @keyframes corePulse {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          25% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.9;
            transform: scale(1);
          }
          75% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        /* Ring rotation */
        @keyframes ringRotate {
          0% {
            transform: rotate(0deg);
            opacity: 0.3;
          }
          25% {
            transform: rotate(90deg);
            opacity: 0.5;
          }
          50% {
            transform: rotate(180deg);
            opacity: 0.3;
          }
          75% {
            transform: rotate(270deg);
            opacity: 0.5;
          }
          100% {
            transform: rotate(360deg);
            opacity: 0.3;
          }
        }

        /* Segment animations - each segment moves outward along its radial angle */
        @keyframes segmentFloat0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
          25% { transform: translate(0, -8px) rotate(45deg); opacity: 0.9; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.6; }
          75% { transform: translate(0, -8px) rotate(270deg); opacity: 0.9; }
        }

        @keyframes segmentFloat1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.65; }
          25% { transform: translate(6px, -6px) rotate(45deg); opacity: 0.95; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.65; }
          75% { transform: translate(6px, -6px) rotate(270deg); opacity: 0.95; }
        }

        @keyframes segmentFloat2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          25% { transform: translate(8px, 0) rotate(45deg); opacity: 1; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.7; }
          75% { transform: translate(8px, 0) rotate(270deg); opacity: 1; }
        }

        @keyframes segmentFloat3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.75; }
          25% { transform: translate(6px, 6px) rotate(45deg); opacity: 0.85; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.75; }
          75% { transform: translate(6px, 6px) rotate(270deg); opacity: 0.85; }
        }

        @keyframes segmentFloat4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.8; }
          25% { transform: translate(0, 8px) rotate(45deg); opacity: 0.9; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.8; }
          75% { transform: translate(0, 8px) rotate(270deg); opacity: 0.9; }
        }

        @keyframes segmentFloat5 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.85; }
          25% { transform: translate(-6px, 6px) rotate(45deg); opacity: 0.95; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.85; }
          75% { transform: translate(-6px, 6px) rotate(270deg); opacity: 0.95; }
        }

        @keyframes segmentFloat6 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.9; }
          25% { transform: translate(-8px, 0) rotate(45deg); opacity: 1; }
          50% { transform: translate(0, 0) rotate(180deg); opacity: 0.9; }
          75% { transform: translate(-8px, 0) rotate(270deg); opacity: 1; }
        }
      `}</style>
      
      <svg 
        className="haley-thinking-svg"
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring - represents unity of The Seven */}
        <circle 
          className="outer-ring"
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="0.5"
          opacity="0.3"
        />
        
        {/* Seven radial segments - each representing one of The Seven AIs */}
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
              className={`segment-${i}`}
              d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`}
              fill="currentColor"
              opacity={0.6 + (i * 0.05)}
              style={{ transformOrigin: '12px 12px' }}
            />
          );
        })}
        
        {/* Center core - represents AI consciousness */}
        <g className="center-core">
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
          />
        </g>
      </svg>
    </div>
  );
}
