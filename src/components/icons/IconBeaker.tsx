import React from 'react';

interface IconBeakerProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const IconBeaker: React.FC<IconBeakerProps> = ({ 
  size = 20, 
  className = '',
  strokeWidth = 1.5 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: 'translateY(-1px)' }} // Raise it slightly to align with text
    >
      {/* Erlenmeyer Flask Shape */}
      {/* Top neck opening */}
      <line x1="9" y1="2" x2="9" y2="8" />
      <line x1="15" y1="2" x2="15" y2="8" />
      <line x1="9" y1="2" x2="15" y2="2" />
      
      {/* Flask body - tapered from neck to wide base */}
      <path d="M 9 8 L 5 18 C 4.5 19.5 5.5 22 7 22 L 17 22 C 18.5 22 19.5 19.5 19 18 L 15 8" />
      
      {/* Optional: liquid level indicator line */}
      <path d="M 7 16 L 17 16" strokeWidth={strokeWidth * 0.8} opacity="0.6" />
    </svg>
  );
};

export default IconBeaker;
