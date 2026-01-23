'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { MigrationPayload } from '@/lib/migrationEngine';

interface AIClipboardContextType {
  payload: MigrationPayload | null;
  setPayload: (payload: MigrationPayload) => void;
  clearPayload: () => void;
  lastMigrationTime: Date | null;
}

const AIClipboardContext = createContext<AIClipboardContextType | undefined>(undefined);

export function AIClipboardProvider({ children }: { children: ReactNode }) {
  const [payload, setPayloadState] = useState<MigrationPayload | null>(null);
  const [lastMigrationTime, setLastMigrationTime] = useState<Date | null>(null);

  const setPayload = (newPayload: MigrationPayload) => {
    setPayloadState(newPayload);
    setLastMigrationTime(new Date());
  };

  const clearPayload = () => {
    setPayloadState(null);
    setLastMigrationTime(null);
  };

  return (
    <AIClipboardContext.Provider
      value={{
        payload,
        setPayload,
        clearPayload,
        lastMigrationTime,
      }}
    >
      {children}
    </AIClipboardContext.Provider>
  );
}

export function useAIClipboard() {
  const context = useContext(AIClipboardContext);
  if (context === undefined) {
    throw new Error('useAIClipboard must be used within an AIClipboardProvider');
  }
  return context;
}
