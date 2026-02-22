import type { Message } from '@/types';

const API_BASE = '/api';

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

/**
 * Send a message to Haley (OpenClaw)
 * Simplified version that connects directly to the OpenClaw gateway
 */
export async function sendMessage(
  message: string,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void,
  files?: File[],
  userId?: string,
  conversationId?: string,
  conversationHistory?: Message[]
): Promise<{ messageId: string; cleanup: () => void }> {
  const messageId = `msg-${Date.now()}`;
  let isCancelled = false;

  try {
    console.log('[HaleyAPI] Sending message:', message.substring(0, 50) + '...');

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId || 'default',
        user_id: userId || 'anonymous',
        attachments: [], // Simplified - no file uploads for now
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle SSE streaming
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // Read the stream
    const readStream = async () => {
      try {
        while (true) {
          if (isCancelled) break;
          
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'token') {
                onToken?.(data.token);
              } else if (data.type === 'complete') {
                onComplete?.({
                  status: 'success',
                  model_used: 'haley',
                  baby_invoked: false,
                });
                return;
              } else if (data.type === 'error') {
                onError?.(data.error);
                return;
              }
            }
          }
        }
      } catch (error) {
        if (!isCancelled) {
          onError?.(error instanceof Error ? error.message : 'Stream error');
        }
      }
    };

    readStream();

    return {
      messageId,
      cleanup: () => {
        isCancelled = true;
        reader.cancel();
      },
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HaleyAPI] Error:', errorMsg);
    onError?.(errorMsg);
    
    return {
      messageId,
      cleanup: () => {},
    };
  }
}

/**
 * Send audio message - simplified to just use text for now
 */
export async function sendAudioMessage(
  audioBlob: Blob,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void,
  userId?: string,
  conversationId?: string
): Promise<{ messageId: string; cleanup: () => void }> {
  // For now, just return a placeholder - audio can be added later
  onError?.('Audio messages not yet implemented in OpenClaw mode');
  return {
    messageId: `audio-${Date.now()}`,
    cleanup: () => {},
  };
}

/**
 * Multi-LLM not supported in OpenClaw mode
 */
export async function sendMultiLLMMessage(
  message: string,
  providers: string[],
  onToken: (provider: string, token: string) => void,
  onComplete: (provider: string, response: any) => void,
  onError: (provider: string, error: string) => void,
  files?: File[],
  conversationHistory?: Message[]
): Promise<Array<{ provider: string; cleanup: () => void }>> {
  // Multi-LLM not supported - just use regular sendMessage
  console.warn('[HaleyAPI] Multi-LLM not supported in OpenClaw mode');
  return [];
}

/**
 * Get system status - simplified
 */
export async function getSystemStatus() {
  return {
    os: 'OpenClaw',
    kernel_status: {
      kernel: 'OpenClaw Runtime',
      syscalls: 0,
      processes: 1,
      modules: 1,
      memory_keys: 0,
    },
    baby_pid: 0,
    note: 'Connected to OpenClaw gateway',
  };
}

/**
 * Conversation persistence - disabled in OpenClaw mode
 */
export async function loadAllConversations(userId: string) {
  return [];
}

export async function loadConversation(userId: string, conversationId: string) {
  return null;
}

export async function deleteConversation(userId: string, conversationId: string) {
  return;
}

export async function saveConversation(userId: string, conversationId: string, messages: Message[]) {
  return;
}