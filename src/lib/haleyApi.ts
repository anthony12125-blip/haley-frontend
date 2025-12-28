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
    console.log('[API] 🔵 sendMessage() ENTRY');
    console.log('[API]    provider:', provider);
    console.log('[API]    message:', message);
    console.log('[API]    BACKEND_URL:', BACKEND_URL);

    if (!provider) {
      const error = 'Provider must be specified - no model selected';
      console.error('[API] ❌ FATAL:', error);
      onError?.(error);
      throw new Error(error);
    }

    console.log('[API] ====== ASYNC SEND MESSAGE ======');
    console.log('[API] Provider:', provider);
    console.log('[API] Files attached:', files?.length || 0);
    console.log('[DEBUG] Files array:', files);
    console.log('[API] 🌐 About to fetch:', `${BACKEND_URL}/chat/submit`);

    let submitResponse: Response;

    // Log payload type before fetch
    console.log(`[DEBUG] Attempting fetch with ${files && files.length > 0 ? 'FormData' : 'JSON'} payload`);

    try {
      // Use FormData if files are present, otherwise JSON
      if (files && files.length > 0) {
        console.log('[DEBUG] Using FormData path');
        const formData = new FormData();
        formData.append('conversation_id', 'default');
        formData.append('user_id', 'user');
        formData.append('message', message);
        formData.append('provider', provider || 'haley');

        // Append each file
        files.forEach((file, index) => {
          console.log(`[DEBUG] Processing file ${index}:`, file);
          formData.append(`file_${index}`, file, file.name);
          console.log(`[API] Attached file ${index}: ${file.name} (${file.size} bytes)`);
        });

        console.log('[DEBUG] FormData prepared, calling fetch...');
        // IMPORTANT: Do NOT set Content-Type header for FormData
        // Browser will auto-set it with correct multipart/form-data boundary
        submitResponse = await fetch(`${BACKEND_URL}/chat/submit`, {
          method: 'POST',
          body: formData,
          // NO headers - let browser handle Content-Type with boundary
        });
        console.log('[DEBUG] Fetch with FormData completed');
      } else {
        console.log('[DEBUG] Using JSON path (no files)');
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
        console.log('[DEBUG] Fetch with JSON completed');
      }
    } catch (fetchError) {
      console.error('[DEBUG] ❌ FETCH OPERATION FAILED ❌');
      console.error('[DEBUG] Fetch error:', fetchError);
      console.error('[DEBUG] Fetch error type:', typeof fetchError);
      console.error('[DEBUG] Fetch error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      throw fetchError;
    }

    console.log('[API] ✅ Fetch completed. Status:', submitResponse.status, submitResponse.statusText);

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('[API] ❌ Submit failed:', submitResponse.status, errorText);
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const responseData = await submitResponse.json();
    const { assistant_message_id } = responseData;
    console.log('[API] ✅ Message submitted successfully');
    console.log('[API]    assistant_message_id:', assistant_message_id);
    console.log('[API] 📡 Creating EventSource...');

    const streamUrl = `${BACKEND_URL}/chat/stream/${assistant_message_id}`;
    console.log('[API]    Stream URL:', streamUrl);

    eventSource = new EventSource(streamUrl);
    console.log('[API] ✅ EventSource created, waiting for connection...');

    let fullResponse = '';
    let metadata: any = {};

    eventSource.onopen = () => {
      console.log('[API] ✅✅✅ EventSource CONNECTED - stream is live! ✅✅✅');
    };

    eventSource.onmessage = (event) => {
      console.log('[API] 📨 EventSource message event fired');
      console.log('[API]    Raw data:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('[API]    Parsed type:', data.type);

        if (data.type === 'token') {
          fullResponse += data.content;
          console.log('[API] 🔤 TOKEN RECEIVED - calling onToken()');
          console.log('[API]    Content:', data.content);
          console.log('[API]    Full response so far:', fullResponse.substring(0, 50) + '...');
          onToken?.(data.content);
          console.log('[API] ✅ onToken() called');
        } else if (data.type === 'done') {
          metadata = data.metadata || {};

          // Extract final response from done event (backend may send complete text)
          const finalResponse = data.result?.response || data.response || fullResponse;

          // If final response differs from accumulated response, send final token update
          if (finalResponse && finalResponse !== fullResponse && finalResponse.length > fullResponse.length) {
            const remainingContent = finalResponse.substring(fullResponse.length);
            console.log('[API] 📝 Sending final token update with remaining content');
            onToken?.(remainingContent);
            fullResponse = finalResponse;
          }

          console.log('[API] ✅✅✅ STREAM COMPLETE - calling onComplete() ✅✅✅');
          console.log('[API]    Final response length:', fullResponse.length);
          eventSource?.close();
          onComplete?.({
            status: 'completed',
            result: { response: fullResponse, ...metadata },
            model_used: provider,
            task: metadata.task || 'general',
            operation: 'chat',
            baby_invoked: metadata.baby_invoked || false
          });
          console.log('[API] ✅ onComplete() called');
        } else if (data.type === 'error') {
          console.error('[API] ❌ Stream error:', data.error);
          eventSource?.close();
          onError?.(data.error);
        } else if (data.type === 'status') {
          console.log('[API] ℹ️ Status update:', data.status);
        }
      } catch (error) {
        console.error('[API] ❌ Parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[API] ❌❌❌ EventSource ERROR ❌❌❌');
      console.error('[API]    Error object:', error);
      console.error('[API]    ReadyState:', eventSource?.readyState);
      eventSource?.close();
      onError?.('Connection lost');
    };

    const cleanup = () => {
      if (eventSource) {
        console.log('[API] Cleaning up EventSource');
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
  console.log('[API] ====== MULTI-LLM QUERY ======');
  console.log('[API] Providers:', providers);
  console.log('[API] Message:', message);
  console.log('[API] Files attached:', files?.length || 0);
  console.log('[DEBUG] Files array in multi-LLM:', files);

  const streams = await Promise.all(
    providers.map(async (provider) => {
      try {
        console.log(`[DEBUG] Sending to provider ${provider} with files:`, files?.length || 0);
        const { messageId, cleanup } = await sendMessage(
          message,
          provider,
          (token) => onProviderToken?.(provider, token),
          (response) => onProviderComplete?.(provider, response),
          (error) => onProviderError?.(provider, error),
          files
        );
        console.log(`[DEBUG] Provider ${provider} initialized successfully`);

        return { provider, messageId, cleanup };
      } catch (error) {
        console.error(`[API] Failed to initialize stream for ${provider}:`, error);
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
      console.error('[API] ❌ FATAL:', error);
      onError?.(error);
      throw new Error(error);
    }

    console.log('[API] ====== ASYNC SEND AUDIO MESSAGE ======');
    console.log('[API] Provider:', provider);
    console.log('[API] Audio blob size:', audioBlob.size, 'bytes');
    console.log('[API] Audio blob type:', audioBlob.type);

    // Create form data with audio file
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'voice_message.webm');

    // conversation_id and provider go in URL query params, not form body
    const audioUrl = `${BACKEND_URL}/chat/submit/audio?conversation_id=default&provider=${provider}`;
    console.log('[API] 🌐 Posting to:', audioUrl);

    const submitResponse = await fetch(audioUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('[API] 📥 Response status:', submitResponse.status, submitResponse.statusText);

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('[API] ❌ Audio submit failed:', errorText);
      throw new Error(`Audio submit failed: ${submitResponse.status} - ${errorText}`);
    }

    const responseData = await submitResponse.json();
    console.log('[API] 📦 Response data:', responseData);
    const { assistant_message_id, transcript } = responseData;
    console.log('[API] ✅ Audio message submitted, ID:', assistant_message_id);
    console.log('[API] 📝 Transcript received:', transcript);

    eventSource = new EventSource(`${BACKEND_URL}/chat/stream/${assistant_message_id}`);

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
          console.error('[API] Stream error:', data.error);
          eventSource?.close();
          onError?.(data.error);
        }
      } catch (error) {
        console.error('[API] Parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[API] EventSource error:', error);
      eventSource?.close();
      onError?.('Connection lost');
    };

    const cleanup = () => {
      if (eventSource) {
        console.log('[API] Cleaning up EventSource');
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
