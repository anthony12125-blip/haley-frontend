/**
 * OS State API - Client for persisting HaleyOS state
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface HaleyProcess {
  pid: string;
  moduleId: string;
  state: 'running' | 'suspended' | 'background';
  context: {
    formState?: Record<string, unknown>;
    scrollPosition?: number;
    moduleData?: Record<string, unknown>;
    unsavedChanges?: boolean;
  };
  spawnedAt: number;
  lastActiveAt: number;
  priority: 'system' | 'user' | 'background';
}

export interface OSState {
  version?: number;
  processes: Record<string, HaleyProcess>;
  foregroundPid: string | null;
  navHistory: string[];
  currentConversationId: string | null;
  activeModel: string | null;
  sidebarOpen: boolean;
  dashboardOpen: boolean;
  moduleStates: Record<string, unknown>;
}

/**
 * Save OS state to backend
 */
export async function saveOSState(userId: string, state: OSState): Promise<{ status: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/os/state/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });

    if (!response.ok) {
      throw new Error(`Failed to save state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[osStateApi] Save failed:', error);
    throw error;
  }
}

/**
 * Load OS state from backend
 */
export async function loadOSState(userId: string): Promise<OSState> {
  try {
    const response = await fetch(`${BACKEND_URL}/os/state/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[osStateApi] Load failed:', error);
    throw error;
  }
}

/**
 * Reset OS state (delete from backend)
 */
export async function resetOSState(userId: string): Promise<{ status: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/os/state/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to reset state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[osStateApi] Reset failed:', error);
    throw error;
  }
}

/**
 * Save state using sendBeacon (for beforeunload)
 * Returns true if beacon was queued successfully
 */
export function saveOSStateBeacon(userId: string, state: OSState): boolean {
  try {
    const url = `${BACKEND_URL}/os/state/${userId}`;
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  } catch (error) {
    console.error('[osStateApi] Beacon save failed:', error);
    return false;
  }
}
