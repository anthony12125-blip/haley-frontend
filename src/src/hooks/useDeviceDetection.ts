// src/hooks/useDeviceDetection.ts
import { useState, useEffect } from 'react';
import type { DeviceProfile } from '@/types';

export function useDeviceDetection(): DeviceProfile {
  const [device, setDevice] = useState<DeviceProfile>({
    type: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    touchEnabled: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      let type: 'phone' | 'tablet' | 'desktop' = 'desktop';
      
      if (width <= 768) {
        type = 'phone';
      } else if (width <= 1024) {
        type = 'tablet';
      }

      setDevice({
        type,
        width,
        height,
        touchEnabled,
      });
    };

    detectDevice();

    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return device;
}
