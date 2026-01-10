'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import Sidebar from '@/components/Sidebar';
import LoginPage from '@/components/LoginPage';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const device = useDeviceDetection();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('haley_sidebarCollapsed');
      if (savedState !== null) {
        const isCollapsed = JSON.parse(savedState);
        setSidebarOpen(!isCollapsed);
      } else if (device.type === 'desktop') {
        setSidebarOpen(true);
      }
    }
  }, [device.type]);

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_sidebarCollapsed', JSON.stringify(!sidebarOpen));
    }
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Show loading state
  if (authLoading) {
    return (
      <div className="full-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="full-screen flex overflow-hidden">
      {/* Space Background */}
      <div className="space-bg">
        <div className="stars" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shooting-star"
            style={{
              top: `${Math.random() * 50}%`,
              right: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        onToggle={toggleSidebar}
        onSignOut={signOut}
        conversations={[]}
        currentConversationId={undefined}
        onNewConversation={() => {}}
        onSelectConversation={() => {}}
        onDeleteConversation={() => {}}
        activeModel={null}
        onSelectModel={() => {}}
        userName={user.displayName || undefined}
        userEmail={user.email || undefined}
        userPhotoURL={user.photoURL || undefined}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          device.type === 'desktop'
            ? (sidebarOpen ? 'ml-80' : 'ml-[60px]')
            : 'ml-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
