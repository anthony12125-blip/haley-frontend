const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface ProcessRequest {
  intent: string;
  user_id: string;
  payload?: { [key: string]: any };
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

export async function sendMessage(
  message: string,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void,
  files?: File[]
): Promise<{ messageId: string; cleanup: () => void }> {
  let eventSource: EventSource | null = null;

  try {
    if (!provider) {
      const error = 'Provider must be specified - no model selected';
      onError?.(error);
      throw new Error(error);
    }

    let submitResponse: Response;

    try {
      // Convert files to Base64 if present
      if (files && files.length > 0) {
        // Helper function to convert File to Base64
        const fileToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix (e.g., "data:image/png;base64,")
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = (error) => reject(error);
          });
        };

        // Convert all files to Base64
        const attachments = await Promise.all(
          files.map(async (file, index) => {
            const base64Data = await fileToBase64(file);
            return {
              filename: file.name,
              data: base64Data,
              contentType: file.type || 'application/octet-stream'
            };
          })
        );

        // Send JSON with Base64 attachments
        submitResponse = await fetch(`${BACKEND_URL}/chat/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: 'default',
            user_id: 'user',
            message: message,
            provider: provider,
            attachments: attachments
          }),
        });
      } else {
        submitResponse = await fetch(`${BACKEND_URL}/chat/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: 'default',
            user_id: 'user',
            message: message,
            provider: provider
          }),
        });
      }
    } catch (fetchError) {
      throw fetchError;
    }

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const responseData = await submitResponse.json();
    const { assistant_message_id } = responseData;

    const streamUrl = `${BACKEND_URL}/chat/stream/${assistant_message_id}`;

    eventSource = new EventSource(streamUrl);

    let fullResponse = '';
    let metadata: any = {};

    eventSource.onopen = () => {
      console.log('[STREAM] ✅ EventSource connected to:', streamUrl);
    };

    eventSource.onmessage = (event) => {
      console.log('[STREAM] 📨 Received SSE event:', event.data);

      try {
        const data = JSON.parse(event.data);
        console.log('[STREAM] 📦 Parsed data:', data);

        if (data.type === 'token') {
          console.log('[STREAM] 🔥 Token received:', data.content?.substring(0, 50));
          fullResponse += data.content;
          onToken?.(data.content);
        } else if (data.type === 'done') {
          console.log('[STREAM] ✅ Done event received, fullResponse length:', fullResponse.length);
          metadata = data.metadata || {};

          // Extract final response from done event (backend may send complete text)
          const finalResponse = data.result?.response || data.response || fullResponse;

          // If final response differs from accumulated response, send final token update
          if (finalResponse && finalResponse !== fullResponse && finalResponse.length > fullResponse.length) {
            const remainingContent = finalResponse.substring(fullResponse.length);
            console.log('[STREAM] 📝 Emitting remaining content:', remainingContent.length, 'chars');
            onToken?.(remainingContent);
            fullResponse = finalResponse;
          }

          console.log('[STREAM] 🏁 Closing stream, final response length:', fullResponse.length);
          eventSource?.close();
          onComplete?.({
            status: 'completed',
            result: { response: fullResponse, ...metadata },
            model_used: provider,
            task: metadata.task || 'general',
            operation: 'chat',
            baby_invoked: metadata.baby_invoked || false
          });
        } else if (data.type === 'error') {
          console.error('[STREAM] ❌ Error event received:', data.error);
          eventSource?.close();
          onError?.(data.error);
        } else if (data.type === 'status') {
          console.log('[STREAM] 📊 Status event:', data.status);
          // Status update
        } else {
          console.warn('[STREAM] ⚠️ Unknown event type:', data.type, data);
        }
      } catch (error) {
        console.error('[STREAM] ❌ Parse error:', error, 'Raw data:', event.data);
        onError?.(`Failed to parse stream data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        eventSource?.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('[STREAM] ❌ EventSource error:', error);
      console.error('[STREAM] EventSource readyState:', eventSource?.readyState);
      eventSource?.close();
      onError?.(`Connection error - stream readyState: ${eventSource?.readyState}`);
    };

    const cleanup = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    return { messageId: assistant_message_id, cleanup };

  } catch (error) {
    console.error('[HaleyAPI] Error:', error);
    if (eventSource) eventSource.close();
    onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Send the same message to multiple LLM providers in parallel
 * Returns handlers for each provider's stream
 */
export async function sendMultiLLMMessage(
  message: string,
  providers: string[],
  onProviderToken?: (provider: string, token: string) => void,
  onProviderComplete?: (provider: string, response: OSOperationResponse) => void,
  onProviderError?: (provider: string, error: string) => void,
  files?: File[]
): Promise<Array<{ provider: string; messageId: string; cleanup: () => void }>> {
  const streams = await Promise.all(
    providers.map(async (provider) => {
      try {
        const { messageId, cleanup } = await sendMessage(
          message,
          provider,
          (token) => onProviderToken?.(provider, token),
          (response) => onProviderComplete?.(provider, response),
          (error) => onProviderError?.(provider, error),
          files
        );

        return { provider, messageId, cleanup };
      } catch (error) {
        onProviderError?.(provider, error instanceof Error ? error.message : 'Failed to start stream');
        return { provider, messageId: '', cleanup: () => {} };
      }
    })
  );

  return streams;
}

export async function sendAudioMessage(
  audioBlob: Blob,
  provider?: string | null,
  onToken?: (token: string) => void,
  onComplete?: (response: OSOperationResponse) => void,
  onError?: (error: string) => void
): Promise<{ messageId: string; transcript?: string; cleanup: () => void }> {
  let eventSource: EventSource | null = null;

  try {
    if (!provider) {
      const error = 'Provider must be specified - no model selected';
      onError?.(error);
      throw new Error(error);
    }

    // Create form data with audio file
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'voice_message.webm');

    // conversation_id and provider go in URL query params, not form body
    const audioUrl = `${BACKEND_URL}/chat/submit/audio?conversation_id=default&provider=${provider}`;

    const submitResponse = await fetch(audioUrl, {
      method: 'POST',
      body: formData,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`Audio submit failed: ${submitResponse.status} - ${errorText}`);
    }

    const responseData = await submitResponse.json();
    const { assistant_message_id, transcript } = responseData;

    eventSource = new EventSource(`${BACKEND_URL}/chat/stream/${assistant_message_id}`);

    let fullResponse = '';
    let metadata: any = {};

    eventSource.onmessage = (event) => {
      console.log('[AUDIO-STREAM] 📨 Received SSE event:', event.data);

      try {
        const data = JSON.parse(event.data);
        console.log('[AUDIO-STREAM] 📦 Parsed data:', data);

        if (data.type === 'token') {
          console.log('[AUDIO-STREAM] 🔥 Token received');
          fullResponse += data.content;
          onToken?.(data.content);
        } else if (data.type === 'done') {
          console.log('[AUDIO-STREAM] ✅ Done event, length:', fullResponse.length);
          metadata = data.metadata || {};
          eventSource?.close();
          onComplete?.({
            status: 'completed',
            result: { response: fullResponse, ...metadata },
            model_used: provider,
            task: metadata.task || 'general',
            operation: 'chat',
            baby_invoked: metadata.baby_invoked || false
          });
        } else if (data.type === 'error') {
          console.error('[AUDIO-STREAM] ❌ Error event:', data.error);
          eventSource?.close();
          onError?.(data.error);
        }
      } catch (error) {
        console.error('[AUDIO-STREAM] ❌ Parse error:', error, 'Raw data:', event.data);
        onError?.(`Audio stream parse error: ${error instanceof Error ? error.message : 'Unknown'}`);
        eventSource?.close();
      }
    };


    eventSource.onerror = (error) => {
      console.error('[AUDIO-STREAM] ❌ EventSource error:', error);
      console.error('[AUDIO-STREAM] readyState:', eventSource?.readyState);
      eventSource?.close();
      onError?.(`Audio stream connection error - readyState: ${eventSource?.readyState}`);
    };

    const cleanup = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    return { messageId: assistant_message_id, transcript, cleanup };

  } catch (error) {
    console.error('[HaleyAPI] Audio Error:', error);
    if (eventSource) eventSource.close();
    onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/logic/system/health`);
    if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
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
    return {
      os: 'Haley OS',
      kernel_status: { kernel: 'Logic Engine', syscalls: 0, processes: 1, modules: 0, memory_keys: 0 },
      baby_pid: 1001,
      note: 'Multi-LLM Router Active'
    };
  }
}

/**
 * Load all conversations for a user from Mama Haley (backend)
 * TRUTH MODEL: Mama Haley owns persistence, Baby Haley requests data
 */
export async function loadAllConversations(userId: string, limit: number = 50) {
  try {
    const response = await fetch(`${BACKEND_URL}/chat/conversations/${userId}?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to load conversations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('[API] Load conversations failed:', error);
    return [];
  }
}

/**
 * Load a specific conversation from Mama Haley (backend)
 * TRUTH MODEL: Mama Haley owns persistence, Baby Haley requests data
 */
export async function loadConversation(userId: string, conversationId: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/chat/conversations/${userId}/${conversationId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to load conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Load conversation failed:', error);
    return null;
  }
}

/**
 * Delete a conversation via Mama Haley (backend)
 * TRUTH MODEL: Mama Haley owns persistence, Baby Haley requests deletion
 */
export async function deleteConversation(userId: string, conversationId: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/chat/conversations/${userId}/${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Delete conversation failed:', error);
    throw error;
  }
}

export { BACKEND_URL };
