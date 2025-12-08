// src/lib/haleyApi.ts
// FIXED: Matches deployed api_enhanced.py endpoints

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ============================================================================
// BACKEND API TYPES (matches api_enhanced.py)
// ============================================================================

export interface ProcessRequest {
  intent: string;
  user_id: string;
  payload?: {
    [key: string]: any;
  };
  permissions?: string[];
}

export interface ProcessResponse {
  status: 'success' | 'error';
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
    mama_invocations: number;
    mama_state: string;
    processes: number;
    modules: number;
    memory_keys: number;
  };
  baby_pid: number;
  note: string;
}

export interface OSOperationResponse {
  status: 'success' | 'error';
  result?: any;
  state_changed?: boolean;
  error_code?: number;
  error_msg?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Send user message - routes to mama.compute intent
 */
export async function sendMessage(message: string): Promise<OSOperationResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'mama.compute',
        user_id: 'user', // TODO: Get from auth context
        payload: {
          problem: message,
          context: {}
        },
        permissions: ['user']
      } as ProcessRequest),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data: ProcessResponse = await response.json();
    
    // Convert ProcessResponse to OSOperationResponse format
    return {
      status: data.status,
      result: data.result,
      state_changed: false, // Logic engine doesn't expose this yet
      error_msg: data.error
    };
  } catch (error) {
    console.error('[HaleyAPI] Error:', error);
    throw error;
  }
}

/**
 * Execute module - routes to module execution intent
 */
export async function executeModule(
  module: string,
  operation: string,
  params: any
): Promise<OSOperationResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: `module.${module}.${operation}`,
        user_id: 'user',
        payload: params,
        permissions: ['user']
      } as ProcessRequest),
    });

    if (!response.ok) {
      throw new Error(`Module execution failed: ${response.status} ${response.statusText}`);
    }

    const data: ProcessResponse = await response.json();
    
    return {
      status: data.status,
      result: data.result,
      error_msg: data.error
    };
  } catch (error) {
    console.error('[HaleyAPI] Module execution error:', error);
    throw error;
  }
}

/**
 * Get system status - uses system.health intent
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
    
    // Map to expected format
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: data.requests_processed || 0,
        mama_invocations: data.mama_wakes || 0,
        mama_state: data.mama_state || 'halted',
        processes: 1,
        modules: data.module_count || 0,
        memory_keys: 0
      },
      baby_pid: 1001,
      note: 'Operating System Interface'
    };
  } catch (error) {
    console.error('[HaleyAPI] Status check error:', error);
    // Return default status on error
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: 0,
        mama_invocations: 0,
        mama_state: 'unknown',
        processes: 1,
        modules: 0,
        memory_keys: 0
      },
      baby_pid: 1001,
      note: 'Operating System Interface'
    };
  }
}

/**
 * Get OS information
 */
export async function getOSInfo() {
  try {
    const response = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OS info failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] OS info error:', error);
    throw error;
  }
}

/**
 * List available modules
 */
export async function listModules() {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/modules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Module list failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Module list error:', error);
    throw error;
  }
}

/**
 * Wake Mama Haley for deep computation
 */
export async function wakeMama(userId: string = 'user') {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/mama/wake?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Wake Mama failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Wake Mama error:', error);
    throw error;
  }
}

/**
 * Request module generation
 */
export async function requestModuleGeneration(
  moduleName: string,
  moduleIntent: string,
  capabilities: string[],
  requestedBy: string = 'user'
) {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/module/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module_name: moduleName,
        module_intent: moduleIntent,
        capabilities,
        requested_by: requestedBy
      }),
    });

    if (!response.ok) {
      throw new Error(`Module generation failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Module generation error:', error);
    throw error;
  }
}

/**
 * Check module generation status
 */
export async function checkModuleGenerationStatus(requestId: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/module/status/${requestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Status check error:', error);
    throw error;
  }
}

/**
 * Refresh module registry
 */
export async function refreshModules() {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/modules/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Module refresh failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Module refresh error:', error);
    throw error;
  }
}

export { BACKEND_URL };
