// src/lib/haleyApi.ts
// HaleyOS Backend API Integration

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ============================================================================
// BACKEND API TYPES
// ============================================================================

export interface ProcessRequest {
  intent: string;
  user_id: string;
  payload?: {
    [key: string]: any;
  };
  permissions?: string[];
  mode?: string;
}

export interface ProcessResponse {
  status: 'success' | 'error' | 'completed';
  result?: any;
  error?: string;
  module_generated?: boolean;
  execution_path?: string[];
}

export interface SystemStatusResponse {
  os: string;
  kernel_status: {
    kernel: string;
    syscalls: number;
    processes: number;
    modules: number;
    memory_keys: number;
  };
  baby_pid: number;
  note: string;
}

export interface OSOperationResponse {
  status: 'success' | 'error' | 'completed';
  result?: any;
  state_changed?: boolean;
  error_code?: number;
  error_msg?: string;
  baby_invoked?: boolean;
  model_used?: string;
  task?: string;
  operation?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Send user message - Routes to specified AI provider or Baby Haley
 */
export async function sendMessage(message: string, provider?: string | null): Promise<OSOperationResponse> {
  try {
    const requestPayload: ProcessRequest = {
      intent: 'chat.message',
      user_id: 'user',
      payload: {
        message: message,
        ...(provider && { provider: provider })
      },
      permissions: ['user'],
      mode: 'auto'
    };
    
    const response = await fetch(`${BACKEND_URL}/logic/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data: ProcessResponse = await response.json();
    
    return {
      status: data.status,
      result: data.result,
      state_changed: false,
      error_msg: data.error,
      baby_invoked: data.result?.baby_invoked || false,
      model_used: data.result?.model_used || provider || 'unknown',
      task: data.result?.task || 'general',
      operation: 'chat'
    };
  } catch (error) {
    console.error('[HaleyAPI] Error:', error);
    throw error;
  }
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<SystemStatusResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/system/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: data.requests_processed || 0,
        processes: 1,
        modules: data.modules_registered || 0,
        memory_keys: data.state_size || 0
      },
      baby_pid: 1001,
      note: 'Multi-LLM Router Active'
    };
  } catch (error) {
    console.error('[HaleyAPI] Status check error:', error);
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: 0,
        processes: 1,
        modules: 0,
        memory_keys: 0
      },
      baby_pid: 1001,
      note: 'Multi-LLM Router Active'
    };
  }
}

export { BACKEND_URL };
