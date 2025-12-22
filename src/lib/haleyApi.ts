// src/lib/haleyApi.ts
// Haley OS Backend API Integration
// ASYNC VERSION: Non-blocking message submission with streaming

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
// ASYNC API FUNCTIONS
// ============================================================================

/**
 * Send user message - ASYNC VERSION
 * Returns immediately, streams response via callback
 * 
 * @param message - User message text
 * @param provider - AI provider to use
 * @param onToken - Callback for streaming tokens
 * @param onComplete - Callback when streaming completes
 * @param onError - Callback for errors
 */
export async function sendMessage(
  message: string, 
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void
): Promise<{ messageId: string }> {
  try {
    // Validate provider
    if (!provider) {
      const error = 'Provider must be specified - no model selected';
      console.error('[API] ❌ FATAL:', error);
      onError?.(error);
      throw new Error(error);
    }
    
    console.log('[API] ====== ASYNC SEND MESSAGE ======');
    console.log('[API] Provider:', provider);
    console.log('[API] Message length:', message.length);
    
    // Step 1: Submit message (returns immediately)
    const submitResponse = await fetch(`${BACKEND_URL}/chat/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: 'default', // TODO: Use actual conversation ID
        user_id: 'user',
        message: message,
        provider: provider,
        mode: 'auto'
      }),
    });

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status} ${submitResponse.statusText}`);
    }

    const { assistant_message_id } = await submitResponse.json();
    console.log('[API] Message submitted, ID:', assistant_message_id);
    
    // Step 2: Connect to streaming endpoint (non-blocking)
    const eventSource = new EventSource(
      `${BACKEND_URL}/chat/stream/${assistant_message_id}`
    );
    
    let fullResponse = '';
    let metadata: any = {};
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'token') {
          fullResponse += data.content;
          onToken?.(data.content);
        } else if (data.type === 'done') {
          metadata = data.metadata || {};
          console.log('[API] Stream complete');
          eventSource.close();
          
          // Call completion callback
          onComplete?.({
            status: 'completed',
            result: {
              response: fullResponse,
              ...metadata
            },
            model_used: provider,
            task: metadata.task || 'general',
            operation: 'chat',
            baby_invoked: metadata.baby_invoked || false
          });
        } else if (data.type === 'error') {
          console.error('[API] Stream error:', data.error);
          eventSource.close();
          onError?.(data.error);
        }
      } catch (error) {
        console.error('[API] Parse error:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('[API] EventSource error:', error);
      eventSource.close();
      onError?.('Connection lost');
    };
    
    console.log('[API] ============================');
    
    return { messageId: assistant_message_id };
    
  } catch (error) {
    console.error('[HaleyAPI] Error:', error);
    onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Legacy synchronous version (for backward compatibility)
 * Uses old blocking endpoint
 */
export async function sendMessageSync(message: string, provider?: string | null): Promise<OSOperationResponse> {
  try {
    if (!provider) {
      console.error('[API] ❌ FATAL: No provider specified');
      throw new Error('Provider must be specified - no model selected');
    }
    
    const requestPayload: ProcessRequest = {
      intent: 'chat.message',
      user_id: 'user',
      payload: {
        message: message,
        provider: provider
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
