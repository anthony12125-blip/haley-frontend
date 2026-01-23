'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type ProcessState =
  | 'spawning'      // Module initializing
  | 'active'        // Currently foregrounded (visible)
  | 'background'    // Running but not visible
  | 'suspended'     // Paused, minimal resource usage
  | 'zombie';       // Marked for cleanup

export type ProcessPriority =
  | 'system'        // Chat process - never killed
  | 'user'          // Normal module processes
  | 'low';          // Background tasks

export interface ProcessContext {
  formState: Record<string, any>;  // Preserved form inputs
  scrollPosition: number;          // UI scroll position
  moduleData: any;                 // Module-specific state
  unsavedChanges: boolean;         // Warn before kill if true
}

export interface HaleyProcess {
  pid: string;                    // Unique process identifier
  moduleId: string;               // Which module this is an instance of
  state: ProcessState;            // Current lifecycle state
  context: ProcessContext;        // Module's preserved working memory
  spawnedAt: number;              // Unix timestamp
  lastActiveAt: number;           // Last time process was foregrounded
  priority: ProcessPriority;      // Scheduling priority
}

interface ProcessTable {
  processes: Map<string, HaleyProcess>;
  foregroundPid: string | null;   // Currently visible process
  maxProcesses: number;           // Memory limit
}

// Reserved PIDs
export const SYSTEM_PIDS = {
  CHAT: 'pid-0-chat',             // Main chat is always PID 0
} as const;

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

interface ProcessProviderState {
  processTable: ProcessTable;

  // Lifecycle syscalls
  spawn: (moduleId: string, initialContext?: Partial<ProcessContext>) => string;
  foreground: (pid: string) => string;
  background: (pid: string) => void;
  kill: (pid: string, force?: boolean) => boolean;
  killAll: (force?: boolean) => string[];
  updateContext: (pid: string, updates: Partial<ProcessContext>) => void;

  // Navigation
  goBack: () => void;              // Go to previous screen in history
  goHome: () => void;              // Go directly to chat
  canGoBack: boolean;              // Whether there's history to go back to
  navHistory: string[];            // Stack of PIDs for back navigation

  // Query operations
  listProcesses: () => HaleyProcess[];
  getForeground: () => HaleyProcess | null;
  findProcessByModule: (moduleId: string) => HaleyProcess | null;

  // Helper to get current module ID for rendering
  activeModuleId: string | null;
}

const ProcessContext = createContext<ProcessProviderState | undefined>(undefined);

// =============================================================================
// PROVIDER IMPLEMENTATION
// =============================================================================

