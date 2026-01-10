'use client';

import { ReactNode, useMemo } from 'react';
import { useAuth } from '@/lib/authContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import LoginPage from '@/components/LoginPage';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const device = useDeviceDetection();

  const starPositions = useMemo(() =>
    [...Array(3)].map(() => ({
      top: `${Math.random() * 50}%`,
      right: `${Math.random() * 50}%`,
      delay: `${Math.random() * 3}s`,
    })), []
  );

  if (authLoading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="full-screen flex overflow-hidden">
      <div className="space-bg">
        <div className="stars" />
        {starPositions.map((pos, i) => (
          <div key={i} className="shooting-star" style={{ top: pos.top, right: pos.right, animationDelay: pos.delay }} />
        ))}
      </div>
      {children}
    </div>
  );
}
