// src/lib/haleyApi.ts
// CORRECTED: Calls HaleyOS API (OS endpoints, not chat endpoints)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// ============================================================================
// OS API TYPES
// ============================================================================

export interface OSOperationRequest {
  operation: string;
  params: {
    [key: string]: any;
  };
}

export interface OSOperationResponse {
  status: 'success' | 'error';
  result?: any;
  state_changed?: boolean;
  error_code?: number;
  error_msg?: string;
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

export interface OSInfo {
  system: string;
  type: string;
  kernel: string;
  version: string;
  architecture: {
    kernel: string;
    mama: string;
    baby: string;
    modules: string;
    sentinels: string;
    adapters: string;
  };
  api: {
    [key: string]: string;
  };
}

// ============================================================================
// OS API FUNCTIONS
// ============================================================================

/**
 * Send user message via Baby interface
 * Baby converts message to OS operation and makes syscall to kernel
 */
export async function sendMessage(message: string): Promise<OSOperationResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/operation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'compute',
        params: {
          problem: message,
          context: {}
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`OS operation failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Error:', error);
    throw error;
  }
}

/**
 * Execute module via Baby interface
 */
export async function executeModule(
  module: string,
  operation: string,
  params: any
): Promise<OSOperationResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/operation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'exec',
        params: {
          module,
          op: operation,
          params
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Module execution failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Module execution error:', error);
    throw error;
  }
}

/**
 * Query system registry
 */
export async function queryRegistry(query: string = '*'): Promise<OSOperationResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/operation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'query_registry',
        params: { query }
      }),
    });

    if (!response.ok) {
      throw new Error(`Registry query failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Registry query error:', error);
    throw error;
  }
}

/**
 * Call LLM via adapter (adapter will request prompt from Mama)
 */
export async function callLLM(
  llm: 'claude' | 'gpt' | 'gemini',
  input: string,
  mode: string = 'default'
): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        llm,
        input,
        mode
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] LLM call error:', error);
    throw error;
  }
}

/**
 * Get OS status
 */
export async function getSystemStatus(): Promise<SystemStatusResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/status`, {
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
 * Get OS information
 */
export async function getOSInfo(): Promise<OSInfo> {
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
 * Make direct system call (advanced)
 */
export async function makeSyscall(
  syscall: string,
  pid: number,
  args: any,
  context: any = {}
): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/syscall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        syscall,
        pid,
        args,
        context
      }),
    });

    if (!response.ok) {
      throw new Error(`Syscall failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[HaleyAPI] Syscall error:', error);
    throw error;
  }
}

export { BACKEND_URL };
