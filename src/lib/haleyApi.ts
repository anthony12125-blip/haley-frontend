// src/lib/haleyApi.ts
// Haley OS Backend API Integration
// FIXED: Removed Claude hard default - model selection now enforced

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
 * Send user message - Routes to specified AI provider
 * 
 * CRITICAL FIX: No default provider fallback
 * - Provider MUST be specified by caller
 * - This ensures UI model selection is always respected
 * - Throws error if provider is missing
 */
export async function sendMessage(message: string, provider?: string | null): Promise<OSOperationResponse> {
  try {
    // CRITICAL: Validate provider is specified
    if (!provider) {
      console.error('[API] ❌ FATAL: No provider specified');
      throw new Error('Provider must be specified - no model selected');
    }
    
    console.log('[API] ====== SEND MESSAGE ======');
    console.log('[API] Provider:', provider);
    console.log('[API] Message length:', message.length);
    
    const requestPayload: ProcessRequest = {
      intent: 'chat.message',
      user_id: 'user',
      payload: {
        message: message,
        provider: provider  // ALWAYS include provider, validated above
      },
      permissions: ['user'],
      mode: 'auto'
    };
    
    console.log('[API] Full request payload:', JSON.stringify(requestPayload, null, 2));
    
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
    
    console.log('[API] Response received from:', data.result?.model_used || provider);
    console.log('[API] ============================');
    
    return {
      status: data.status,
      result: data.result,
      state_changed: false,
      error_msg: data.error,
      baby_invoked: data.result?.baby_invoked || false,
      model_used: data.result?.model_used || provider,
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
      os: 'Haley OS',
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
      os: 'Haley OS',
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
