import React from 'react';

interface IconEnvelopeWingsProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const IconEnvelopeWings: React.FC<IconEnvelopeWingsProps> = ({
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
    >
      {/* Envelope body */}
      <rect x="6" y="8" width="12" height="9" rx="1" />

      {/* Envelope flap */}
      <path d="M 6 8 L 12 13 L 18 8" />

      {/* Left wing */}
      <path d="M 6 10 Q 2 9 1 12 Q 2 11 6 12" fill="currentColor" opacity="0.3" />

      {/* Right wing */}
      <path d="M 18 10 Q 22 9 23 12 Q 22 11 18 12" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

export default IconEnvelopeWings;
