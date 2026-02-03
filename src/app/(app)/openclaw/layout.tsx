'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';

export default function OpenClawLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const device = useDeviceDetection();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize sidebar state from localStorage, with desktop default
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haley_sidebarCollapsed', JSON.stringify(!sidebarOpen));
    }
  }, [sidebarOpen]);

  return (
    <>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSignOut={signOut}
        onNewConversation={() => router.push('/')}
        onRecoverChat={() => {}}
        onSelectModule={(moduleId) => {
          if (moduleId === null) router.push('/');
        }}
        onOpenDashboard={() => router.push('/')}
        userName={user?.displayName || undefined}
        userEmail={user?.email || undefined}
        userPhotoURL={user?.photoURL || undefined}
      />

      <div
        className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          device.type === 'desktop'
            ? (sidebarOpen ? 'ml-80' : 'ml-[60px]')
            : 'ml-0'
        }`}
      >
        <ChatHeader
          aiMode="single"
          activeModels={['Haley']}
          activeModel={null}
          onToggleResearch={() => {}}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenMagicWindow={() => {}}
          systemStatus={null}
          researchEnabled={false}
          logicEngineEnabled={false}
          onToggleLogicEngine={() => {}}
          activeModule="openclaw"
          onBack={() => router.push('/')}
          onGoHome={() => router.push('/')}
          canGoBack={true}
        />

        {children}
      </div>
    </>
  );
}