function generatePid(): string {
  return `pid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDefaultContext(initial?: Partial<ProcessContext>): ProcessContext {
  return {
    formState: {},
    scrollPosition: 0,
    moduleData: null,
    unsavedChanges: false,
    ...initial,
  };
}

// Create initial process table with chat as PID 0
function createInitialProcessTable(): ProcessTable {
  const chatProcess: HaleyProcess = {
    pid: SYSTEM_PIDS.CHAT,
    moduleId: 'chat',
    state: 'active',
    context: createDefaultContext(),
    spawnedAt: Date.now(),
    lastActiveAt: Date.now(),
    priority: 'system',
  };

  const processes = new Map<string, HaleyProcess>();
  processes.set(SYSTEM_PIDS.CHAT, chatProcess);

  return {
    processes,
    foregroundPid: SYSTEM_PIDS.CHAT,
    maxProcesses: 10,
  };
}

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [processTable, setProcessTable] = useState<ProcessTable>(createInitialProcessTable);
  const [navHistory, setNavHistory] = useState<string[]>([SYSTEM_PIDS.CHAT]); // Stack of PIDs

  // -------------------------------------------------------------------------
  // SYSCALL: spawn
  // -------------------------------------------------------------------------
  const spawn = useCallback((moduleId: string, initialContext?: Partial<ProcessContext>): string => {
    let resultPid = '';
    let wasExisting = false;

    setProcessTable((prev) => {
      // Check if module already running
      for (const process of prev.processes.values()) {
        if (process.moduleId === moduleId && process.state !== 'zombie') {
          // Module already running - will foreground it
          console.log('[PROCESS] spawn() - Module already running:', moduleId, 'pid:', process.pid, 'state:', process.state);
          resultPid = process.pid;
          wasExisting = true;
          return prev;
        }
      }

      // Check process limit - kill oldest suspended if at limit
      let newProcesses = new Map(prev.processes);
      if (newProcesses.size >= prev.maxProcesses) {
        const suspended = Array.from(newProcesses.values())
          .filter(p => p.state === 'suspended' && p.priority !== 'system')
          .sort((a, b) => a.lastActiveAt - b.lastActiveAt);

        if (suspended.length > 0) {
          console.log('[PROCESS] spawn() - At max processes, killing suspended:', suspended[0].pid);
          newProcesses.delete(suspended[0].pid);
        }
      }

      // Create new process
      const pid = generatePid();
      const newProcess: HaleyProcess = {
        pid,
        moduleId,
        state: 'spawning',
        context: createDefaultContext(initialContext),
        spawnedAt: Date.now(),
        lastActiveAt: Date.now(),
        priority: 'user',
      };

      newProcesses.set(pid, newProcess);
      resultPid = pid;

      console.log('[PROCESS] spawn() - Created new process:', moduleId, 'pid:', pid, 'total processes:', newProcesses.size);

      return {
        ...prev,
        processes: newProcesses,
      };
    });

    return resultPid;
  }, []);

  // -------------------------------------------------------------------------
  // SYSCALL: foreground
  // -------------------------------------------------------------------------
  const foreground = useCallback((pid: string, addToHistory: boolean = true): string => {
    console.log('[PROCESS] foreground() - Bringing to front:', pid, 'addToHistory:', addToHistory);

    setProcessTable((prev) => {
      const process = prev.processes.get(pid);
      if (!process) {
        console.log('[PROCESS] foreground() - Process not found:', pid);
        return prev;
      }

      const newProcesses = new Map(prev.processes);

      // Background current foreground process
      if (prev.foregroundPid && prev.foregroundPid !== pid) {
        const currentFg = newProcesses.get(prev.foregroundPid);
        if (currentFg && currentFg.state === 'active') {
          console.log('[PROCESS] foreground() - Auto-backgrounding current:', prev.foregroundPid, currentFg.moduleId);
          newProcesses.set(prev.foregroundPid, {
            ...currentFg,
            state: 'background',
          });
        }
      }

      // Foreground the target process
      newProcesses.set(pid, {
        ...process,
        state: 'active',
        lastActiveAt: Date.now(),
      });

      console.log('[PROCESS] foreground() - Now active:', pid, process.moduleId, 'total processes:', newProcesses.size);

      return {
        ...prev,
        processes: newProcesses,
        foregroundPid: pid,
      };
    });

    // Add to navigation history (unless going back)
    if (addToHistory) {
      setNavHistory((prev) => {
        // Don't add duplicate if already at top
        if (prev[prev.length - 1] === pid) return prev;
        console.log('[PROCESS] foreground() - Adding to history:', pid, 'history length:', prev.length + 1);
        return [...prev, pid];
      });
    }

    return pid;
  }, []);

  // -------------------------------------------------------------------------
  // SYSCALL: background
  // -------------------------------------------------------------------------
  const background = useCallback((pid: string): void => {
    console.log('[PROCESS] background() - Sending to background:', pid);

    setProcessTable((prev) => {
      const process = prev.processes.get(pid);
      if (!process) {
        console.log('[PROCESS] background() - Process not found:', pid);
        return prev;
      }
      if (process.state !== 'active') {
        console.log('[PROCESS] background() - Process not active, state:', process.state);
        return prev;
      }

      const newProcesses = new Map(prev.processes);
      newProcesses.set(pid, {
        ...process,
        state: 'background',
      });

      console.log('[PROCESS] background() - Now backgrounded:', pid, process.moduleId);

      return {
        ...prev,
        processes: newProcesses,
      };
    });
  }, []);

  // -------------------------------------------------------------------------
  // NAVIGATION: goBack
  // -------------------------------------------------------------------------
  const goBack = useCallback((): void => {
    console.log('[PROCESS] goBack() - Current history:', navHistory);

    if (navHistory.length <= 1) {
      console.log('[PROCESS] goBack() - No history to go back to');
      return;
    }

    // Pop current from history
    const newHistory = [...navHistory];
    const currentPid = newHistory.pop();
    const previousPid = newHistory[newHistory.length - 1];

    console.log('[PROCESS] goBack() - Going from', currentPid, 'to', previousPid);

    // Update history
    setNavHistory(newHistory);

    // Background current and foreground previous (without adding to history)
    if (currentPid) {
      setProcessTable((prev) => {
        const currentProcess = prev.processes.get(currentPid);
        const previousProcess = prev.processes.get(previousPid);

        if (!previousProcess) {
          console.log('[PROCESS] goBack() - Previous process not found, going to chat');
          // Fallback to chat
          const chatProcess = prev.processes.get(SYSTEM_PIDS.CHAT);
          if (!chatProcess) return prev;

          const newProcesses = new Map(prev.processes);
          if (currentProcess && currentProcess.state === 'active') {
            newProcesses.set(currentPid, { ...currentProcess, state: 'background' });
          }
          newProcesses.set(SYSTEM_PIDS.CHAT, { ...chatProcess, state: 'active', lastActiveAt: Date.now() });

          return { ...prev, processes: newProcesses, foregroundPid: SYSTEM_PIDS.CHAT };
        }

        const newProcesses = new Map(prev.processes);

        // Background current
        if (currentProcess && currentProcess.state === 'active') {
          newProcesses.set(currentPid, { ...currentProcess, state: 'background' });
        }

        // Foreground previous
        newProcesses.set(previousPid, { ...previousProcess, state: 'active', lastActiveAt: Date.now() });

        return { ...prev, processes: newProcesses, foregroundPid: previousPid };
      });
    }
  }, [navHistory]);

  // -------------------------------------------------------------------------
  // NAVIGATION: goHome
  // -------------------------------------------------------------------------
  const goHome = useCallback((): void => {
    console.log('[PROCESS] goHome() - Going to chat');

    // Background current foreground
    setProcessTable((prev) => {
      if (prev.foregroundPid === SYSTEM_PIDS.CHAT) {
        console.log('[PROCESS] goHome() - Already at chat');
        return prev;
      }

      const newProcesses = new Map(prev.processes);

      // Background current
      if (prev.foregroundPid) {
        const currentProcess = newProcesses.get(prev.foregroundPid);
        if (currentProcess && currentProcess.state === 'active') {
          newProcesses.set(prev.foregroundPid, { ...currentProcess, state: 'background' });
        }
      }

      // Foreground chat
      const chatProcess = newProcesses.get(SYSTEM_PIDS.CHAT);
      if (chatProcess) {
        newProcesses.set(SYSTEM_PIDS.CHAT, { ...chatProcess, state: 'active', lastActiveAt: Date.now() });
      }

      return { ...prev, processes: newProcesses, foregroundPid: SYSTEM_PIDS.CHAT };
    });

    // Add chat to history
    setNavHistory((prev) => {
      if (prev[prev.length - 1] === SYSTEM_PIDS.CHAT) return prev;
      return [...prev, SYSTEM_PIDS.CHAT];
    });
  }, []);

  // -------------------------------------------------------------------------
  // SYSCALL: kill
  // -------------------------------------------------------------------------
  const kill = useCallback((pid: string, force: boolean = false): boolean => {
    console.log('[PROCESS] kill() - Killing process:', pid, 'force:', force);
    let killed = false;

    setProcessTable((prev) => {
      const process = prev.processes.get(pid);

      if (!process) {
        console.log('[PROCESS] kill() - Process not found:', pid);
        killed = true;
        return prev;
      }

      // Prevent killing system processes
      if (process.priority === 'system') {
        console.log('[PROCESS] kill() - Cannot kill system process:', pid);
        killed = false;
        return prev;
      }

      // Check for unsaved changes
      if (process.context.unsavedChanges && !force) {
        console.log('[PROCESS] kill() - Process has unsaved changes:', pid);
        killed = false;
        return prev;
      }

      // Remove process
      const newProcesses = new Map(prev.processes);
      newProcesses.delete(pid);
      killed = true;

      console.log('[PROCESS] kill() - KILLED:', pid, process.moduleId, 'remaining processes:', newProcesses.size);

      // If this was foreground, switch to chat
      let newForegroundPid = prev.foregroundPid;
      if (prev.foregroundPid === pid) {
        newForegroundPid = SYSTEM_PIDS.CHAT;
        const chatProcess = newProcesses.get(SYSTEM_PIDS.CHAT);
        if (chatProcess) {
          newProcesses.set(SYSTEM_PIDS.CHAT, {
            ...chatProcess,
            state: 'active',
            lastActiveAt: Date.now(),
          });
        }
      }

      return {
        ...prev,
        processes: newProcesses,
        foregroundPid: newForegroundPid,
      };
    });

    return killed;
  }, []);

  // -------------------------------------------------------------------------
  // SYSCALL: killAll
  // -------------------------------------------------------------------------
  const killAll = useCallback((force: boolean = false): string[] => {
    console.log('[PROCESS] killAll() - Killing all non-system processes, force:', force);
    const killed: string[] = [];

    setProcessTable((prev) => {
      const newProcesses = new Map(prev.processes);

      for (const [pid, process] of prev.processes) {
        if (process.priority === 'system') continue;

        if (!process.context.unsavedChanges || force) {
          newProcesses.delete(pid);
          killed.push(pid);
          console.log('[PROCESS] killAll() - Killed:', pid, process.moduleId);
        }
      }

      // Ensure chat is foregrounded
      const chatProcess = newProcesses.get(SYSTEM_PIDS.CHAT);
      if (chatProcess) {
        newProcesses.set(SYSTEM_PIDS.CHAT, {
          ...chatProcess,
          state: 'active',
          lastActiveAt: Date.now(),
        });
      }

      console.log('[PROCESS] killAll() - Killed', killed.length, 'processes, remaining:', newProcesses.size);

      return {
        ...prev,
        processes: newProcesses,
        foregroundPid: SYSTEM_PIDS.CHAT,
      };
    });

    return killed;
  }, []);

  // -------------------------------------------------------------------------
  // SYSCALL: updateContext
  // -------------------------------------------------------------------------
  const updateContext = useCallback((pid: string, updates: Partial<ProcessContext>): void => {
    setProcessTable((prev) => {
      const process = prev.processes.get(pid);
      if (!process) return prev;

      const newProcesses = new Map(prev.processes);
      newProcesses.set(pid, {
        ...process,
        context: {
          ...process.context,
          ...updates,
        },
      });

      return {
        ...prev,
        processes: newProcesses,
      };
    });
  }, []);

  // -------------------------------------------------------------------------
  // QUERY: listProcesses
  // -------------------------------------------------------------------------
  const listProcesses = useCallback((): HaleyProcess[] => {
    const processes = Array.from(processTable.processes.values())
      .filter(p => p.state !== 'zombie')
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    console.log('[PROCESS] listProcesses() - Current processes:', processes.map(p => ({
      pid: p.pid.slice(0, 15),
      module: p.moduleId,
      state: p.state
    })));

    return processes;
  }, [processTable]);

  // -------------------------------------------------------------------------
  // QUERY: getForeground
  // -------------------------------------------------------------------------
  const getForeground = useCallback((): HaleyProcess | null => {
    if (!processTable.foregroundPid) return null;
    return processTable.processes.get(processTable.foregroundPid) ?? null;
  }, [processTable]);

  // -------------------------------------------------------------------------
  // QUERY: findProcessByModule
  // -------------------------------------------------------------------------
  const findProcessByModule = useCallback((moduleId: string): HaleyProcess | null => {
    for (const process of processTable.processes.values()) {
      if (process.moduleId === moduleId && process.state !== 'zombie') {
        return process;
      }
    }
    return null;
  }, [processTable]);

  // -------------------------------------------------------------------------
  // DERIVED: activeModuleId
  // -------------------------------------------------------------------------
  const activeModuleId = (() => {
    const fg = processTable.foregroundPid
      ? processTable.processes.get(processTable.foregroundPid)
      : null;

    if (!fg || fg.moduleId === 'chat') {
      return null;
    }
    return fg.moduleId;
  })();

  // -------------------------------------------------------------------------
  // DERIVED: canGoBack
  // -------------------------------------------------------------------------
  const canGoBack = navHistory.length > 1;

  // -------------------------------------------------------------------------
  // PROVIDER VALUE
  // -------------------------------------------------------------------------
  const value: ProcessProviderState = {
    processTable,
    spawn,
    foreground,
    background,
    kill,
    killAll,
    updateContext,
    goBack,
    goHome,
    canGoBack,
    navHistory,
    listProcesses,
    getForeground,
    findProcessByModule,
    activeModuleId,
  };

  return (
    <ProcessContext.Provider value={value}>
      {children}
    </ProcessContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useProcess() {
  const context = useContext(ProcessContext);
  if (context === undefined) {
    throw new Error('useProcess must be used within a ProcessProvider');
  }
  return context;
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for modules to access their own process context
 */
export function useProcessContext(pid: string) {
  const { processTable, updateContext } = useProcess();
  const process = processTable.processes.get(pid);

  const markDirty = useCallback(() => {
    updateContext(pid, { unsavedChanges: true });
  }, [pid, updateContext]);

  const markClean = useCallback(() => {
    updateContext(pid, { unsavedChanges: false });
  }, [pid, updateContext]);

  const setModuleData = useCallback((data: any) => {
    updateContext(pid, { moduleData: data });
  }, [pid, updateContext]);

  const setFormState = useCallback((formState: Record<string, any>) => {
    updateContext(pid, { formState });
  }, [pid, updateContext]);

  const setScrollPosition = useCallback((scrollPosition: number) => {
    updateContext(pid, { scrollPosition });
  }, [pid, updateContext]);

  return {
    context: process?.context ?? null,
    markDirty,
    markClean,
    setModuleData,
    setFormState,
    setScrollPosition,
  };
}
