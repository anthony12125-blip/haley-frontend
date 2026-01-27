/**
 * HaleyOS VM API Client
 * Frontend API client for VM infrastructure
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ==================== Types ====================

export interface VMTemplate {
  name: string;
  vcpus: number;
  memory_gb: number;
  has_gpu: boolean;
  gpu_type: string | null;
  cost_per_hour: number;
  tokens_per_minute: number;
  description: string;
  preinstalled_apps: string[];
}

export interface CreateSessionRequest {
  user_id: string;
  module_id: string;
  template_name?: string;
  applications?: string[];
  idle_timeout_minutes?: number;
  zone?: string;
}

export interface VMSession {
  session_id: string;
  status: 'creating' | 'provisioning' | 'starting' | 'ready' | 'active' | 'idle' | 'stopping' | 'stopped' | 'error' | 'terminated';
  user_id: string;
  module_id: string;
  template_name: string;
  vm_name: string | null;
  external_ip: string | null;
  stream_url: string | null;
  stream_token?: string;
  created_at: string | null;
  started_at: string | null;
  last_activity: string | null;
  expires_at: string | null;
  tokens_consumed: number;
  error_message?: string;
}

export interface GuidanceStep {
  step_number: number;
  instruction: string;
  target_element: string | null;
  target_bounds: { x: number; y: number; width: number; height: number } | null;
  action_type: string;
  completed: boolean;
}

export interface GuidanceState {
  session_id: string;
  mode: 'passive' | 'active' | 'tutorial' | 'expert';
  user_goal: string | null;
  current_workflow: string | null;
  current_step: GuidanceStep | null;
  total_steps: number;
  step_number: number;
  last_analysis: any | null;
  paused: boolean;
}

// ==================== API Functions ====================

/**
 * Create a new VM session
 */
export async function createVMSession(request: CreateSessionRequest): Promise<VMSession> {
  const response = await fetch(`${BACKEND_URL}/vm/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create session');
  }
  
  return response.json();
}

/**
 * Get session status
 */
export async function getVMSession(sessionId: string): Promise<VMSession> {
  const response = await fetch(`${BACKEND_URL}/vm/sessions/${sessionId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get session');
  }
  
  return response.json();
}

/**
 * Poll for session to be ready
 */
export async function waitForSession(
  sessionId: string,
  timeoutMs: number = 120000,
  pollIntervalMs: number = 2000
): Promise<VMSession> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const session = await getVMSession(sessionId);
    
    if (session.status === 'ready' || session.status === 'active') {
      return session;
    }
    
    if (session.status === 'error' || session.status === 'terminated') {
      throw new Error(session.error_message || `Session ${session.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error('Session timeout');
}

/**
 * Get user's active session for a module
 */
export async function getUserModuleSession(
  userId: string,
  moduleId: string
): Promise<VMSession | null> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/user/${userId}/module/${moduleId}`
  );
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.session;
}

/**
 * List all user sessions
 */
export async function listUserSessions(userId: string): Promise<VMSession[]> {
  const response = await fetch(`${BACKEND_URL}/vm/sessions/user/${userId}`);
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.sessions;
}

/**
 * Terminate a session
 */
export async function terminateSession(
  sessionId: string,
  reason: string = 'user_request'
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}?reason=${reason}`,
    { method: 'DELETE' }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to terminate session');
  }
}

/**
 * Send heartbeat to keep session alive
 */
export async function sendHeartbeat(sessionId: string): Promise<void> {
  await fetch(`${BACKEND_URL}/vm/sessions/${sessionId}/activity`, {
    method: 'POST'
  });
}

/**
 * List available VM templates
 */
export async function listTemplates(): Promise<VMTemplate[]> {
  const response = await fetch(`${BACKEND_URL}/vm/templates`);
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.templates;
}

// ==================== Navigator API ====================

/**
 * Start Navigator guidance
 */
export async function startNavigator(
  sessionId: string,
  userId: string,
  goal?: string,
  mode: string = 'active'
): Promise<void> {
  const params = new URLSearchParams({ user_id: userId, mode });
  if (goal) params.append('goal', goal);
  
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}/navigator/start?${params}`,
    { method: 'POST' }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start Navigator');
  }
}

/**
 * Stop Navigator guidance
 */
export async function stopNavigator(sessionId: string): Promise<void> {
  await fetch(`${BACKEND_URL}/vm/sessions/${sessionId}/navigator/stop`, {
    method: 'POST'
  });
}

/**
 * Set Navigator goal
 */
export async function setNavigatorGoal(
  sessionId: string,
  goal: string
): Promise<GuidanceState> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}/navigator/goal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to set goal');
  }
  
  return response.json();
}

/**
 * Get current guidance state
 */
export async function getGuidance(sessionId: string): Promise<GuidanceState> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}/navigator/guidance`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get guidance');
  }
  
  return response.json();
}

/**
 * Advance to next guidance step
 */
export async function advanceGuidance(sessionId: string): Promise<GuidanceState> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}/navigator/advance`,
    { method: 'POST' }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to advance');
  }
  
  return response.json();
}

/**
 * Ask Navigator a question
 */
export async function askNavigator(
  sessionId: string,
  question: string
): Promise<{ question: string; response: string; analysis: any }> {
  const response = await fetch(
    `${BACKEND_URL}/vm/sessions/${sessionId}/navigator/ask`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to ask Navigator');
  }
  
  return response.json();
}

// ==================== Utility Hooks ====================

/**
 * Hook for managing heartbeat
 */
export function useHeartbeat(sessionId: string | null, intervalMs: number = 30000) {
  React.useEffect(() => {
    if (!sessionId) return;
    
    const interval = setInterval(() => {
      sendHeartbeat(sessionId).catch(console.error);
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [sessionId, intervalMs]);
}

// Import React for hooks
import React from 'react';
