'use client';

// Force dynamic rendering to prevent Firebase initialization during build
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to /chat
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/chat');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gradient mb-4">Haley OS</div>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login page
  return <LoginPage />;
}
