'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getVibePack, VIBE_PACKS, type VibePack } from '@/lib/vibePacks';

interface VibePackContextType {
  currentPack: VibePack;
  setVibePackId: (id: string) => void;
}

const VibePackContext = createContext<VibePackContextType | undefined>(undefined);

export function VibePackProvider({ children }: { children: ReactNode }) {
  const [vibePackId, setVibePackId] = useState<string>('default');
  const [currentPack, setCurrentPack] = useState<VibePack>(VIBE_PACKS[0]);

  // Load saved vibe pack from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('haley_vibe_pack');
    if (saved) {
      setVibePackId(saved);
      setCurrentPack(getVibePack(saved));
    }
  }, []);

  // Listen for LLM-native vibe pack changes from Sidebar
  useEffect(() => {
    const handleVibePackChange = (event: CustomEvent) => {
      const modelId = event.detail;
      if (modelId) {
        setCurrentPack(getVibePack(modelId));

        // Apply CSS variables to document root
        const pack = getVibePack(modelId);
        if (pack.colors) {
          const root = document.documentElement;
          root.style.setProperty('--primary', pack.colors.primary);
          root.style.setProperty('--accent', pack.colors.accent);
          root.style.setProperty('--panel-dark', pack.colors.panelDark);
          root.style.setProperty('--panel-medium', pack.colors.panelMedium);
          root.style.setProperty('--panel-light', pack.colors.panelLight);
          root.style.setProperty('--text-primary', pack.colors.textPrimary);
          root.style.setProperty('--text-secondary', pack.colors.textSecondary);
          root.style.setProperty('--border', pack.colors.border);
          root.style.setProperty('--error', pack.colors.error);
          root.style.setProperty('--success', pack.colors.success);
          if (pack.background) {
            root.style.setProperty('--background', pack.background);
          }
        }
      }
    };

    window.addEventListener('vibePackChange', handleVibePackChange as EventListener);
    return () => {
      window.removeEventListener('vibePackChange', handleVibePackChange as EventListener);
    };
  }, []);

  const handleSetVibePackId = (id: string) => {
    setVibePackId(id);
    setCurrentPack(getVibePack(id));
    localStorage.setItem('haley_vibe_pack', id);
  };

  return (
    <VibePackContext.Provider value={{ currentPack, setVibePackId: handleSetVibePackId }}>
      {children}
    </VibePackContext.Provider>
  );
}

export function useVibePack() {
  const context = useContext(VibePackContext);
  if (!context) {
    throw new Error('useVibePack must be used within VibePackProvider');
  }
  return context;
}
