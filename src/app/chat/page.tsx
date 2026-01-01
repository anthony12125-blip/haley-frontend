'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /chat route - redirects to root (/)
 *
 * The main chat interface is now served at the root route (/).
 * This redirect exists for backwards compatibility with bookmarks
 * and external links that point to /chat.
 */
export default function ChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="full-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-gradient mb-4">Redirecting...</div>
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
