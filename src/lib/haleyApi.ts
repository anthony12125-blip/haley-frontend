// src/lib/haleyApi.ts
// UPDATED: Supreme Court + Dragon Awakening support

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

export interface CourtCase {
  intent: string;
  user_id: string;
  payload?: any;
  permissions?: string[];
}

export interface CourtRuling {
  court: string;
  case: CourtCase;
  ruling: {
    ruling: 'affirm' | 'deny' | 'abstain';
    reasoning: string;
    confidence: number;
    votes: any[];
    dragon_invoked: boolean;
  };
  status: string;
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
        user_id: 'user',
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
    
    return {
      status: data.status,
      result: data.result,
      state_changed: false,
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
 * Get system status - UPDATED for Dragon status
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
    
    // Map backend response with Dragon status
    // Backend now returns: dragon: {state, mode, total_awakenings, ...}
    const dragonStatus = data.dragon || {};
    
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: data.requests_processed || 0,
        mama_invocations: dragonStatus.total_awakenings || 0,  // Dragon awakenings
        mama_state: dragonStatus.state || 'dormant',  // Dragon state
        processes: 1,
        modules: data.modules_registered || 0,
        memory_keys: data.state_size || 0
      },
      baby_pid: 1001,
      note: 'Operating System Interface'
    };
  } catch (error) {
    console.error('[HaleyAPI] Status check error:', error);
    return {
      os: 'HaleyOS',
      kernel_status: {
        kernel: 'Logic Engine',
        syscalls: 0,
        mama_invocations: 0,
        mama_state: 'dormant',
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
 * Submit case to Supreme Court
 * Seven Justices deliberate, Dragon may awaken
 */
export async function submitToSupremeCourt(caseData: CourtCase): Promise<CourtRuling> {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/court/rule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseData),
    });

    if (!response.ok) {
      throw new Error(`Court ruling failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Court error:', error);
    throw error;
  }
}

/**
 * Get Supreme Court status
 */
export async function getCourtStatus() {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/court/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Court status failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Court status error:', error);
    throw error;
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
 * Wake Mama Haley (legacy - now handled by Supreme Court)
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
