'use client';

import { useEffect, useState } from 'react';

interface ConjureAnimationProps {
  active: boolean;
  animationType?: string;
  content?: any;
  onComplete?: () => void;
}

const ANIMATIONS = [
  'swirl_energy',
  'spark_burst',
  'light_ripple',
  'comet_trail',
  'soft_pulse',
  'portal_open',
  'nebula_flash',
  'glyph_spin',
  'fracture_light',
  'wave_expansion',
];

export default function ConjureAnimation({ 
  active, 
  animationType, 
  content, 
  onComplete 
}: ConjureAnimationProps) {
  const [animation, setAnimation] = useState('');

  useEffect(() => {
    if (active) {
      const selected = animationType || ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setAnimation(selected);

      // Auto-complete after 3 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [active, animationType, onComplete]);

  if (!active) return null;

  const getAnimationClass = () => {
    switch (animation) {
      case 'swirl_energy':
        return 'animate-spin';
      case 'spark_burst':
        return 'animate-ping';
      case 'soft_pulse':
        return 'animate-pulse-slow';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={`${getAnimationClass()} relative`}>
        {/* Central glow */}
        <div className="absolute inset-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <div className="absolute inset-0 bg-haley-primary rounded-full blur-3xl opacity-30" />
          <div className="absolute inset-4 bg-haley-accent rounded-full blur-2xl opacity-50" />
        </div>

        {/* Content */}
        {content && (
          <div className="relative z-10 glass rounded-2xl p-6 max-w-md">
            <div className="text-white text-center">
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                <pre className="text-sm overflow-auto">{JSON.stringify(content, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
